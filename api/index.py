import sys
import os

# Add the parent directory to the path so we can import from backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.compile import app
except ImportError as e:
    # Fallback: create a simple app
    from flask import Flask
    app = Flask(__name__)
    
    @app.route('/health')
    def health():
        return {"status": "healthy", "message": "Simple Flask server is running"}