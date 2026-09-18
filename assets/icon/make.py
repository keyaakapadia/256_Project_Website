"""Loom's mark: the frequency sphere, drawn rather than photographed.

A dark globe; two threads in the meaning colours (the lines ARE the
meanings); the run of pictures as one band that comes over the top,
goes round the back and returns round the bottom. The back stretch is
faint — that depth is what stops the band reading as a letter S.

One geometry, two outputs: the SVG the browser draws, and PNG/ICO
rasterised here from the same numbers (8x supersampled, standard library
only) for browsers that will not take an SVG icon.
"""
import math, os, struct, sys, zlib

GROUND, CREAM = (0x1b, 0x1b, 0x1b), (0xf3, 0xef, 0xe6)
PINK, BLUE = (0xd4, 0x54, 0xa9), (0x54, 0xa9, 0xd4)   # repeat, guide
TOP  = ((12.5, 3.7), (20, 1.9), (28.4, 4.6), (26.8, 9.3))
BACK = ((26.8, 9.3), (25, 14.1), (9.1, 15), (6.9, 21.2))
BOT  = ((6.9, 21.2), (5.5, 25.4), (9, 28.6), (13.3, 28.8))
THREADS = ((14.3, 6.0, -30, PINK), (6.4, 14.3, 20, BLUE))

# in painting order: (kind, geometry, colour, opacity, width)
MARK = [('disc',  (16, 16, 15.3),  GROUND,     1,    None),
        ('ring',  (16, 16, 15.1),  (255,)*3,   .2,   .9),
        ('curve', BACK,            CREAM,      .3,   2.4)] + \
       [('ellipse', (16, 16, rx, ry, rot), col, .95, 1.5) for rx, ry, rot, col in THREADS] + \
       [('curve', TOP, CREAM, 1, 3.6), ('curve', BOT, CREAM, 1, 3.6)]

hexc = lambda c: '#%02x%02x%02x' % c
def svg():
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">']
    for kind, g, col, op, w in MARK:
        o = '' if op == 1 else f' opacity="{op}"'
        if kind == 'disc':
            out.append(f'<circle cx="{g[0]}" cy="{g[1]}" r="{g[2]}" fill="{hexc(col)}"/>')
        elif kind == 'ring':
            out.append(f'<circle cx="{g[0]}" cy="{g[1]}" r="{g[2]}" fill="none" stroke="{hexc(col)}" stroke-width="{w}"{o}/>')
        elif kind == 'ellipse':
            cx, cy, rx, ry, rot = g
            out.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" transform="rotate({rot} {cx} {cy})" '
                       f'fill="none" stroke="{hexc(col)}" stroke-width="{w}"{o}/>')
        else:
            (x0, y0), (x1, y1), (x2, y2), (x3, y3) = g
            out.append(f'<path d="M{x0} {y0}C{x1} {y1} {x2} {y2} {x3} {y3}" fill="none" stroke="{hexc(col)}" '
                       f'stroke-width="{w}" stroke-linecap="round"{o}/>')
    out.append('</svg>')
    return '\n'.join(out) + '\n'

# ---------------- rasterising ----------------
def polyline(kind, g, steps=160):
    if kind in ('ring', 'disc'):
        cx, cy, r = g
        return [(cx + r * math.cos(2 * math.pi * i / steps), cy + r * math.sin(2 * math.pi * i / steps)) for i in range(steps + 1)]
    if kind == 'ellipse':
        cx, cy, rx, ry, rot = g; a = math.radians(rot); ca, sa = math.cos(a), math.sin(a)
        pts = []
        for i in range(steps + 1):
            t = 2 * math.pi * i / steps; x, y = rx * math.cos(t), ry * math.sin(t)
            pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
        return pts
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = g
    pts = []
    for i in range(steps + 1):
        t = i / steps; u = 1 - t
        pts.append((u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3,
                    u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3))
    return pts

def render(n, ss, fit=1.0, ground=None):
    N, k = n * ss, n * ss / 32 * fit
    off = N * (1 - fit) / 2
    buf = [[0.0, 0.0, 0.0, 0.0] for _ in range(N * N)]          # premultiplied
    if ground:
        for p in buf: p[:] = [ground[0], ground[1], ground[2], 1.0]
    def paint(mask, col, op):
        for idx in mask:
            p = buf[idx]; a = op; ia = 1 - a
            p[0] = col[0] * a + p[0] * ia; p[1] = col[1] * a + p[1] * ia
            p[2] = col[2] * a + p[2] * ia; p[3] = a + p[3] * ia
    for kind, g, col, op, w in MARK:
        mask = set()
        if kind == 'disc':
            cx, cy, r = off + g[0] * k, off + g[1] * k, g[2] * k
            for y in range(max(0, int(cy - r)), min(N, int(cy + r) + 2)):
                for x in range(max(0, int(cx - r)), min(N, int(cx + r) + 2)):
                    if (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= r * r: mask.add(y * N + x)
        else:
            pts = [(off + x * k, off + y * k) for x, y in polyline(kind, g)]
            hw = w * k / 2
            for (ax, ay), (bx, by) in zip(pts, pts[1:]):
                dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy or 1e-9
                for y in range(max(0, int(min(ay, by) - hw)), min(N, int(max(ay, by) + hw) + 2)):
                    for x in range(max(0, int(min(ax, bx) - hw)), min(N, int(max(ax, bx) + hw) + 2)):
                        px, py = x + .5, y + .5
                        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2))
                        if (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2 <= hw * hw: mask.add(y * N + x)
        paint(mask, col, op)
    out = []                                                     # box-downsample
    for j in range(n):
        for i in range(n):
            acc = [0.0] * 4
            for y in range(j * ss, j * ss + ss):
                row = y * N
                for x in range(i * ss, i * ss + ss):
                    p = buf[row + x]
                    for c in range(4): acc[c] += p[c]
            a = acc[3] / (ss * ss)
            out.append((tuple(acc[c] / (ss * ss) / a for c in range(3)) if a else (0, 0, 0), a))
    return out

def png(n, px, rgba=True):
    raw = bytearray()
    for j in range(n):
        raw.append(0)
        for i in range(n):
            (r, g, b), a = px[j * n + i]
            raw += bytes(max(0, min(255, round(v))) for v in (r, g, b))
            if rgba: raw.append(max(0, min(255, round(a * 255))))
    ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 6 if rgba else 2, 0, 0, 0)) +
            ch(b'IDAT', zlib.compress(bytes(raw), 9)) + ch(b'IEND', b''))

# usage: python3 make.py [out_dir]   (defaults to this folder)
out = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'favicon.svg'), 'w').write(svg())
made = {}
for n in (16, 32, 48):                       # these three live only inside favicon.ico
    made[n] = png(n, render(n, 8))
# iOS rounds the square itself and fills transparency with black: give it the
# ground edge to edge and the globe at 86% so it keeps a margin inside the mask
open(os.path.join(out, 'apple-touch-icon.png'), 'wb').write(png(180, render(180, 4, .86, GROUND), rgba=False))
hdr, dirs, blobs, pos = struct.pack('<HHH', 0, 1, 3), b'', b'', 6 + 16 * 3
for n in (16, 32, 48):
    d = made[n]; dirs += struct.pack('<BBBBHHII', n, n, 0, 0, 1, 32, len(d), pos); blobs += d; pos += len(d)
open(os.path.join(out, 'favicon.ico'), 'wb').write(hdr + dirs + blobs)
for f in ('favicon.svg', 'favicon.ico', 'apple-touch-icon.png'):
    print(f'{f:22s} {os.path.getsize(os.path.join(out, f)):6d} bytes')
