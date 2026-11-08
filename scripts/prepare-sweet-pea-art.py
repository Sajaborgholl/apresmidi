"""Turn the Higgsfield watercolor pieces into web assets.
Paper-backed pieces (spray, vine, clouds): unmultiply the paper colour so the
watercolor stays transparent like real pigment. Butterfly + seal come from the
background remover. Writes public/templates/wedding-sweet-pea/."""
import sys
import numpy as np
from PIL import Image, ImageFilter

HF = "/home/agent/work/ghina-malek/hf/"
OUT = "/home/agent/work/ghina-malek/wt/public/templates/wedding-sweet-pea/"

def unpaper(path, crop=None, gain=1.25, floor=0.035):
    im = Image.open(path).convert("RGB")
    if crop: im = im.crop(crop)
    a = np.asarray(im).astype(np.float32)
    # paper colour: brightest common tone, estimated per channel on a blurred copy
    blur = np.asarray(im.filter(ImageFilter.GaussianBlur(40))).astype(np.float32)
    paper = np.maximum(np.percentile(blur.reshape(-1, 3), 92, axis=0), 200)
    # local paper (handles vignetting): max of global estimate and blurred local light
    rel = np.clip(a / paper, 0, 1)
    alpha = 1 - rel.min(axis=2)
    alpha = np.clip((alpha - floor) / (1 - floor) * gain, 0, 1)
    al = alpha[..., None]
    rgb = np.where(al > 0.003, (a - paper * (1 - al)) / np.maximum(al, 1e-3), 255)
    rgb = np.clip(rgb, 0, 255)
    out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
    bb = out.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    return out.crop(bb) if bb else out

def save(im, name, width=None, q=86):
    if width and im.width > width:
        im = im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT + name, quality=q, method=6)
    print(name, im.size)

only = sys.argv[1:] or ["spray", "vine", "clouds", "sky", "butterfly", "seal"]
if "spray" in only: save(unpaper(HF + "spray.png"), "spray.webp", 1800)
if "vine" in only: save(unpaper(HF + "vine.png"), "vine.webp", 700)
if "clouds" in only:
    c = unpaper(HF + "clouds.png", gain=1.7, floor=0.06)
    # split into 4 equal cells on transparent canvas (CSS background-size 400%)
    A = np.asarray(c.getchannel("A"))
    cols = A.max(axis=0) > 12
    runs, inrun = [], False
    for x, v in enumerate(cols):
        if v and not inrun: start, inrun = x, True
        if not v and inrun: runs.append((start, x)); inrun = False
    if inrun: runs.append((start, len(cols)))
    runs = [r for r in runs if r[1] - r[0] > 80][:4]
    cw = max(r[1] - r[0] for r in runs) + 40; ch = c.height + 40
    sheet = Image.new("RGBA", (cw * 4, ch), (0, 0, 0, 0))
    for i, (x0, x1) in enumerate(runs):
        piece = c.crop((x0, 0, x1, c.height))
        sheet.alpha_composite(piece, (i * cw + (cw - piece.width) // 2, 20))
    save(sheet, "clouds.webp", 2400)
if "sky" in only:
    s = Image.open(HF + "sky.png").convert("RGB")
    save(s.resize((1000, int(s.height * 1000 / s.width)), Image.LANCZOS), "sky.webp", q=82)
for name in ("butterfly", "seal"):
    if name in only:
        im = Image.open(HF + name + "_cut.png").convert("RGBA")
        bb = im.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
        im = im.crop(bb)
        if name == "butterfly":
            # make it exactly symmetric around the body so the two wing halves fold cleanly
            w = im.width; half = w // 2
            left = im.crop((0, 0, half, im.height))
            im = Image.new("RGBA", (half * 2, im.height)); im.paste(left, (0, 0)); im.paste(left.transpose(Image.FLIP_LEFT_RIGHT), (half, 0))
            save(im, "butterfly.webp", 420, q=90)
        else:
            save(im, "seal.webp", 520, q=90)
