"""Render PROJECT-DOCUMENTATION.md into a styled PDF using reportlab."""

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)

BRAND = colors.HexColor('#F45116')
INK = colors.HexColor('#211B19')
CREAM = colors.HexColor('#FFF7EF')
LINE = colors.HexColor('#F2E2D6')
GREEN = colors.HexColor('#18864B')

md = Path('docs/PROJECT-DOCUMENTATION.md').read_text(encoding='utf-8')
lines = md.split('\n')

ss = getSampleStyleSheet()
styles = {
    'title': ParagraphStyle('title', parent=ss['Title'], fontName='Helvetica-Bold',
                            fontSize=26, leading=30, textColor=BRAND, spaceAfter=4),
    'subtitle': ParagraphStyle('subtitle', parent=ss['Normal'], fontName='Helvetica',
                               fontSize=12, leading=16, textColor=INK, spaceAfter=10),
    'h2': ParagraphStyle('h2', parent=ss['Heading2'], fontName='Helvetica-Bold',
                         fontSize=16, leading=20, textColor=INK, spaceBefore=16, spaceAfter=7),
    'h3': ParagraphStyle('h3', parent=ss['Heading3'], fontName='Helvetica-Bold',
                         fontSize=12, leading=15, textColor=BRAND, spaceBefore=11, spaceAfter=5),
    'body': ParagraphStyle('body', parent=ss['BodyText'], fontName='Helvetica',
                           fontSize=9.3, leading=13.2, textColor=INK, alignment=TA_LEFT,
                           spaceAfter=5),
    'bullet': ParagraphStyle('bullet', parent=ss['BodyText'], fontName='Helvetica',
                             fontSize=9.3, leading=13, textColor=INK, leftIndent=13,
                             bulletIndent=3, spaceAfter=3),
    'cell': ParagraphStyle('cell', fontName='Helvetica', fontSize=7.8, leading=10, textColor=INK),
    'cellh': ParagraphStyle('cellh', fontName='Helvetica-Bold', fontSize=7.8, leading=10,
                            textColor=colors.white),
    'code': ParagraphStyle('code', fontName='Courier', fontSize=7.6, leading=9.6,
                           textColor=colors.HexColor('#FFF7EF')),
    'note': ParagraphStyle('note', fontName='Helvetica-Oblique', fontSize=9, leading=12,
                           textColor=colors.HexColor('#555555'), leftIndent=10),
}


def inline(text):
    """Convert markdown inline emphasis/code/links to reportlab markup."""
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`(.+?)`', r'<font face="Courier" color="#B4400F">\1</font>', text)
    # Keep link text; drop hrefs (TOC anchors like #intro are not resolvable in PDF).
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<font color="#F45116">\1</font>', text)
    text = text.replace('&', '&amp;').replace('<link', '<link')  # keep markup
    # re-escape ampersands that are not part of an entity
    text = re.sub(r'&(?!(amp|lt|gt|quot|#\d+);)', '&amp;', text)
    return text


def is_table_sep(line):
    s = line.strip()
    return s.startswith('|') and set(s) <= set('|:- ')


def split_row(line):
    return [c.strip() for c in line.strip().strip('|').split('|')]


story = []
i = 0
first_h1 = True
while i < len(lines):
    line = lines[i]
    stripped = line.strip()

    if not stripped:
        i += 1
        continue

    if stripped.startswith('# '):
        title = stripped[2:]
        if first_h1:
            story.append(Paragraph(inline(title), styles['title']))
            story.append(Paragraph(
                'Street Food Discovery Platform with Transparent Hygiene Scores',
                styles['subtitle']))
            story.append(HRFlowable(width='100%', thickness=2, color=BRAND,
                                    spaceBefore=2, spaceAfter=8))
            first_h1 = False
        else:
            story.append(Paragraph(inline(title), styles['h2']))
        i += 1
        continue

    if stripped.startswith('## '):
        story.append(Paragraph(inline(stripped[3:]), styles['h2']))
        story.append(HRFlowable(width='100%', thickness=0.6, color=LINE,
                                spaceBefore=1, spaceAfter=6))
        i += 1
        continue

    if stripped.startswith('### '):
        story.append(Paragraph(inline(stripped[4:]), styles['h3']))
        i += 1
        continue

    if stripped.startswith('```'):
        block = []
        i += 1
        while i < len(lines) and not lines[i].strip().startswith('```'):
            block.append(lines[i].replace('\t', '    '))
            i += 1
        i += 1
        code_text = '\n'.join(block)
        pre = Preformatted(code_text, styles['code'])
        t = Table([[pre]], colWidths=[168 * mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), INK),
            ('BOX', (0, 0), (-1, -1), 0.5, INK),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 5))
        continue

    if stripped.startswith('|') and i + 1 < len(lines) and is_table_sep(lines[i + 1]):
        header = split_row(stripped)
        i += 2
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            rows.append(split_row(lines[i]))
            i += 1
        data = [[Paragraph(inline(c), styles['cellh']) for c in header]]
        for r in rows:
            data.append([Paragraph(inline(c), styles['cell']) for c in r])
        ncol = len(header)
        width = 168 * mm
        colw = [width / ncol] * ncol
        t = Table(data, colWidths=colw, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), INK),
            ('GRID', (0, 0), (-1, -1), 0.4, LINE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, CREAM]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(t)
        story.append(Spacer(1, 6))
        continue

    if stripped.startswith('- '):
        story.append(Paragraph(inline(stripped[2:]), styles['bullet'], bulletText='•'))
        i += 1
        continue

    if re.match(r'^\d+\.\s', stripped):
        story.append(Paragraph(inline(re.sub(r'^\d+\.\s', '', stripped)),
                               styles['bullet'],
                               bulletText=re.match(r'^(\d+)\.', stripped).group(1) + '.'))
        i += 1
        continue

    if stripped.startswith('> '):
        story.append(Paragraph(inline(stripped[2:]), styles['note']))
        i += 1
        continue

    if stripped == '---':
        story.append(HRFlowable(width='100%', thickness=0.4, color=LINE,
                                spaceBefore=4, spaceAfter=4))
        i += 1
        continue

    story.append(Paragraph(inline(stripped), styles['body']))
    i += 1


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(colors.HexColor('#777777'))
    canvas.drawString(18 * mm, 9 * mm, 'ChaatMap — Project Documentation · v1.0.0')
    canvas.drawRightString(A4[0] - 18 * mm, 9 * mm, 'Page %d' % doc.page)
    canvas.restoreState()


out = Path('docs/ChaatMap-Project-Documentation.pdf')
doc = BaseDocTemplate(str(out), pagesize=A4,
                      leftMargin=18 * mm, rightMargin=18 * mm,
                      topMargin=16 * mm, bottomMargin=18 * mm,
                      title='ChaatMap — Project Documentation',
                      author='ChaatMap Team')
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='body')
doc.addPageTemplates([PageTemplate(id='main', frames=[frame], onPage=footer)])
doc.build(story)
print('PDF written:', out, out.stat().st_size, 'bytes')
