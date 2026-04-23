from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid
from core.models import TenantModel

User = get_user_model()

class Paper(TenantModel):
    """Simplified Paper model without vector dependencies."""
    
    STATUS_CHOICES = [
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=500)
    authors = models.JSONField(default=list)  # Store as JSON array
    abstract = models.TextField(blank=True)
    file_url = models.CharField(max_length=500, blank=True)
    arxiv_id = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    content_hash = models.CharField(max_length=64, unique=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.title

class DocumentChunk(models.Model):
    """Simplified document chunk without vector embeddings."""
    
    paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name='chunks')
    text = models.TextField()
    section = models.CharField(max_length=100, blank=True)
    page_number = models.IntegerField(null=True, blank=True)
    chunk_index = models.IntegerField()
    token_count = models.IntegerField(default=0)
    embedding = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['paper', 'chunk_index']
        unique_together = ['paper', 'chunk_index']
    
    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.paper.title}"

class Citation(models.Model):
    """Simplified citation model."""
    
    citing_paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name='citations_made')
    cited_paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name='citations_received', null=True, blank=True)
    cited_title = models.CharField(max_length=500, blank=True)
    context = models.TextField(blank=True)
    doi = models.CharField(max_length=100, blank=True)
    arxiv_id = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Citation in {self.citing_paper.title}"

class PaperSummary(models.Model):
    """Simplified paper summary model."""
    
    paper = models.OneToOneField(Paper, on_delete=models.CASCADE, related_name='summary')
    overall_summary = models.TextField(blank=True)
    main_contribution = models.TextField(blank=True)
    methodology = models.TextField(blank=True)
    key_results = models.TextField(blank=True)
    limitations = models.TextField(blank=True)
    future_work = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Summary of {self.paper.title}"
