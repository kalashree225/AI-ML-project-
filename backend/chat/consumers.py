import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from .rag import search_chunks_numpy
from .models import ChatMessage, ChatSession
from core.models import Organization
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        await self.accept()
        logger.info(f"WebSocket connected for session: {self.session_id}")

    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnected: {close_code}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        query = data.get('query', '')
        
        if not query:
            return

        # 1. Echo user message back
        await self.send(text_data=json.dumps({
            'type': 'message',
            'role': 'user',
            'content': query
        }))

        # 2. RAG Retrieval
        # For No-Docker mode, assume org_id=1 for now if user not in scope
        # Wait, scope['user'] might not be populated if we don't have JWT middleware for channels
        # For simplicity, we just search all chunks or pass org_id from frontend. Let's pass org_id=1 for demo.
        results = await sync_to_async(search_chunks_numpy)(query, org_id=1, top_k=3)
        context = "\n".join([r['chunk'].text for r in results]) if results else "No relevant documents found."

        # 3. Simulate Streaming Response
        # Since we might not have a real OpenAI key, we simulate streaming response
        response_text = f"Based on your documents:\n{context}\n\nThis is a simulated AI response answering: '{query}'"
        
        words = response_text.split(' ')
        for word in words:
            import asyncio
            await asyncio.sleep(0.05) # simulate network delay
            await self.send(text_data=json.dumps({
                'type': 'stream',
                'content': word + " "
            }))

        await self.send(text_data=json.dumps({
            'type': 'stream_end'
        }))

        # Save to DB
        await self.save_message('user', query)
        await self.save_message('assistant', response_text)

    @sync_to_async
    def save_message(self, role, content):
        try:
            session = ChatSession.objects.get(id=self.session_id)
            ChatMessage.objects.create(session=session, role=role, content=content)
        except Exception as e:
            logger.error(f"Could not save message: {e}")
