from django.db import models

class TenantModel(models.Model):
    """
    Abstract base class for all models that belong to a specific organization (tenant).
    """
    org = models.ForeignKey('users.Organization', on_delete=models.CASCADE, related_name='%(class)s_set', null=True, blank=True)

    class Meta:
        abstract = True
