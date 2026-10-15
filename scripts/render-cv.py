from pathlib import Path
import re
from weasyprint import HTML, CSS
import pymupdf as fitz
import argparse
parser=argparse.ArgumentParser(description='Render the built CV using the site fonts.')
parser.add_argument('--font-dir',type=Path,required=True,help='Directory containing EBGaramond.ttf and Inter.ttf')
parser.add_argument('--preview-dir',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
work=args.font_dir.resolve()
source=(root/'dist/cv/index.html').read_text()
source=re.sub(r'<link[^>]+fonts\.googleapis\.com[^>]*>', '', source)
fonts=CSS(string=f"""
@font-face {{font-family: 'EB Garamond'; src: url('{(work/'EBGaramond.ttf').as_uri()}'); font-weight: 400 700;}}
@font-face {{font-family: Inter; src: url('{(work/'Inter.ttf').as_uri()}'); font-weight: 400 900;}}
.cv-section {{ display: block !important; position: relative; padding-left: 148px !important; }}
.cv-section > h2 {{ position: absolute; left: 0; top: 19px; width: 130px; }}
.cv-section-content {{ display: block !important; }}
""")
output=root/'public/cv.pdf'
HTML(string=source,base_url=str(root/'dist')).write_pdf(output,stylesheets=[fonts])
doc=fitz.open(output)
text=' '.join(' '.join(page.get_text().split()) for page in doc)
assert 'Senior Software Engineer / Team Lead' in text
assert 'Part-time Tech Lead (contract)' in text
assert 'Nov 2025' in text and 'Dec 2022' in text
if args.preview_dir:
    args.preview_dir.mkdir(parents=True,exist_ok=True)
    for i,page in enumerate(doc): page.get_pixmap(matrix=fitz.Matrix(1.15,1.15)).save(args.preview_dir/f'cv-page-{i+1}.png')
print(f'Created {len(doc)} A4 pages; confirmed role titles and chronology present.')
