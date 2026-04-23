from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime
import json
from .models import ChatSession, ChatMessage
from papers.models import Paper
from papers.services.simple_ai_service import SimpleAIService
import uuid

@api_view(['POST'])
@permission_classes([AllowAny])
def send_message(request):
    session_id = request.data.get('session_id')
    paper_ids = request.data.get('paper_ids', [])
    message = request.data.get('message', '')
    
    if not session_id:
        papers = Paper.objects.filter(id__in=paper_ids)
        title = papers.first().title if papers.exists() else 'New Chat'
        
        session = ChatSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
            title=title
        )
        session_id = str(session.id)
    else:
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Save user message
    user_msg = ChatMessage.objects.create(
        session=session,
        role='user',
        content=message,
        paper_ids=paper_ids
    )
    
    # Get conversation history
    history_messages = session.messages.all().order_by('created_at')
    conversation_history = [
        {
            'role': msg.role,
            'content': msg.content
        }
        for msg in history_messages
    ]
    
    # Generate AI response using simplified service
    ai_service = SimpleAIService()
    try:
        assistant_response = ai_service.chat_with_papers(
            message=message,
            paper_ids=paper_ids,
            conversation_history=conversation_history
        )
    except Exception as e:
        assistant_response = f"I apologize, but I encountered an error while processing your request: {str(e)}. Please try again or check if the papers are properly processed."
    
    # Save assistant message
    assistant_msg = ChatMessage.objects.create(
        session=session,
        role='assistant',
        content=assistant_response,
        paper_ids=paper_ids
    )
    
    return Response({
        'session_id': session_id,
        'message': {
            'id': str(assistant_msg.id),
            'role': 'assistant',
            'content': assistant_response,
            'created_at': assistant_msg.created_at.isoformat()
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def list_sessions(request):
    sessions = (
        ChatSession.objects
        .prefetch_related('messages')
        .order_by('-updated_at')[:20]
    )

    data = []
    for session in sessions:
        messages = list(session.messages.all())
        paper_ids = list({pid for msg in messages for pid in msg.paper_ids})
        papers = Paper.objects.filter(id__in=paper_ids).only('id', 'title', 'status')
        last_message = messages[-1] if messages else None

        data.append({
            'id': str(session.id),
            'title': session.title,
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
            'papers': [{'id': str(p.id), 'title': p.title, 'status': p.status} for p in papers],
            'message_count': len(messages),
            'last_message': {
                'content': (last_message.content[:100] + '...') if last_message and len(last_message.content) > 100 else (last_message.content if last_message else ''),
                'created_at': last_message.created_at.isoformat() if last_message else None,
            },
        })

    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_session(request, session_id):
    try:
        session = ChatSession.objects.get(id=session_id)
        messages = session.messages.all()
        
        paper_ids = []
        for msg in messages:
            paper_ids.extend(msg.paper_ids)
        paper_ids = list(set(paper_ids))
        
        papers = Paper.objects.filter(id__in=paper_ids)
        
        return Response({
            'id': str(session.id),
            'title': session.title,
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
            'papers': [{'id': str(p.id), 'title': p.title, 'status': p.status} for p in papers],
            'messages': [{
                'id': str(m.id),
                'role': m.role,
                'content': m.content,
                'paper_ids': m.paper_ids,
                'created_at': m.created_at.isoformat()
            } for m in messages]
        })
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_session(request, session_id):
    try:
        session = ChatSession.objects.get(id=session_id)
        session.delete()
        return Response({'message': 'Session deleted successfully'})
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
