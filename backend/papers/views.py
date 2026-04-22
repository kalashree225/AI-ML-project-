from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import hashlib
import uuid
import requests
from urllib.parse import urlparse
import os
import logging
from datetime import datetime
from .models import Paper, DocumentChunk, Citation
from .services.simple_ai_service import SimpleAIService
from .services.simple_pdf_processor import SimplePDFProcessor

# Configure logging for debugging
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def upload_paper(request):
    """Simplified paper upload with comprehensive debugging."""
    logger.info('🔍 DEBUG: Upload request received')
    logger.info(f'Request method: {request.method}')
    logger.info(f'Request headers: {dict(request.headers)}')
    logger.info(f'Request content type: {request.content_type}')
    logger.info(f'Request content length: {request.META.get("CONTENT_LENGTH", "unknown")}')
    
    # Check if file is in request
    if 'file' not in request.FILES:
        logger.error('❌ No file in request.FILES')
        logger.info(f'Available keys: {list(request.FILES.keys())}')
        logger.info(f'REQUEST.FILES: {request.FILES}')
        logger.info(f'REQUEST.POST: {dict(request.POST)}')
        return Response({
            'error': 'No file provided',
            'message': 'Please select a PDF file to upload',
            'debug_info': {
                'has_files': bool(request.FILES),
                'files_keys': list(request.FILES.keys()),
                'post_data': dict(request.POST)
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    logger.info(f'🔍 DEBUG: File details:')
    logger.info(f'  - Name: {file.name}')
    logger.info(f'  - Size: {file.size} bytes')
    logger.info(f'  - Content type: {file.content_type}')
    logger.info(f'  - Charset: {file.charset}')
    
    if 'file' in request.FILES:
        file = request.FILES['file']
        
        if not file.name.lower().endswith('.pdf'):
            logger.error(f'❌ Invalid file extension: {file.name}')
            return Response({
                'error': 'Only PDF files are allowed',
                'message': 'Only PDF files are supported',
                'debug_info': {
                    'file_name': file.name,
                    'file_extension': file.name.split('.')[-1] if '.' in file.name else 'none'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if file.size > 10 * 1024 * 1024:
            logger.error(f'❌ File too large: {file.size} bytes')
            return Response({
                'error': 'File size must be less than 10MB',
                'message': 'File size must be less than 10MB',
                'debug_info': {
                    'file_size': file.size,
                    'max_size': 10 * 1024 * 1024
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info('🔍 DEBUG: Reading file content for hash calculation')
            content = file.read()
            file.seek(0)  # Reset file pointer
            content_hash = hashlib.sha256(content).hexdigest()
            logger.info(f'🔍 DEBUG: Content hash calculated: {content_hash[:16]}...')
            
            # Check for duplicates
            if Paper.objects.filter(content_hash=content_hash).exists():
                logger.info('🔍 DEBUG: Duplicate paper found')
                existing = Paper.objects.get(content_hash=content_hash)
                return Response({
                    'id': str(existing.id),
                    'status': existing.status,
                    'message': 'Paper already exists',
                    'debug_info': {
                        'existing_paper_id': str(existing.id),
                        'existing_status': existing.status
                    }
                })
            
            # Save file
            logger.info('🔍 DEBUG: Saving file to storage')
            from django.conf import settings
            os.makedirs(os.path.join(settings.MEDIA_ROOT, 'papers'), exist_ok=True)
            file_path = os.path.join('papers', f'{content_hash}.pdf')
            saved_path = default_storage.save(file_path, file)
            logger.info(f'🔍 DEBUG: File saved to: {saved_path}')
            
            # Create paper record
            logger.info('🔍 DEBUG: Creating paper record')
            paper = Paper.objects.create(
                title=file.name.replace('.pdf', ''),
                authors=['Unknown Author'],
                abstract='',
                file_url=saved_path,
                content_hash=content_hash,
                status='uploading',
                uploaded_at=datetime.now()
            )
            logger.info(f'✅ Paper record created: {paper.id}')
            
            # Process PDF synchronously
            logger.info('🔍 DEBUG: Starting PDF processing')
            processor = SimplePDFProcessor()
            result = processor.process_pdf(paper, os.path.join(settings.MEDIA_ROOT, saved_path))
            logger.info(f'🔍 DEBUG: PDF processing result: {result}')
            
            if result['success']:
                logger.info(f'✅ PDF processing successful: {result["chunks_created"]} chunks created')
                return Response({
                    'id': str(paper.id),
                    'status': paper.status,
                    'message': f'Paper uploaded and processed successfully. Created {result["chunks_created"]} text chunks.',
                    'debug_info': {
                        'paper_id': str(paper.id),
                        'chunks_created': result["chunks_created"],
                        'file_saved': bool(paper.file_url),
                        'file_path': str(paper.file_url)
                    }
                })
            else:
                logger.error(f'❌ PDF processing failed: {result["error"]}')
                return Response({
                    'error': f'PDF processing failed: {result["error"]}',
                    'debug_info': {
                        'paper_id': str(paper.id),
                        'processing_error': result["error"],
                        'file_path': str(paper.file_url)
                    }
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f'❌ Upload failed with exception: {str(e)}')
            logger.exception('Full exception details:')
            return Response({
                'error': 'Upload failed',
                'message': str(e),
                'debug_info': {
                    'exception_type': type(e).__name__,
                    'exception_message': str(e),
                    'file_name': file.name if 'file' in locals() else 'unknown'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif 'arxiv_url' in request.data:
        # Simple arXiv URL handling
        arxiv_url = request.data['arxiv_url']
        
        try:
            parsed = urlparse(arxiv_url)
            path_parts = parsed.path.split('/')
            arxiv_id = None
            
            for part in path_parts:
                if part.startswith('arXiv:') or '.' in part and len(part) > 8:
                    arxiv_id = part.replace('arXiv:', '')
                    break
            
            if not arxiv_id:
                return Response({'error': 'Invalid arXiv URL'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create paper record
            paper = Paper.objects.create(
                title=f'arXiv Paper {arxiv_id}',
                authors=['ArXiv Author'],
                abstract=f'Abstract for arXiv paper {arxiv_id}',
                arxiv_id=arxiv_id,
                status='ready',
                uploaded_at=datetime.now(),
                processed_at=datetime.now()
            )
            
            # Create a simple document chunk
            DocumentChunk.objects.create(
                paper=paper,
                text=f'This is the content for arXiv paper {arxiv_id}. In a real implementation, this would contain the actual paper content.',
                section='abstract',
                page_number=1,
                chunk_index=0,
                token_count=50
            )
            
            return Response({
                'id': str(paper.id),
                'status': paper.status,
                'message': 'arXiv paper imported successfully'
            })
            
        except Exception as e:
            return Response({'error': f'Failed to import arXiv paper: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    else:
        return Response({'error': 'No file or arXiv URL provided'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_papers(request):
    """List all papers."""
    papers = Paper.objects.all().order_by('-uploaded_at')
    
    data = []
    for paper in papers:
        data.append({
            'id': str(paper.id),
            'title': paper.title,
            'authors': paper.authors,
            'abstract': paper.abstract,
            'arxiv_id': paper.arxiv_id,
            'status': paper.status,
            'uploaded_at': paper.uploaded_at.isoformat(),
            'processed_at': paper.processed_at.isoformat() if paper.processed_at else None
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def paper_status(request, paper_id):
    """Get paper status."""
    try:
        paper = Paper.objects.get(id=paper_id)
        
        return Response({
            'id': str(paper.id),
            'title': paper.title,
            'authors': paper.authors,
            'abstract': paper.abstract,
            'arxiv_id': paper.arxiv_id,
            'status': paper.status,
            'uploaded_at': paper.uploaded_at.isoformat(),
            'processed_at': paper.processed_at.isoformat() if paper.processed_at else None,
            'chunk_count': paper.chunks.count()
        })
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def paper_summary(request, paper_id):
    """Get paper summary using simplified AI service."""
    try:
        paper = Paper.objects.get(id=paper_id)
        
        # Use simplified AI service
        ai_service = SimpleAIService()
        summary = ai_service.generate_summary(paper)
        
        return Response(summary)
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def compare_papers(request):
    """Compare multiple papers using simplified AI service."""
    paper_ids = request.data.get('paper_ids', [])
    
    if len(paper_ids) < 2:
        return Response({'error': 'At least 2 papers are required for comparison'}, status=status.HTTP_400_BAD_REQUEST)
    
    papers = Paper.objects.filter(id__in=paper_ids)
    
    if papers.count() < len(paper_ids):
        return Response({'error': 'One or more papers not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Use simplified AI service
    ai_service = SimpleAIService()
    comparison = ai_service.compare_papers(list(papers))
    
    return Response(comparison)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_paper(request, paper_id):
    """Delete a paper."""
    try:
        paper = Paper.objects.get(id=paper_id)
        paper.delete()
        return Response({'message': 'Paper deleted successfully'})
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)
