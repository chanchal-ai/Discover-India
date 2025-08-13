#!/usr/bin/env python3
"""
Startup script for Discover India Tourism Recommendation System
"""

import os
import sys
import subprocess

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import flask
        import pandas
        import sklearn
        import numpy
        print("✅ All dependencies are installed!")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_data_file():
    """Check if the data file exists"""
    data_file = "data/places_clean.csv"
    if os.path.exists(data_file):
        print("✅ Data file found!")
        return True
    else:
        print(f"❌ Data file not found: {data_file}")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting Discover India Tourism Recommendation System")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check data file
    if not check_data_file():
        sys.exit(1)
    
    print("\n🎯 Starting Flask application...")
    print("📱 Open your browser and go to: http://localhost:5000")
    print("⏹️  Press Ctrl+C to stop the application")
    print("=" * 60)
    
    try:
        # Start the Flask app
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
