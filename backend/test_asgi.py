import sys
try:
    import researchmind.asgi
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
