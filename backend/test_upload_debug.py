#!/usr/bin/env python
"""
Test script to verify PDF upload debugging functionality.
Run this script to test the upload endpoint directly.
"""

import os
import sys
import requests
import json
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Test configuration
BASE_URL = "http://localhost:8000"
UPLOAD_URL = f"{BASE_URL}/api/papers/"  # Fixed: removed /upload/ since upload is at root
TEST_PDF_PATH = backend_dir / "test_document.pdf"

def create_test_pdf():
    """Create a simple test PDF for testing."""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        # Create a simple test PDF
        c = canvas.Canvas(str(TEST_PDF_PATH), pagesize=letter)
        c.drawString(100, 750, "Test PDF Document")
        c.drawString(100, 730, "This is a test PDF for upload debugging.")
        c.drawString(100, 710, "Content: Machine learning is a subset of artificial intelligence.")
        c.drawString(100, 690, "Deep learning uses neural networks with multiple layers.")
        c.drawString(100, 670, "Natural language processing helps computers understand text.")
        c.save()
        
        print(f"✅ Created test PDF: {TEST_PDF_PATH}")
        return True
        
    except ImportError:
        print("❌ reportlab not installed. Creating a simple text file instead.")
        # Create a simple text file as fallback
        with open(TEST_PDF_PATH.with_suffix('.txt'), 'w') as f:
            f.write("Test document content for upload debugging.\n")
            f.write("This is a test document.\n")
            f.write("Machine learning and AI research content.\n")
        return False
    except Exception as e:
        print(f"❌ Failed to create test PDF: {e}")
        return False

def test_upload_endpoint():
    """Test the upload endpoint with debugging."""
    print("\n🔍 Testing PDF Upload Endpoint")
    print("=" * 50)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/api/", timeout=5)
        print(f"✅ Backend is running at {BASE_URL}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend not running at {BASE_URL}: {e}")
        print("Please start the Django backend first:")
        print("  cd backend && python manage.py runserver")
        return False
    
    # Test file upload
    test_file = TEST_PDF_PATH
    if not test_file.exists():
        test_file = TEST_PDF_PATH.with_suffix('.txt')
    
    if not test_file.exists():
        print(f"❌ Test file not found: {test_file}")
        return False
    
    print(f"\n📁 Uploading test file: {test_file}")
    print(f"📊 File size: {test_file.stat().st_size} bytes")
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': f}
            data = {}
            
            print("\n🚀 Sending upload request...")
            response = requests.post(
                UPLOAD_URL,
                files=files,
                data=data,
                timeout=30
            )
        
        print(f"\n📥 Response Status: {response.status_code}")
        print(f"📥 Response Headers: {dict(response.headers)}")
        
        try:
            response_json = response.json()
            print(f"📥 Response Body:")
            print(json.dumps(response_json, indent=2))
        except json.JSONDecodeError:
            print(f"📥 Response Text: {response.text}")
        
        if response.status_code == 200:
            print("\n✅ Upload successful!")
            return True
        else:
            print(f"\n❌ Upload failed with status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_invalid_upload():
    """Test upload with invalid data to verify error handling."""
    print("\n🔍 Testing Invalid Upload Scenarios")
    print("=" * 50)
    
    # Test 1: No file
    print("\n📝 Test 1: Upload without file")
    try:
        response = requests.post(UPLOAD_URL, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 400:
            print("✅ Correctly rejected empty upload")
        else:
            print("❌ Should have returned 400")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Invalid file type
    print("\n📝 Test 2: Upload non-PDF file")
    try:
        # Create a temporary text file
        with open('temp_test.txt', 'w') as f:
            f.write("This is not a PDF file")
        
        with open('temp_test.txt', 'rb') as f:
            files = {'file': f}
            response = requests.post(UPLOAD_URL, files=files, timeout=10)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 400:
            print("✅ Correctly rejected non-PDF file")
        else:
            print("❌ Should have returned 400")
        
        # Clean up
        os.remove('temp_test.txt')
        
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main test function."""
    print("🔍 ResearchMind Upload Debugging Test")
    print("=" * 50)
    
    # Create test file
    if not create_test_pdf():
        print("⚠️  Using text file instead of PDF")
    
    # Test upload functionality
    success = test_upload_endpoint()
    
    # Test error handling
    test_invalid_upload()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Upload debugging test completed successfully!")
        print("📝 Check the backend console and debug.log for detailed logs")
    else:
        print("❌ Upload debugging test failed!")
        print("📝 Check the backend console and debug.log for error details")
    
    print("\n🔍 Debug locations:")
    print("  - Console output: Django server terminal")
    print(f"  - Log file: {backend_dir}/debug.log")
    print("  - Frontend: Browser developer tools")

if __name__ == "__main__":
    main()
