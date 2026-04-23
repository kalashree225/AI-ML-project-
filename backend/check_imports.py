import django
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'researchmind.settings')
django.setup()

from papers.views import upload_paper, list_papers
from chat.views import send_message, list_sessions
from citations.views import citation_graph
from topics.views import generate_clusters
from users.views import login, register, current_user

print('All imports OK')
