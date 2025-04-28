# fixit_all_agent.py

import os
import cv2
import pytesseract
import pdfplumber
import ezdxf
import pandas as pd
import re
import numpy as np
from fuzzywuzzy import fuzz
from collections import defaultdict

# -------------- 1. File Reader ----------------

class FileReader:
    def __init__(self, upload_path):
        self.upload_path = upload_path

    def read_pdf(self, filename):
        text = ""
        with pdfplumber.open(os.path.join(self.upload_path, filename)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text

    def read_image(self, filename):
        img = cv2.imread(os.path.join(self.upload_path, filename))
        text = pytesseract.image_to_string(img)
        return text

    def read_dwg(self, filename):
        doc = ezdxf.readfile(os.path.join(self.upload_path, filename))
        msp = doc.modelspace()
        entities = []
        for e in msp:
            if e.dxftype() in ["TEXT", "MTEXT"]:
                entities.append(e.plain_text())
        return " ".join(entities)

# -------------- 2. Drawing Analyzer ----------------

class DrawingAnalyzer:
    def extract_measurements(self, text):
        dims = re.findall(r'(\d+(?:\.\d+)?)\s*(mm|cm|m)', text.lower())
        measurements = [(float(val), unit) for val, unit in dims]
        return measurements

    def extract_scale(self, text):
        match = re.search(r'Scale\s*[:\-]?\s*1[:]\s*(\d+)', text, re.IGNORECASE)
        return int(match.group(1)) if match else None

# -------------- 3. Compliance Checker ----------------

class ComplianceChecker:
    MIN_CEILING_HEIGHT = 2.3  # meters
    MIN_CORRIDOR_WIDTH = 0.9  # meters
    MIN_DOOR_WIDTH = 0.762  # meters

    def check_compliance(self, measurements):
        issues = []
        for value, unit in measurements:
            if unit == 'mm':
                value = value / 1000
            elif unit == 'cm':
                value = value / 100
            # Assume random logic, refine per use
            if value < self.MIN_CEILING_HEIGHT:
                issues.append(f"Ceiling height too low: {value} m")
            if value < self.MIN_CORRIDOR_WIDTH:
                issues.append(f"Corridor width too small: {value} m")
            if value < self.MIN_DOOR_WIDTH:
                issues.append(f"Door width too small: {value} m")
        return issues

# -------------- 4. Material Pack Analyzer ----------------

class MaterialAnalyzer:
    def extract_materials(self, text):
        materials = re.findall(r'(Timber|Flooring|Tile|Concrete|Steel)\s*(\w+)?\s*(\d+mm|\d+cm)?', text, re.IGNORECASE)
        material_list = [{'material': m[0], 'type': m[1], 'thickness': m[2]} for m in materials]
        return material_list

# -------------- 5. BOQ Generator ----------------

class BOQGenerator:
    def generate_boq(self, measurements, materials):
        boq = []
        for m in measurements:
            val, unit = m
            if unit == 'mm':
                val = val / 1000
            elif unit == 'cm':
                val = val / 100
            boq.append({'material': 'Generic Material', 'quantity_m2': round(val * val, 2)})
        boq_df = pd.DataFrame(boq)
        return boq_df

# -------------- 6. Duplicate Material Detector ----------------

class DuplicateMaterialDetector:
    def detect_duplicates(self, material_list):
        duplicates = []
        seen = {}
        for mat in material_list:
            name = mat['material']
            for seen_name in seen.keys():
                if fuzz.ratio(name, seen_name) > 90:
                    duplicates.append((name, seen_name))
            seen[name] = True
        return duplicates

# -------------- 7. Missing Information Detector ----------------

class MissingInfoDetector:
    def detect_missing_info(self, text):
        missing_info = []
        if 'flooring' not in text.lower():
            missing_info.append('Missing Flooring Information')
        if 'insulation' not in text.lower():
            missing_info.append('Missing Insulation Information')
        if 'wall finish' not in text.lower():
            missing_info.append('Missing Wall Finish Information')
        return missing_info

# -------------- 8. Main AI Agent Runner ----------------

class FixItAllAgent:
    def __init__(self, upload_path):
        self.reader = FileReader(upload_path)
        self.analyzer = DrawingAnalyzer()
        self.compliance = ComplianceChecker()
        self.materials = MaterialAnalyzer()
        self.boq = BOQGenerator()
        self.duplicates = DuplicateMaterialDetector()
        self.missing = MissingInfoDetector()

    def process(self, filename):
        print(f"Processing file: {filename}")
        ext = filename.split('.')[-1]
        if ext.lower() == 'pdf':
            text = self.reader.read_pdf(filename)
        elif ext.lower() in ['png', 'jpg', 'jpeg']:
            text = self.reader.read_image(filename)
        elif ext.lower() == 'dwg':
            text = self.reader.read_dwg(filename)
        else:
            raise ValueError("Unsupported file type")

        measurements = self.analyzer.extract_measurements(text)
        scale = self.analyzer.extract_scale(text)
        material_list = self.materials.extract_materials(text)

        compliance_issues = self.compliance.check_compliance(measurements)
        boq = self.boq.generate_boq(measurements, material_list)
        duplicates = self.duplicates.detect_duplicates(material_list)
        missing_info = self.missing.detect_missing_info(text)

        report = {
            'scale': scale,
            'measurements': measurements,
            'compliance_issues': compliance_issues,
            'materials': material_list,
            'boq': boq.to_dict('records'),  # Convert DataFrame to dict for JSON serialization
            'duplicate_materials': duplicates,
            'missing_info': missing_info,
        }
        return report

# If run directly, provide a simple test
if __name__ == "__main__":
    print("FixItAll Agent - Test Mode")
    print("This script should be imported and used by the Node.js application")
