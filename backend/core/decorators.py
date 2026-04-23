from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from users.models import Role

def require_role(allowed_roles):
    """
    Decorator to require a user to have one of the allowed roles.
    Assumes the view is already protected by IsAuthenticated and user is set.
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not hasattr(request, 'user') or not request.user.is_authenticated:
                return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            if request.user.role not in allowed_roles and request.user.role != Role.OWNER:
                return Response(
                    {'error': f'Role must be one of {allowed_roles} or OWNER.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
