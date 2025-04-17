from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
import re
from typing import Dict, Any, Optional
import logging
import html

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/evaluate": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})


# OpenRouter API configuration
OPENROUTER_API_KEY = "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"
OPENROUTER_MODEL = "meta-llama/llama-4-maverick:free"


class CodeEvaluator:
    """
    A class to evaluate code using the Open Router API.
    """
    def __init__(self, api_key: str, model: str = "meta-llama/llama-4-maverick:free"):
        """
        Initialize the code evaluator with API key and model.
        
        Args:
            api_key: Open Router API key
            model: Model to use for evaluation
        """
        self.api_key = api_key
        self.model = model
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://localhost:5001",  # Required by some API providers
            "X-Title": "Code Evaluation Tool"  # Identify your application
        }

    def evaluate_code(self, code: str, language: str, question: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluate the provided code against a question or requirements.
        
        Args:
            code: The code to evaluate
            language: Programming language of the code
            question: The problem statement or requirements the code should address
            
        Returns:
            Dictionary containing evaluation results
        """
        prompt = self._build_evaluation_prompt(code, language, question)
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a code evaluation expert. Analyze code for correctness, efficiency, and best practices."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1500,
            "temperature": 0.1
        }
        
        logger.debug(f"Sending request to {self.api_url}")
        logger.debug(f"Headers: {self.headers}")
        logger.debug(f"Payload: {json.dumps(payload, indent=2)}")
        
        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30  # Add a timeout to prevent hanging
            )
            
            logger.debug(f"Response status code: {response.status_code}")
            
            # Try to get JSON even if status code indicates error
            response_json = None
            try:
                response_json = response.json()
                logger.debug(f"Response JSON: {json.dumps(response_json, indent=2)}")
            except Exception as e:
                logger.error(f"Failed to parse JSON response: {str(e)}")
                logger.debug(f"Response content: {response.text}")
            
            # Now raise for status if needed
            response.raise_for_status()
            
            # If we made it here, we have a successful response
            if response_json and "choices" in response_json and len(response_json["choices"]) > 0:
                evaluation = response_json["choices"][0]["message"]["content"]
                
                # Strip HTML and convert to plain text
                plain_text_evaluation = self._convert_html_to_text(evaluation)
                
                # Extract or calculate grade
                grade = self._extract_grade(evaluation)
                if grade is None:
                    grade = self._calculate_grade(evaluation)
                
                return {
                    "success": True,
                    "evaluation": plain_text_evaluation,
                    "grade": grade,
                    "result": "success",  # For backward compatibility with your frontend
                    "review": plain_text_evaluation  # For backward compatibility with your frontend
                }
            else:
                error_msg = "No evaluation returned from API"
                if response_json:
                    error_msg += f": {json.dumps(response_json)}"
                logger.error(error_msg)
                
                return {
                    "success": False,
                    "error": error_msg,
                    "grade": 0,
                    "result": "error",  # For backward compatibility
                    "review": "Failed to evaluate code. Please try again later."  # For frontend display
                }
                
        except requests.exceptions.RequestException as e:
            error_msg = f"API request failed: {str(e)}"
            logger.error(error_msg)
            
            return {
                "success": False,
                "error": error_msg,
                "grade": 0,
                "result": "error",
                "review": "API request failed. Please check your connection or try again later."
            }
            
        except Exception as e:
            error_msg = f"Unexpected error during evaluation: {str(e)}"
            logger.error(error_msg)
            
            return {
                "success": False,
                "error": error_msg,
                "grade": 0,
                "result": "error",
                "review": "An unexpected error occurred. Please try again later."
            }

    def _build_evaluation_prompt(self, code: str, language: str, question: Optional[str] = None) -> str:
        """
        Build a prompt for code evaluation.
        """
        # Try to detect language if not specified or is empty
        if not language or language.strip() == "":
            # Simple language detection based on code content
            language = self._detect_language(code)
            
        if question:
            prompt = f""" 
Please evaluate the following {language} code that is supposed to solve this problem:

PROBLEM:
{question}

CODE:
```{language}
{code}
```

Provide a detailed evaluation covering:
1. Correctness: Does the code correctly solve the problem?
2. Efficiency: Is the code efficient? Are there any performance concerns?
3. Code quality: Is the code well-structured, readable, and maintainable?
4. Best practices: Does the code follow language-specific best practices?
5. Suggestions for improvement

Please conclude with a numerical grade out of 10 for the overall code quality.
End your review with a clear "Final Grade: X/10" where X is your numerical assessment.

Format your response as plain text. DO NOT use HTML tags like <h2>, <p>, <ul>, etc. 
Instead, use Markdown formatting like ## for headings, * for bullet points.
"""
        else:
            prompt = f"""
Please evaluate the following {language} code:

```{language}
{code}
```

Provide a detailed evaluation covering:
1. Functionality: What does this code do?
2. Efficiency: Is the code efficient? Are there any performance concerns?
3. Code quality: Is the code well-structured, readable, and maintainable?
4. Best practices: Does the code follow language-specific best practices?
5. Suggestions for improvement

Please conclude with a numerical grade out of 10 for the overall code quality.
End your review with a clear "Final Grade: X/10" where X is your numerical assessment.

Format your response as plain text. DO NOT use HTML tags like <h2>, <p>, <ul>, etc. 
Instead, use Markdown formatting like ## for headings, * for bullet points.
"""
        return prompt

    def _detect_language(self, code: str) -> str:
        """
        Simple language detection based on code content.
        """
        code = code.lower()
        
        if "def " in code and ":" in code:
            return "python"
        elif "function" in code and ("{" in code or "=>" in code):
            return "javascript"
        elif "<html" in code or "</div>" in code:
            return "html"
        elif "public class" in code or "private void" in code:
            return "java"
        elif "#include" in code and ("int main" in code or "void main" in code):
            return "c++"
        elif "package main" in code or "func " in code and "{" in code:
            return "go"
        else:
            return "code"  # Generic fallback

    def _convert_html_to_text(self, text: str) -> str:
        """
        Convert HTML formatted text to plain text.
        """
        # Check if the text contains HTML tags
        if re.search(r'<[^>]+>', text):
            # Replace common HTML tags with their plain text or markdown equivalents
            # Replace headings
            text = re.sub(r'<h1>(.*?)</h1>', r'# \1\n', text)
            text = re.sub(r'<h2>(.*?)</h2>', r'## \1\n', text)
            text = re.sub(r'<h3>(.*?)</h3>', r'### \1\n', text)
            
            # Replace paragraphs
            text = re.sub(r'<p>(.*?)</p>', r'\1\n\n', text)
            
            # Replace lists
            text = re.sub(r'<ul>(.*?)</ul>', r'\1\n', text, flags=re.DOTALL)
            text = re.sub(r'<li>(.*?)</li>', r'* \1\n', text)
            
            # Replace code tags
            text = re.sub(r'<code>(.*?)</code>', r'`\1`', text, flags=re.DOTALL)
            text = re.sub(r'<pre><code>(.*?)</code></pre>', r'```\n\1\n```', text, flags=re.DOTALL)
            
            # Remove any remaining HTML tags
            text = re.sub(r'<[^>]+>', '', text)
            
            # Decode HTML entities
            text = html.unescape(text)
            
            # Fix multiple newlines
            text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text

    def _extract_grade(self, evaluation: str) -> Optional[float]:
        """
        Extract the grade from the evaluation text.
        """
        # Look for patterns like "Final Grade: 8/10" or "Grade: 8 out of 10"
        patterns = [
            r'Final Grade:\s*(\d+(?:\.\d+)?)/10',
            r'Grade:\s*(\d+(?:\.\d+)?)/10',
            r'Overall Grade:\s*(\d+(?:\.\d+)?)/10',
            r'Score:\s*(\d+(?:\.\d+)?)/10',
            r'Rating:\s*(\d+(?:\.\d+)?)/10',
            r'grade of (\d+(?:\.\d+)?)/10',
            r'grade: (\d+(?:\.\d+)?)/10',
            r'(\d+(?:\.\d+)?)/10'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, evaluation, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    pass
        
        return None
    
    def _calculate_grade(self, evaluation: str) -> float:
        """
        Calculate a grade if one wasn't explicitly provided.
        This is a fallback method that uses simple heuristics.
        """
        grade = 7.0  # Start with a default grade
        
        # Adjust grade based on positive indicators
        positive_indicators = [
            "excellent", "great", "well structured", "efficient", "clean", 
            "maintainable", "good practice", "best practice", "well organized"
        ]
        
        # Adjust grade based on negative indicators
        negative_indicators = [
            "error", "bug", "issue", "inefficient", "confusing", "poor", 
            "bad practice", "fix", "problem", "security vulnerability", 
            "missing", "redundant", "unnecessary"
        ]
        
        # Count occurrences of indicators
        positive_count = sum(evaluation.lower().count(indicator) for indicator in positive_indicators)
        negative_count = sum(evaluation.lower().count(indicator) for indicator in negative_indicators)
        
        # Adjust grade based on sentiment
        adjustment = min(2.5, positive_count * 0.2) - min(4, negative_count * 0.25)
        grade = max(1, min(10, grade + adjustment))
        
        return round(grade, 1)


# Initialize the code evaluator
evaluator = CodeEvaluator(OPENROUTER_API_KEY, OPENROUTER_MODEL)

# Add a route handler specifically for OPTIONS requests to /evaluate
@app.route('/evaluate', methods=['OPTIONS'])
def options_evaluate():
    # Just return 200 OK for OPTIONS requests
    return '', 200

@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.json
    logger.info(f"Received evaluation request: {json.dumps(data, indent=2)}")
    
    question = data.get('question', '')
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    if not code:
        logger.warning("Evaluation request received with no code")
        return jsonify({
            "success": False,
            "error": "No code provided",
            "grade": 0,
            "result": "error",
            "review": "No code provided for evaluation"
        }), 400
    
    # Evaluate the code using the OpenRouter API
    result = evaluator.evaluate_code(code, language, question)
    logger.info(f"Evaluation completed with success={result.get('success', False)}, grade={result.get('grade', 'N/A')}")
    
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint to verify the API is running
    """
    return jsonify({"status": "ok", "message": "API is running"})

if __name__ == '__main__':
    logger.info("Starting Code Evaluation API server on port 5001")
    app.run(debug=True, port=5001)