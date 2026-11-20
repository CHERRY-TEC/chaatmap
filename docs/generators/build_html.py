import markdown, pathlib

src = pathlib.Path('docs/PROJECT-DOCUMENTATION.md').read_text(encoding='utf-8')
html = markdown.markdown(src, extensions=['tables', 'fenced_code', 'toc', 'sane_lists'])

style = """
<style>
@page { size: A4; margin: 20mm 18mm; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10pt; color: #211B19; line-height: 1.5; }
h1 { color: #F45116; font-size: 26pt; margin-bottom: 4pt; }
h2 { color: #211B19; font-size: 16pt; border-bottom: 2px solid #F45116; padding-bottom: 4pt; margin-top: 22pt; }
h3 { color: #F45116; font-size: 12pt; margin-top: 14pt; }
table { border-collapse: collapse; width: 100%; margin: 10pt 0; font-size: 9pt; }
th { background: #211B19; color: #FFF7EF; padding: 6pt; text-align: left; }
td { border: 1px solid #F2E2D6; padding: 5pt; vertical-align: top; }
tr:nth-child(even) td { background: #FFF7EF; }
code { background: #F2E2D6; padding: 1pt 3pt; border-radius: 3pt; font-family: Consolas, monospace; font-size: 8.5pt; }
pre { background: #211B19; color: #FFF7EF; padding: 10pt; border-radius: 6pt; }
pre code { background: none; color: inherit; padding: 0; }
a { color: #F45116; }
hr { border: none; border-top: 1px solid #F2E2D6; margin: 18pt 0; }
</style>
"""

out = '<!DOCTYPE html><html><head><meta charset="utf-8">' + style + '</head><body>' + html + '</body></html>'
pathlib.Path('docs/_tmp_doc.html').write_text(out, encoding='utf-8')
print('html written', len(html), 'chars')
