import os
import re
from typing import List, Dict, Tuple
from django.utils import timezone
import PyPDF2
from django.conf import settings
from ..models import Paper, DocumentChunk

class SimplePDFProcessor:
    """Simplified PDF processor using only PyPDF2 (no external dependencies)."""
    
    def __init__(self):
        self.chunk_size = 1000  # characters
        self.chunk_overlap = 100  # characters
        
    def extract_text_from_pdf(self, file_path: str) -> Dict:
        """Extract text from PDF using PyPDF2."""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract metadata
                metadata = pdf_reader.metadata
                title = metadata.get('/Title', '') if metadata else ''
                author = metadata.get('/Author', '') if metadata else ''
                
                # Extract text from all pages
                full_text = ""
                pages_text = []
                
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text.strip():
                            pages_text.append({
                                'page': page_num + 1,
                                'text': page_text.strip()
                            })
                            full_text += page_text + "\n"
                    except Exception as e:
                        print(f"Error extracting text from page {page_num}: {e}")
                        continue
                
                return {
                    'title': title,
                    'author': author,
                    'full_text': full_text.strip(),
                    'pages': pages_text,
                    'total_pages': len(pdf_reader.pages),
                    'success': True
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_text_chunks(self, pages_text: List[Dict], paper: Paper) -> List[DocumentChunk]:
        """Create text chunks preserving page-level provenance."""
        document_chunks = []
        chunk_index = 0

        for page_info in pages_text:
            page_num = page_info['page']
            text = re.sub(r'\s+', ' ', page_info['text']).strip()
            if not text:
                continue

            start = 0
            while start < len(text):
                end = start + self.chunk_size
                if end >= len(text):
                    chunk_text = text[start:].strip()
                else:
                    window = text[start:end]
                    # Prefer sentence boundary
                    best = max(window.rfind('.'), window.rfind('!'), window.rfind('?'))
                    if best > self.chunk_size * 0.7:
                        end = start + best + 1
                    else:
                        wb = window.rfind(' ')
                        if wb > self.chunk_size * 0.8:
                            end = start + wb
                    chunk_text = text[start:end].strip()

                if chunk_text:
                    document_chunks.append(DocumentChunk(
                        paper=paper,
                        text=chunk_text,
                        section='main',
                        page_number=page_num,
                        chunk_index=chunk_index,
                        token_count=len(chunk_text.split()),
                    ))
                    chunk_index += 1

                next_start = end - self.chunk_overlap
                if next_start <= start:  # guard against infinite loop
                    next_start = start + 1
                start = next_start

        return document_chunks
    
    def process_pdf(self, paper: Paper, file_path: str) -> Dict:
        """Process PDF file and update paper with extracted content."""
        try:
            # Update status
            paper.status = 'processing'
            paper.save()
            
            # Extract text
            extraction_result = self.extract_text_from_pdf(file_path)
            
            if not extraction_result['success']:
                paper.status = 'failed'
                paper.save()
                return {
                    'success': False,
                    'error': extraction_result['error']
                }
            
            # Update paper metadata
            if extraction_result['title'] and not paper.title:
                paper.title = extraction_result['title']
            
            if extraction_result['author']:
                paper.authors = [extraction_result['author']]
            
            # Extract abstract (first paragraph or first 500 chars)
            full_text = extraction_result['full_text']
            if full_text and not paper.abstract:
                # Try to find abstract (usually first paragraph)
                paragraphs = full_text.split('\n\n')
                if paragraphs:
                    abstract = paragraphs[0].strip()
                    if len(abstract) > 500:
                        abstract = abstract[:500] + '...'
                    paper.abstract = abstract
            
            # Create text chunks with page provenance
            chunks = self.create_text_chunks(extraction_result['pages'], paper)
            
            # Save chunks
            DocumentChunk.objects.bulk_create(chunks)
            
            # Update paper status
            paper.status = 'ready'
            paper.processed_at = timezone.now()
            paper.save()
            
            return {
                'success': True,
                'chunks_created': len(chunks),
                'total_pages': extraction_result['total_pages']
            }
            
        except Exception as e:
            paper.status = 'failed'
            paper.save()
            return {
                'success': False,
                'error': str(e)
            }
