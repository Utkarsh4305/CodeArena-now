from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import os
import uuid
import traceback
import re
import platform
import shutil
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# More explicit CORS configuration
CORS(app, resources={r"/*": {
    "origins": "http://localhost:3000",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

# Try to import optional formatting libraries
formatters_available = {
    'autopep8': False,
    'jsbeautifier': False,
    'clang_format': False
}

try:
    import autopep8
    formatters_available['autopep8'] = True
except ImportError:
    logger.warning("autopep8 not available. Will use fallback formatter for Python.")

try:
    import jsbeautifier
    formatters_available['jsbeautifier'] = True
except ImportError:
    logger.warning("jsbeautifier not available. Will use fallback formatter for JavaScript.")

try:
    import clang.format
    formatters_available['clang_format'] = True
except ImportError:
    logger.warning("clang-format not available. Will use fallback formatter for C/C++.")

# Configure supported languages
LANGUAGE_CONFIG = {
    "python": {
        "file_extension": ".py",
        "command": ["python", "{file}"],
        "indentation": {
            "method": "autopep8" if formatters_available['autopep8'] else "fallback",
            "indent_size": 4
        }
    },
    "javascript": {
        "file_extension": ".js",
        "command": ["node", "{file}"],
        "indentation": {
            "method": "jsbeautifier" if formatters_available['jsbeautifier'] else "fallback",
            "indent_size": 2
        }
    },
    "java": {
        "file_extension": ".java",
        "file_name": "Main.java",
        "compile_command": ["javac", "-d", "{dir}", "{file}"],
        "run_command": ["java", "-cp", "{dir}", "{class_name}"],
        "requires_specific_name": True,
        "indentation": {
            "method": "fallback",
            "indent_size": 4
        }
    },
    "c": {
        "file_extension": ".c",
        "compile_command": ["gcc", "-o", "{executable}", "{file}"],
        "run_command": ["{executable_path}"],
        "indentation": {
            "method": "clang_format" if formatters_available['clang_format'] else "fallback",
            "indent_size": 4
        }
    },
    "cpp": {
        "file_extension": ".cpp",
        "compile_command": ["g++", "-o", "{executable}", "{file}"],
        "run_command": ["{executable_path}"],
        "indentation": {
            "method": "clang_format" if formatters_available['clang_format'] else "fallback",
            "indent_size": 4
        }
    }
}

def get_indent_level(line, language, indent_size):
    """Calculate the indentation level for a line based on context."""
    stripped = line.strip()
    if not stripped:
        return 0, False

    leading_spaces = len(line) - len(line.lstrip())
    indent_level = leading_spaces // indent_size
    needs_indent = False

    if language == "python":
        if stripped.endswith(":"):
            needs_indent = True
    elif language in ["javascript", "java", "c", "cpp"]:
        if re.search(r'\{$', stripped) or stripped.endswith("{"):
            needs_indent = True
        # Handle cases like 'if (...) { // comment'
        if re.search(r'\{\s*//', stripped):
            needs_indent = True

    return indent_level, needs_indent

def apply_enhanced_indentation(code, language, indent_size=4):
    """Apply language-aware indentation with improved precision."""
    lines = code.split('\n')
    formatted_lines = []
    indent_level = 0
    
    # Language-specific patterns
    if language == "python":
        dedent_triggers = [r'^(elif|else|except|finally)\b']
    elif language in ["javascript", "java", "c", "cpp"]:
        dedent_triggers = [r'^\s*\}', r'^\s*\}\s*else\b', r'^\s*\}\s*//']
    else:
        dedent_triggers = [r'^\s*\}', r'^\s*else\b']

    for line in lines:
        stripped = line.strip()
        if not stripped:
            formatted_lines.append('')
            continue

        # Check for dedent
        needs_dedent = False
        for pattern in dedent_triggers:
            if re.search(pattern, line):
                indent_level = max(0, indent_level - 1)
                needs_dedent = True
                break

        # Apply indentation
        formatted_lines.append(' ' * (indent_level * indent_size) + stripped)

        # Check for indent
        current_level, needs_indent = get_indent_level(line, language, indent_size)
        if needs_indent and not needs_dedent:
            indent_level += 1

    return '\n'.join(formatted_lines)

def indent_single_line(prev_line, language):
    """Compute indentation for a new line based on the previous line."""
    lang_config = LANGUAGE_CONFIG.get(language, {})
    indent_size = lang_config.get("indentation", {}).get("indent_size", 4)
    
    indent_level, needs_indent = get_indent_level(prev_line, language, indent_size)
    if needs_indent:
        indent_level += 1
    
    return ' ' * (indent_level * indent_size)

def format_code(code, language, partial=False):
    """Format code with proper indentation based on language."""
    lang_config = LANGUAGE_CONFIG.get(language, {})
    indent_config = lang_config.get("indentation", {})
    method = indent_config.get("method")
    indent_size = indent_config.get("indent_size", 4)
    
    logger.debug(f"Formatting code for language: {language} using method: {method}")
    
    try:
        if not partial:
            if method == "autopep8" and formatters_available['autopep8']:
                formatted_code = autopep8.fix_code(code, options={'aggressive': 1})
                return formatted_code
            elif method == "jsbeautifier" and formatters_available['jsbeautifier']:
                formatted_code = jsbeautifier.beautify(code, {
                    'indent_size': indent_size,
                    'indent_char': ' ',
                    'preserve_newlines': True,
                    'brace_style': 'collapse',
                    'keep_array_indentation': False
                })
                return formatted_code
            elif method == "clang_format" and formatters_available['clang_format']:
                return clang.format.reformat(code, style={
                    'BasedOnStyle': 'Google',
                    'IndentWidth': indent_size,
                    'UseTab': 'Never',
                    'ColumnLimit': 100,
                    'AlignAfterOpenBracket': 'Align'
                })
        
        return apply_enhanced_indentation(code, language, indent_size)
    
    except Exception as e:
        logger.error(f"Error during code formatting: {str(e)}")
        logger.error(traceback.format_exc())
        return code

def extract_class_name(java_code):
    """Extract the public class name from Java code."""
    match = re.search(r'public\s+class\s+([a-zA-Z0-9_]+)', java_code)
    if match:
        return match.group(1)
    match = re.search(r'class\s+([a-zA-Z0-9_]+)', java_code)
    if match:
        return match.group(1)
    return "Main"

def ensure_java_class_name_matches(code, file_name):
    """Ensure Java code has a class name that matches the file name."""
    class_name = os.path.splitext(os.path.basename(file_name))[0]
    if f"class {class_name}" not in code and f"class  {class_name}" not in code:
        if "public class" in code:
            code = re.sub(r'public\s+class\s+([a-zA-Z0-9_]+)', f'public class {class_name}', code)
        else:
            match = re.search(r'class\s+([a-zA-Z0-9_]+)', code)
            if match:
                code = re.sub(r'class\s+([a-zA-Z0-9_]+)', f'class {class_name}', code)
            else:
                code = f"public class {class_name} {{\n    public static void main(String[] args) {{\n        {code}\n    }}\n}}"
    return code

def run_command(command, cwd=None, timeout=10, stdin_data=None):
    """Run a shell command and return the output."""
    try:
        logger.debug(f"Running command: {command} in directory: {cwd}")
        process = subprocess.Popen(
            command,
            cwd=cwd,
            text=True,
            stdin=subprocess.PIPE if stdin_data else None,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        try:
            stdout, stderr = process.communicate(input=stdin_data, timeout=timeout)
            return {
                "stdout": stdout,
                "stderr": stderr,
                "returncode": process.returncode
            }
        except subprocess.TimeoutExpired:
            process.kill()
            return {
                "stdout": "",
                "stderr": f"Execution timed out after {timeout} seconds",
                "returncode": 124
            }
    except Exception as e:
        logger.error(f"Command execution error: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "stdout": "",
            "stderr": f"Error executing command: {str(e)}",
            "returncode": 1
        }

@app.route('/compile', methods=['OPTIONS'])
def options_compile():
    response = jsonify({"status": "ok"})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/compile', methods=['POST'])
def compile_code():
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    stdin = data.get('stdin', '')
    
    logger.info(f"Received compilation request for language: {language}")

    if language not in LANGUAGE_CONFIG:
        return jsonify({
            "success": False,
            "error": f"Unsupported language: {language}",
            "supported_languages": list(LANGUAGE_CONFIG.keys())
        })

    session_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp(prefix=f"compiler_{session_id}_")
    logger.debug(f"Created temporary directory: {temp_dir}")

    try:
        lang_config = LANGUAGE_CONFIG[language]
        file_extension = lang_config["file_extension"]
        
        formatted_code = format_code(code, language)
        logger.debug("Code formatting applied")
        
        if language == "java" and lang_config.get("requires_specific_name", False):
            file_name = lang_config.get("file_name", f"program{file_extension}")
            formatted_code = ensure_java_class_name_matches(formatted_code, file_name)
        else:
            file_name = f"program{file_extension}"
            
        file_path = os.path.join(temp_dir, file_name)
        logger.debug(f"Writing code to file: {file_path}")

        with open(file_path, 'w') as f:
            f.write(formatted_code)

        result = {
            "original_code": code,
            "formatted_code": formatted_code
        }

        if "compile_command" in lang_config:
            executable = "program"
            if platform.system() == "Windows":
                executable += ".exe"

            executable_path = os.path.join(temp_dir, executable)
            class_name = extract_class_name(formatted_code) if language == "java" else None
            
            if language == "java":
                logger.debug(f"Extracted Java class name: {class_name}")

            compile_cmd = []
            for arg in lang_config["compile_command"]:
                formatted_arg = arg.format(
                    file=file_path,
                    executable=executable,
                    executable_path=executable_path,
                    dir=temp_dir,
                    class_name=class_name
                )
                compile_cmd.append(formatted_arg)
            
            logger.debug(f"Compile command: {compile_cmd}")

            compile_result = run_command(compile_cmd, cwd=temp_dir)
            result["compilation"] = compile_result
            
            logger.debug(f"Compilation result: {compile_result}")

            if compile_result["returncode"] != 0:
                result["success"] = False
                result["phase"] = "compilation"
                return jsonify(result)

            run_cmd = []
            for arg in lang_config["run_command"]:
                formatted_arg = arg.format(
                    file=file_path,
                    executable=executable,
                    executable_path=executable_path,
                    dir=temp_dir,
                    class_name=class_name
                )
                run_cmd.append(formatted_arg)
            
            logger.debug(f"Run command: {run_cmd}")

            run_result = run_command(run_cmd, cwd=temp_dir, stdin_data=stdin)
            result["execution"] = run_result
            result["success"] = run_result["returncode"] == 0
            result["phase"] = "execution"
            
            logger.debug(f"Execution result: {run_result}")

        else:
            run_cmd = []
            for arg in lang_config["command"]:
                formatted_arg = arg.format(file=file_path)
                run_cmd.append(formatted_arg)
            
            logger.debug(f"Run command: {run_cmd}")

            run_result = run_command(run_cmd, cwd=temp_dir, stdin_data=stdin)
            result["execution"] = run_result
            result["success"] = run_result["returncode"] == 0
            result["phase"] = "execution"
            
            logger.debug(f"Execution result: {run_result}")

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error during compilation/execution: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        })
    finally:
        try:
            logger.debug(f"Cleaning up temporary directory: {temp_dir}")
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as e:
            logger.error(f"Error cleaning up: {str(e)}")

@app.route('/indentation_test', methods=['POST'])
def test_indentation():
    """Endpoint to format entire code block."""
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    if language not in LANGUAGE_CONFIG:
        return jsonify({
            "success": False,
            "error": f"Unsupported language: {language}"
        })
    
    try:
        formatted_code = format_code(code, language)
        return jsonify({
            "success": True,
            "original_code": code,
            "formatted_code": formatted_code,
            "formatters_available": formatters_available
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "formatters_available": formatters_available
        })

@app.route('/indent_line', methods=['POST'])
def indent_line():
    """Endpoint to compute indentation for a single new line."""
    data = request.json
    prev_line = data.get('prev_line', '')
    language = data.get('language', 'python')
    
    if language not in LANGUAGE_CONFIG:
        return jsonify({
            "success": False,
            "error": f"Unsupported language: {language}"
        })
    
    try:
        indentation = indent_single_line(prev_line, language)
        return jsonify({
            "success": True,
            "indentation": indentation
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Flask server is running correctly"})

@app.route('/formatters_status', methods=['GET'])
def formatters_status():
    return jsonify({
        "formatters_available": formatters_available,
        "status": "ok"
    })

@app.route('/test', methods=['GET'])
def test_languages():
    results = {}
    test_programs = {
        "python": """
def factorial(n):
if n <= 1:
return 1
else:
return n * factorial(n-1)

print(factorial(5))
        """,
        "javascript": """
function factorial(n) {
if (n <= 1) {
return 1;
} else {
return n * factorial(n-1);
}
}
console.log(factorial(5));
        """,
        "java": """
public class Main {
public static void main(String[] args) {
System.out.println(factorial(5));
}

public static int factorial(int n) {
if (n <= 1) {
return 1;
} else {
return n * factorial(n-1);
}
}
}
        """,
        "c": """
#include <stdio.h>

int factorial(int n) {
if (n <= 1) {
return 1;
} else {
return n * factorial(n-1);
}
}

int main() {
printf("%d\\n", factorial(5));
return 0;
}
        """,
        "cpp": """
#include <iostream>

int factorial(int n) {
if (n <= 1) {
return 1;
} else {
return n * factorial(n-1);
}
}

int main() {
std::cout << factorial(5) << std::endl;
return 0;
}
        """
    }
    
    for lang, program in test_programs.items():
        try:
            logger.info(f"Testing {lang} compiler with auto-indentation")
            formatted_code = format_code(program, lang)
            results[lang] = {
                "original": program,
                "formatted": formatted_code,
                "success": True
            }
        except Exception as e:
            results[lang] = {
                "success": False,
                "error": f"Test failed with exception: {str(e)}"
            }
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)