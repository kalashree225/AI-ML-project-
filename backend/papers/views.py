from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.db import IntegrityError
import hashlib
import os
import logging
from urllib.parse import urlparse
from .models import Paper, DocumentChunk
from .services.simple_ai_service import SimpleAIService
from .tasks import trigger_paper_processing

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _paper_to_dict(paper, include_chunks=False):
    data = {
        'id': str(paper.id),
        'title': paper.title,
        'authors': paper.authors,
        'abstract': paper.abstract,
        'arxiv_id': paper.arxiv_id,
        'status': paper.status,
        'uploaded_at': paper.uploaded_at.isoformat(),
        'processed_at': paper.processed_at.isoformat() if paper.processed_at else None,
    }
    if include_chunks:
        data['chunk_count'] = paper.chunks.count()
    return data


def _handle_file_upload(file, user=None):
    """Validate, deduplicate, save and process an uploaded PDF."""
    if not file.name.lower().endswith('.pdf'):
        return None, Response({'error': 'Only PDF files are allowed'}, status=status.HTTP_400_BAD_REQUEST)

    if file.size > MAX_FILE_SIZE:
        return None, Response({'error': 'File size must be less than 10 MB'}, status=status.HTTP_400_BAD_REQUEST)

    content = file.read()
    file.seek(0)
    content_hash = hashlib.sha256(content).hexdigest()

    existing = Paper.objects.filter(content_hash=content_hash).first()
    if existing:
        return existing, Response({'id': str(existing.id), 'status': existing.status, 'message': 'Paper already exists'})

    from django.conf import settings
    os.makedirs(os.path.join(settings.MEDIA_ROOT, 'papers'), exist_ok=True)
    file_path = os.path.join('papers', f'{content_hash}.pdf')

    try:
        paper = Paper.objects.create(
            title=file.name.replace('.pdf', ''),
            authors=['Unknown Author'],
            file_url=default_storage.save(file_path, file),
            content_hash=content_hash,
            status='uploading',
            user=user if user and user.is_authenticated else None,
        )
    except IntegrityError:
        # Race condition: another request saved the same hash
        existing = Paper.objects.get(content_hash=content_hash)
        return existing, Response({'id': str(existing.id), 'status': existing.status, 'message': 'Paper already exists'})

    trigger_paper_processing(paper.id, os.path.join(settings.MEDIA_ROOT, paper.file_url))

    return paper, Response({
        'id': str(paper.id),
        'status': paper.status,
        'message': 'Upload successful. Processing started in the background.',
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_paper(request):
    if 'file' in request.FILES:
        _, response = _handle_file_upload(request.FILES['file'], user=request.user)
        return response

    if 'arxiv_url' in request.data:
        arxiv_url = request.data['arxiv_url']
        path_parts = urlparse(arxiv_url).path.split('/')
        arxiv_id = next((p for p in path_parts if '.' in p and len(p) > 4), None)
        if not arxiv_id:
            return Response({'error': 'Invalid arXiv URL'}, status=status.HTTP_400_BAD_REQUEST)

        paper = Paper.objects.create(
            title=f'arXiv:{arxiv_id}',
            authors=['arXiv Author'],
            abstract=f'arXiv paper {arxiv_id}',
            arxiv_id=arxiv_id,
            status='ready',
            user=request.user if request.user.is_authenticated else None,
        )
        DocumentChunk.objects.create(
            paper=paper, text=f'Content for arXiv:{arxiv_id}',
            section='abstract', page_number=1, chunk_index=0, token_count=10,
        )
        return Response({'id': str(paper.id), 'status': paper.status}, status=status.HTTP_201_CREATED)

    return Response({'error': 'Provide a PDF file or arXiv URL'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_papers(request):
    papers = Paper.objects.all().order_by('-uploaded_at').only(
        'id', 'title', 'authors', 'abstract', 'arxiv_id', 'status', 'uploaded_at', 'processed_at'
    )
    return Response([_paper_to_dict(p) for p in papers])


@api_view(['GET'])
@permission_classes([AllowAny])
def paper_status(request, paper_id):
    try:
        paper = Paper.objects.get(id=paper_id)
        return Response(_paper_to_dict(paper, include_chunks=True))
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def paper_summary(request, paper_id):
    try:
        paper = Paper.objects.get(id=paper_id)
        return Response(SimpleAIService().generate_summary(paper))
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def compare_papers(request):
    paper_ids = request.data.get('paper_ids', [])
    if len(paper_ids) < 2:
        return Response({'error': 'At least 2 papers required'}, status=status.HTTP_400_BAD_REQUEST)

    papers = list(Paper.objects.filter(id__in=paper_ids))
    if len(papers) < len(paper_ids):
        return Response({'error': 'One or more papers not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response(SimpleAIService().compare_papers(papers))


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_paper(request, paper_id):
    try:
        Paper.objects.get(id=paper_id).delete()
        return Response({'message': 'Paper deleted'})
    except Paper.DoesNotExist:
        return Response({'error': 'Paper not found'}, status=status.HTTP_404_NOT_FOUND)
