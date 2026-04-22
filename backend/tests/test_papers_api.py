"""
Test-driven development implementation for papers API.
Following TDD principles: write tests first, then implement functionality.
"""

import json
import os
import tempfile
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from rest_framework import status
from papers.models import Paper, DocumentChunk
from papers.services.simple_pdf_processor import SimplePDFProcessor


class PaperUploadAPITestCase(TestCase):
    """Test cases for paper upload API following TDD principles."""
    
    def setUp(self):
        """Set up test environment."""
        self.client = Client()
        self.upload_url = '/api/papers/'
        
    def create_test_pdf(self, content="Test PDF Content"):
        """Create a test PDF file for testing."""
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        p.drawString(100, 750, content)
        p.save()
        
        buffer.seek(0)
        return SimpleUploadedFile(
            "test.pdf",
            buffer.read(),
            content_type="application/pdf"
        )
    
    def test_upload_valid_pdf_success(self):
        """Test: Valid PDF upload should succeed."""
        # Arrange: Create test PDF
        test_pdf = self.create_test_pdf("Test PDF for upload")
        
        # Act: Upload the PDF
        response = self.client.post(self.upload_url, {'file': test_pdf})
        
        # Assert: Verify successful upload
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        
        # Verify response structure
        self.assertIn('id', response_data)
        self.assertIn('status', response_data)
        self.assertIn('message', response_data)
        self.assertIn('debug_info', response_data)
        
        # Verify database state
        self.assertEqual(Paper.objects.count(), 1)
        paper = Paper.objects.first()
        self.assertEqual(paper.status, 'ready')
        self.assertTrue(paper.file_url.endswith('.pdf'))
        
        # Verify text chunks created
        self.assertEqual(DocumentChunk.objects.count(), 1)
        chunk = DocumentChunk.objects.first()
        self.assertEqual(chunk.paper, paper)
        self.assertIn('Test PDF for upload', chunk.text)
    
    def test_upload_non_pdf_file_rejected(self):
        """Test: Non-PDF file upload should be rejected."""
        # Arrange: Create text file
        test_file = SimpleUploadedFile(
            "test.txt",
            b"This is not a PDF file",
            content_type="text/plain"
        )
        
        # Act: Attempt upload
        response = self.client.post(self.upload_url, {'file': test_file})
        
        # Assert: Verify rejection
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        
        self.assertEqual(response_data['error'], 'Only PDF files are allowed')
        self.assertIn('debug_info', response_data)
        self.assertEqual(response_data['debug_info']['file_extension'], 'txt')
        
        # Verify no database changes
        self.assertEqual(Paper.objects.count(), 0)
        self.assertEqual(DocumentChunk.objects.count(), 0)
    
    def test_upload_large_file_rejected(self):
        """Test: Large file upload should be rejected."""
        # Arrange: Create large PDF (>10MB)
        large_content = "X" * (11 * 1024 * 1024)  # 11MB
        large_file = SimpleUploadedFile(
            "large.pdf",
            large_content.encode(),
            content_type="application/pdf"
        )
        
        # Act: Attempt upload
        response = self.client.post(self.upload_url, {'file': large_file})
        
        # Assert: Verify rejection
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        
        self.assertEqual(response_data['error'], 'File size must be less than 10MB')
        self.assertIn('debug_info', response_data)
        self.assertGreater(response_data['debug_info']['file_size'], 10 * 1024 * 1024)
        
        # Verify no database changes
        self.assertEqual(Paper.objects.count(), 0)
    
    def test_upload_no_file_rejected(self):
        """Test: Upload without file should be rejected."""
        # Act: Attempt upload without file
        response = self.client.post(self.upload_url, {})
        
        # Assert: Verify rejection
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = response.json()
        
        self.assertEqual(response_data['error'], 'No file provided')
        self.assertFalse(response_data['debug_info']['has_files'])
        
        # Verify no database changes
        self.assertEqual(Paper.objects.count(), 0)
    
    def test_upload_duplicate_paper_detected(self):
        """Test: Duplicate paper upload should return existing paper."""
        # Arrange: Create and upload first PDF
        test_pdf = self.create_test_pdf("Duplicate content")
        response1 = self.client.post(self.upload_url, {'file': test_pdf})
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Reset file pointer for second upload
        test_pdf.seek(0)
        
        # Act: Upload same PDF again
        response2 = self.client.post(self.upload_url, {'file': test_pdf})
        
        # Assert: Verify duplicate detection
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        response_data = response2.json()
        
        self.assertEqual(response_data['message'], 'Paper already exists')
        self.assertIn('existing_paper_id', response_data['debug_info'])
        
        # Verify only one paper in database
        self.assertEqual(Paper.objects.count(), 1)
    
    def test_upload_pdf_processing_failure(self):
        """Test: PDF processing failure should handle gracefully."""
        # Arrange: Create PDF and mock processor to fail
        test_pdf = self.create_test_pdf("Test content")
        
        with patch.object(SimplePDFProcessor, 'process_pdf') as mock_process:
            mock_process.return_value = {
                'success': False,
                'error': 'Simulated processing failure'
            }
            
            # Act: Upload PDF
            response = self.client.post(self.upload_url, {'file': test_pdf})
            
            # Assert: Verify error handling
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            response_data = response.json()
            
            self.assertIn('PDF processing failed', response_data['error'])
            self.assertIn('processing_error', response_data['debug_info'])
            
            # Verify paper exists but marked as failed
            self.assertEqual(Paper.objects.count(), 1)
            paper = Paper.objects.first()
            self.assertEqual(paper.status, 'failed')  # Status should be failed after processing failure


class PaperListAPITestCase(TestCase):
    """Test cases for paper list API."""
    
    def setUp(self):
        """Set up test environment."""
        self.client = Client()
        self.list_url = '/api/papers/list/'
        
        # Create test papers
        self.paper1 = Paper.objects.create(
            title="Test Paper 1",
            authors=["Author 1"],
            abstract="Abstract 1",
            status="ready"
        )
        self.paper2 = Paper.objects.create(
            title="Test Paper 2",
            authors=["Author 2"],
            abstract="Abstract 2",
            status="processing"
        )
    
    def test_list_papers_success(self):
        """Test: List papers should return all papers."""
        # Act: Get papers list
        response = self.client.get(self.list_url)
        
        # Assert: Verify successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        
        # Verify response structure
        self.assertIn('papers', response_data)
        self.assertIn('count', response_data)
        
        # Verify papers data
        papers = response_data['papers']
        self.assertEqual(len(papers), 2)
        
        # Verify paper fields
        for paper in papers:
            self.assertIn('id', paper)
            self.assertIn('title', paper)
            self.assertIn('authors', paper)
            self.assertIn('status', paper)
            self.assertIn('uploaded_at', paper)
    
    def test_list_papers_empty(self):
        """Test: List papers when no papers exist."""
        # Arrange: Delete all papers
        Paper.objects.all().delete()
        
        # Act: Get papers list
        response = self.client.get(self.list_url)
        
        # Assert: Verify empty response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        
        self.assertEqual(response_data['count'], 0)
        self.assertEqual(len(response_data['papers']), 0)


class PaperStatusAPITestCase(TestCase):
    """Test cases for paper status API."""
    
    def setUp(self):
        """Set up test environment."""
        self.client = Client()
        self.paper = Paper.objects.create(
            title="Test Paper",
            authors=["Test Author"],
            abstract="Test Abstract",
            status="ready"
        )
        self.status_url = f'/api/papers/{self.paper.id}/status/'
    
    def test_get_paper_status_success(self):
        """Test: Get paper status should return paper details."""
        # Act: Get paper status
        response = self.client.get(self.status_url)
        
        # Assert: Verify successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        
        # Verify paper details
        self.assertEqual(str(response_data['id']), str(self.paper.id))
        self.assertEqual(response_data['title'], self.paper.title)
        self.assertEqual(response_data['status'], self.paper.status)
        self.assertIn('uploaded_at', response_data)
    
    def test_get_nonexistent_paper_status_404(self):
        """Test: Get status for non-existent paper should return 404."""
        # Act: Get status for non-existent paper (using valid UUID format)
        fake_uuid = "12345678-1234-5678-9abc-123456789012"
        response = self.client.get(f'/api/papers/{fake_uuid}/status/')
        
        # Assert: Verify 404 response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PaperProcessingTestCase(TestCase):
    """Test cases for PDF processing functionality."""
    
    def setUp(self):
        """Set up test environment."""
        self.processor = SimplePDFProcessor()
        self.paper = Paper.objects.create(
            title="Test Paper",
            authors=["Test Author"],
            abstract="Test Abstract",
            status="uploading"
        )
    
    def create_test_pdf_file(self, content="Test content"):
        """Create a test PDF file on disk."""
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        temp_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        c = canvas.Canvas(temp_file.name, pagesize=letter)
        c.drawString(100, 750, content)
        c.save()
        temp_file.close()
        
        return temp_file.name
    
    def test_pdf_processing_success(self):
        """Test: PDF processing should extract text and create chunks."""
        # Arrange: Create test PDF file
        pdf_path = self.create_test_pdf_file("Machine learning is a subset of artificial intelligence.")
        
        try:
            # Act: Process PDF
            result = self.processor.process_pdf(self.paper, pdf_path)
            
            # Assert: Verify successful processing
            self.assertTrue(result['success'])
            self.assertIn('chunks_created', result)
            self.assertGreater(result['chunks_created'], 0)
            
            # Verify database state
            self.paper.refresh_from_db()
            self.assertEqual(self.paper.status, 'ready')
            self.assertIsNotNone(self.paper.processed_at)
            
            # Verify chunks created
            chunks = DocumentChunk.objects.filter(paper=self.paper)
            self.assertGreater(chunks.count(), 0)
            
            # Verify chunk content
            chunk_text = ' '.join(chunk.text for chunk in chunks)
            self.assertIn('Machine learning', chunk_text)
            self.assertIn('artificial intelligence', chunk_text)
            
        finally:
            # Cleanup
            os.unlink(pdf_path)
    
    def test_pdf_processing_corrupted_file(self):
        """Test: Processing corrupted PDF should handle gracefully."""
        # Arrange: Create corrupted PDF file
        corrupted_path = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False).name
        with open(corrupted_path, 'wb') as f:
            f.write(b'This is not a valid PDF file')
        
        try:
            # Act: Process corrupted PDF
            result = self.processor.process_pdf(self.paper, corrupted_path)
            
            # Assert: Verify error handling
            self.assertFalse(result['success'])
            self.assertIn('error', result)
            
            # Verify paper marked as failed
            self.paper.refresh_from_db()
            self.assertEqual(self.paper.status, 'failed')
            
        finally:
            # Cleanup
            os.unlink(corrupted_path)


class PaperIntegrationTestCase(TestCase):
    """Integration tests for complete paper workflow."""
    
    def setUp(self):
        """Set up test environment."""
        self.client = Client()
        self.upload_url = '/api/papers/'
        self.list_url = '/api/papers/list/'
    
    def test_complete_paper_workflow(self):
        """Test: Complete workflow from upload to retrieval."""
        # Step 1: Upload paper
        test_pdf = SimpleUploadedFile(
            "workflow_test.pdf",
            b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Workflow Test) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000206 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF",
            content_type="application/pdf"
        )
        
        upload_response = self.client.post(self.upload_url, {'file': test_pdf})
        self.assertEqual(upload_response.status_code, status.HTTP_200_OK)
        
        paper_id = upload_response.json()['id']
        
        # Step 2: Verify paper appears in list
        list_response = self.client.get(self.list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        
        papers = list_response.json()['papers']
        self.assertEqual(len(papers), 1)
        self.assertEqual(str(papers[0]['id']), paper_id)
        
        # Step 3: Check paper status
        status_response = self.client.get(f'/api/papers/{paper_id}/status/')
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.json()['status'], 'ready')
        
        # Step 4: Verify text chunks created
        paper = Paper.objects.get(id=paper_id)
        chunks = DocumentChunk.objects.filter(paper=paper)
        self.assertGreater(chunks.count(), 0)


# Test Runner and Coverage
if __name__ == '__main__':
    import unittest
    
    # Create test suite
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTest(unittest.makeSuite(PaperUploadAPITestCase))
    suite.addTest(unittest.makeSuite(PaperListAPITestCase))
    suite.addTest(unittest.makeSuite(PaperStatusAPITestCase))
    suite.addTest(unittest.makeSuite(PaperProcessingTestCase))
    suite.addTest(unittest.makeSuite(PaperIntegrationTestCase))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print results
    print(f"\nTest Results:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
