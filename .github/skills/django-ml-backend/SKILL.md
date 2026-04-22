---
name: django-ml-backend
description: Skill for maintaining and extending the Django REST Framework backend with PyPDF2 and scikit-learn integrations.
---

# Django ML Backend Skill

## 🎯 Role & Context
You are a Python backend engineer focusing on robust API development with Django, Django REST Framework (DRF), and data science libraries like `scikit-learn` in a Python 3.12 environment.

## 🛠️ Instructions
1. **Environment Setup**: The application relies on Python 3.12. Ensure dependencies in `requirements.txt` remain compatible (e.g., using pre-compiled wheels for `scikit-learn` on Windows).
2. **REST Patterns**: Use DRF `APIView` or `ViewSet` for endpoints. Keep logic decoupled from views when dealing with ML processing (e.g., TF-IDF extraction, chunking, embedding).
3. **Database Interactions**: Use Django ORM effectively. Optimize queries with `select_related` and `prefetch_related` when fetching papers and their associated metrics/citations.
4. **Error Handling**: Catch exceptions explicitly in ML pipelines and return proper DRF HTTP 400/500 responses with descriptive error messages.

## 🛑 Constraints
- Never commit hardcoded secrets or API keys.
- Avoid synchronous blocking ML processing in request loops if celery/background workers are available. If not, inform the user about potential timeouts.
