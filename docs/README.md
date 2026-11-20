# ChaatMap Documentation Package

This folder contains the submission documentation and presentation.

## Deliverables

| File | Description |
|---|---|
| **`ChaatMap-Project-Documentation.pdf`** | 8-page styled PDF (A4) — full project documentation: problem/solution, features, architecture, hygiene formula, algorithms, tech stack, setup, API, testing, CI, security, deployment, structure, rubric alignment, limitations. |
| **`ChaatMap-Presentation.pptx`** | 12-slide submission/evaluation deck (16:9) — problem, features, hygiene formula, architecture, algorithms, API & security, testing, CI, deliverables, rubric alignment, closing. Validated with the OOXML validator and visually rendered for QA. |
| **`PROJECT-DOCUMENTATION.md`** | Source Markdown for the PDF (also readable on GitHub). |
| **`API.md`** | Full REST API reference with request/response examples. |
| **`openapi.yaml`** | OpenAPI 3.1 machine-readable API specification. |

## Regenerating the deliverables

Generator scripts are in `generators/`.

```bash
# Build the styled PDF from PROJECT-DOCUMENTATION.md
cd ..                                # back to repo root
python docs/generators/build_html.py # writes docs/_tmp_doc.html (intermediate)
# then convert _tmp_doc.html to PDF with a HTML→PDF engine of your choice, or:
python docs/generators/render_pdf.py # direct reportlab renderer → ChaatMap-Project-Documentation.pdf

# Build the PowerPoint deck (needs pptxgenjs available via NODE_PATH)
NODE_PATH=<path-to-pptxgenjs>/node_modules node docs/generators/build_pptx.js
```

The PDF renderer (`render_pdf.py`) reads `PROJECT-DOCUMENTATION.md` directly, so `build_html.py` is an alternative HTML-based path. The PPTX generator is self-contained aside from `pptxgenjs`.

## Validation status

- PPTX: `python <pptx-skill>/scripts/office/validate.py docs/ChaatMap-Presentation.pptx` → **All validations PASSED**.
- PPTX content: `markitdown` → all 12 slides present, no placeholder text.
- PPTX visual: rendered to PDF via PowerPoint and inspected as a 12-slide contact sheet — no overflow, overlaps or low-contrast text.
- PDF: 8 pages, text extraction confirms all major sections present.
