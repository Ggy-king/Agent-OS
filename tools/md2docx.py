#!/usr/bin/env python3
"""md → docx（office 域工作流收口用；标题/段落/加粗支持）"""
import sys, re
from docx import Document
from docx.shared import Pt

def md2docx(md_path, docx_path):
    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'PingFang SC'
    style.font.size = Pt(12)
    for raw in open(md_path, encoding='utf-8'):
        line = raw.rstrip('\n')
        if not line.strip() or line.startswith('>') or line.strip() == '---':
            continue
        m = re.match(r'^(#{1,4})\s+(.*)', line)
        if m:
            doc.add_heading(m.group(2).replace('**', ''), level=min(len(m.group(1)), 4))
            continue
        p = doc.add_paragraph()
        for seg in re.split(r'(\*\*.+?\*\*)', line):
            if seg.startswith('**') and seg.endswith('**'):
                p.add_run(seg[2:-2]).bold = True
            elif seg:
                p.add_run(seg)
    doc.save(docx_path)
    print('✓ 生成', docx_path)

if __name__ == '__main__':
    md2docx(sys.argv[1], sys.argv[2])
