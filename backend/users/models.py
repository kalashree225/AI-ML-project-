from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class Role(models.TextChoices):
    OWNER = 'OWNER', _('Owner')
    ADMIN = 'ADMIN', _('Admin')
    RESEARCHER = 'RESEARCHER', _('Researcher')
    VIEWER = 'VIEWER', _('Viewer')

class Organization(models.Model):
    name = models.CharField(max_length=255)
    plan = models.CharField(max_length=50, default='free')
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)
    orcid_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    prefs = models.JSONField(default=dict, blank=True)
    
    # OAuth fields
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    github_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    avatar_url = models.URLField(blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['google_id']),
            models.Index(fields=['github_id']),
        ]
    
    def __str__(self):
        return self.email
