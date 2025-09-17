#!/usr/bin/env python3
"""
Startup script for Railway deployment
This ensures the Flask app runs correctly in Railway's environment
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the Flask app
from backend.compile import app

if __name__ == '__main__':
    # Get port from environment variable (Railway sets this)
    port = int(os.environ.get('PORT', 8000))
    
    # Run the Flask app
    print(f"Starting CodeArena backend on port {port}")
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )