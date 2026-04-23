"""
Pytest-style tests for papers API using Django's APIClient.
"""

import pytest
from django.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
from rest_framework import status


@pytest.fixture
def api_client():
    """Fixture for APIClient."""
    return APIClient()


@pytest.fixture
def mock_pdf_processor():
    """Mock SimplePDFProcessor.process_pdf to return success."""
    with patch('papers.services.simple_pdf_processor.SimplePDFProcessor.process_pdf') as mock:
        mock.return_value = {
            'success': True,
            'chunks_created': 3
        }
        yield mock


def test_upload_valid_pdf_success(api_client, mock_pdf_processor):
    """Test: POST /api/papers/ with valid PDF → expect 201, id in response."""
    # Create a mock PDF file
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF"
    test_pdf = SimpleUploadedFile(
        "test.pdf",
        pdf_content,
        content_type="application/pdf"
    )
    
    # Upload the PDF
    response = api_client.post('/api/papers/', {'file': test_pdf}, format='multipart')
    
    # Assert: 201 with id in response
    assert response.status_code == status.HTTP_201_CREATED
    response_data = response.json()
    assert 'id' in response_data


def test_upload_no_file_rejected(api_client):
    """Test: POST /api/papers/ with no file → expect 400."""
    # Upload without file
    response = api_client.post('/api/papers/', {}, format='multipart')
    
    # Assert: 400 error
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    response_data = response.json()
    assert 'error' in response_data or 'file' in response_data


def test_upload_large_file_rejected(api_client):
    """Test: POST /api/papers/ with file > 10MB → expect 400."""
    # Create a mock large PDF (>10MB)
    large_content = b"X" * (11 * 1024 * 1024)  # 11MB
    large_pdf = SimpleUploadedFile(
        "large.pdf",
        large_content,
        content_type="application/pdf"
    )
    
    # Attempt upload
    response = api_client.post('/api/papers/', {'file': large_pdf}, format='multipart')
    
    # Assert: 400 error for file size
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    response_data = response.json()
    assert 'error' in response_data or 'size' in str(response_data).lower()


def test_get_papers_list(api_client):
    """Test: GET /api/papers/list/ → expect 200, returns a list."""
    # Get papers list
    response = api_client.get('/api/papers/list/')
    
    # Assert: 200 with list
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert 'results' in response_data or 'papers' in response_data or isinstance(response_data, list)
