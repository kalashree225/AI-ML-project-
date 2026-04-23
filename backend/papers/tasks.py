import threading
import logging
from django.conf import settings
import os
from .services.simple_pdf_processor import SimplePDFProcessor
from .models import Paper
from django.utils import timezone
import random

logger = logging.getLogger(__name__)

def generate_mock_embedding(dim=1536):
    """Generate a mock OpenAI-like embedding vector"""
    return [random.uniform(-1, 1) for _ in range(dim)]

def process_paper_async(paper_id, file_path):
    """
    Background thread to process PDF, chunk it, and generate embeddings.
    Replaces Celery task in No-Docker mode.
    """
    try:
        paper = Paper.objects.get(id=paper_id)
        paper.status = 'processing'
        paper.save()

        # Extract and chunk
        processor = SimplePDFProcessor()
        result = processor.process_pdf(paper, file_path)

        if not result.get('success'):
            paper.status = 'failed'
            paper.save()
            logger.error(f"Failed to process paper {paper_id}: {result.get('error')}")
            return

        # Generate Embeddings for chunks
        chunks = paper.chunks.all()
        for chunk in chunks:
            # In a real environment, call OpenAI here.
            chunk.embedding = generate_mock_embedding()
            chunk.save()

        paper.status = 'ready'
        paper.processed_at = timezone.now()
        paper.save()
        logger.info(f"Successfully processed paper {paper_id} with embeddings")

    except Exception as e:
        logger.exception(f"Error in async paper processing for {paper_id}: {e}")
        try:
            paper = Paper.objects.get(id=paper_id)
            paper.status = 'failed'
            paper.save()
        except Paper.DoesNotExist:
            pass

def trigger_paper_processing(paper_id, file_path):
    """Starts the background thread"""
    thread = threading.Thread(target=process_paper_async, args=(paper_id, file_path))
    thread.daemon = True
    thread.start()
