#!/usr/bin/env python3
"""Make test variants of a real EZLocator pin sheet (for tests/test_pinsheet.js). The owner's PDF and the variants stay
OUTSIDE the public repository (club document with EZLocator images).
  python3 -I tests/make_pinsheet_variants.py REAL.pdf OUTDIR"""
import re, sys, pypdf, os
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
base = pypdf.PdfReader(src).pages[0].get_contents().get_data()
DATE = b'(Tuesday, November 3, 2026)Tj'
assert base.count(DATE) == 2, 'expected the Nov 3 2026 sheet'
def at(c, x, y, old, new, count=1):            # replace the text drawn at one position
    pat = re.compile(rb'(%s %s Td\n0 0 0 rg\n)\(%s\)Tj' % (re.escape(x), re.escape(y), re.escape(old)))
    c2, k = pat.subn(rb'\1(' + new + rb')Tj', c); assert k == count, (x, y, old, k); return c2
def write(name, c):
    w = pypdf.PdfWriter(clone_from=src); st = pypdf.generic.DecodedStreamObject(); st.set_data(c)
    w.pages[0].replace_contents(st); w.write(os.path.join(out, name))
    assert pypdf.PdfReader(os.path.join(out, name)).pages[0].get_contents().get_data() == c, name
# hole 2's pin is drawn at x 180.48 (front) and 192.16 (side), y 627.98 (top copy) and 231.98 (bottom copy)
def hole2(c, front, side, copies=('627.98', '231.98')):
    for y in copies:
        c = at(c, b'180.48', y.encode(), b'9', front); c = at(c, b'192.16', y.encode(), b'8L', side)
    return c
write('today_valid.pdf', hole2(base.replace(DATE, b'(Thursday, November 19, 2026)Tj'), b'20', b'6R'))
write('future_dated.pdf', base.replace(DATE, b'(Friday, November 20, 2026)Tj'))
write('copies_disagree.pdf', hole2(base, b'11', b'8L', copies=('627.98',)))
write('wrong_weekday.pdf', base.replace(DATE, b'(Monday, November 3, 2026)Tj'))
write('pin_off_green.pdf', hole2(base, b'9', b'40L'))
c = re.sub(rb'\(5\)Tj', b'( )Tj', base); write('missing_hole5.pdf', c)
from reportlab.pdfgen import canvas
cv = canvas.Canvas(os.path.join(out, 'not_a_pinsheet.pdf')); cv.drawString(72, 720, 'Pocasset Golf Club - Member newsletter, Tuesday, November 3, 2026'); cv.drawString(72, 700, 'Holes 1-18 aerification schedule'); cv.save()
open(os.path.join(out, 'corrupt.pdf'), 'wb').write(b'%PDF-1.7\nthis is not really a pdf\n')
print('variants:', sorted(os.listdir(out)))
