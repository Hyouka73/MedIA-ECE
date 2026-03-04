import os
import glob
import fitz  # PyMuPDF
from docx import Document

def extract_pdf(pdf_path, output_path):
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text() + "\n"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted {pdf_path}")
    except Exception as e:
        print(f"Error extracting {pdf_path}: {e}")

def extract_docx(docx_path, output_path):
    text = ""
    try:
        doc = Document(docx_path)
        for p in doc.paragraphs:
            text += p.text + "\n"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted {docx_path}")
    except Exception as e:
        print(f"Error extracting {docx_path}: {e}")

if __name__ == "__main__":
    docs_dir = r"d:\MEDSYS\docs"
    out_dir = r"d:\MEDSYS\docs\extracted"
    os.makedirs(out_dir, exist_ok=True)
    
    for pdf in glob.glob(os.path.join(docs_dir, "*.pdf")):
        name = os.path.basename(pdf)
        out_path = os.path.join(out_dir, name + ".txt")
        extract_pdf(pdf, out_path)
        
    for docx in glob.glob(os.path.join(docs_dir, "*.docx")):
        name = os.path.basename(docx)
        out_path = os.path.join(out_dir, name + ".txt")
        extract_docx(docx, out_path)
