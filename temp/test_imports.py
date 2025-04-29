
import sys
try:
    import cv2
    import pytesseract
    import pdfplumber
    import ezdxf
    import pandas
    import numpy
    import fuzzywuzzy
    print("SUCCESS: All packages are available")
    sys.exit(0)
except ImportError as e:
    print(f"ERROR: Missing package - {str(e)}")
    sys.exit(1)
      