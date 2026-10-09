import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
img = Image.new('RGB', (W, H), color=(5, 5, 5))

# Create a drawing layer for glow effects
glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
draw_glow = ImageDraw.Draw(glow_layer)

# Background stars
random.seed(42)
for _ in range(160):
    sx = random.randint(10, W - 10)
    sy = random.randint(10, H - 10)
    brightness = random.randint(60, 220)
    size = random.choice([1, 1, 1, 2])
    draw_glow.rectangle([sx, sy, sx + size - 1, sy + size - 1], fill=(brightness, brightness, brightness, 200))

# Black hole parameters on the right
bh_cx, bh_cy = 880, 315
shadow_r = 72

# Outer accretion disk glow (tilted ellipse)
# Disk tilt ~75 degrees: wide along X (rx=240), narrow along Y (ry=54)
for r_mult in range(18, 0, -1):
    rx = 110 + r_mult * 10
    ry = int(rx * 0.26)
    alpha = int(14 * (1.0 - r_mult / 18))
    # Doppler effect: left side of disk is brighter (approaching)
    draw_glow.ellipse(
        [bh_cx - rx, bh_cy - ry, bh_cx + rx, bh_cy + ry],
        outline=(255, 255, 255, alpha),
        width=3
    )

# Accretion disk core ring
for step in range(360):
    rad = math.radians(step)
    rx = 160
    ry = 42
    x = bh_cx + rx * math.cos(rad)
    y = bh_cy + ry * math.sin(rad)
    # Doppler asymmetry: cos(rad) < 0 is left side (brighter)
    doppler = (1.0 - math.cos(rad)) * 0.5
    brightness = int(100 + 155 * doppler)
    alpha = int(120 + 135 * doppler)
    draw_glow.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(brightness, brightness, brightness, alpha))

# Upper gravitational lensing arc
for step in range(120, 240):
    rad = math.radians(step)
    rx = 105
    ry = 68
    x = bh_cx + rx * math.cos(rad)
    y = bh_cy + ry * math.sin(rad) - 20
    draw_glow.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(220, 220, 220, 160))

# Blur the glow layer slightly for bloom
glow_blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius=2))
img.paste(glow_blurred, (0, 0), glow_blurred)

# Re-draw the sharp event horizon (black shadow) & photon ring
draw = ImageDraw.Draw(img)

# Deep shadow
draw.ellipse(
    [bh_cx - shadow_r, bh_cy - shadow_r, bh_cx + shadow_r, bh_cy + shadow_r],
    fill=(0, 0, 0)
)

# Thin sharp photon ring
draw.ellipse(
    [bh_cx - shadow_r - 1, bh_cy - shadow_r - 1, bh_cx + shadow_r + 1, bh_cy + shadow_r + 1],
    outline=(255, 255, 255),
    width=1
)

# Inner shadow core
draw.ellipse(
    [bh_cx - shadow_r + 2, bh_cy - shadow_r + 2, bh_cx + shadow_r - 2, bh_cy + shadow_r - 2],
    fill=(2, 2, 2)
)

# Subtle grid lines
grid_color = (25, 25, 25)
for gx in range(60, W, 120):
    draw.line([(gx, 40), (gx, H - 40)], fill=grid_color, width=1)
for gy in range(40, H, 110):
    draw.line([(60, gy), (W - 60, gy)], fill=grid_color, width=1)

# Outer frame border with corner accents
draw.rectangle([40, 40, W - 40, H - 40], outline=(38, 38, 38), width=1)
# Corner marks
for (cx, cy) in [(40, 40), (W - 40, 40), (40, H - 40), (W - 40, H - 40)]:
    dx = 15 if cx == 40 else -15
    dy = 15 if cy == 40 else -15
    draw.line([(cx, cy), (cx + dx, cy)], fill=(200, 200, 200), width=2)
    draw.line([(cx, cy), (cx, cy + dy)], fill=(200, 200, 200), width=2)

# Load fonts
fonts_dir = os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts')
font_hero_bold = ImageFont.truetype(os.path.join(fonts_dir, 'segoeuib.ttf'), 52)
font_role_mono = ImageFont.truetype(os.path.join(fonts_dir, 'consolab.ttf'), 24)
font_label_mono = ImageFont.truetype(os.path.join(fonts_dir, 'consolab.ttf'), 14)
font_body = ImageFont.truetype(os.path.join(fonts_dir, 'segoeui.ttf'), 20)
font_small = ImageFont.truetype(os.path.join(fonts_dir, 'consola.ttf'), 13)

# 1. Section indicator / Label
draw.ellipse([80, 96, 88, 104], fill=(250, 250, 250))
draw.text((98, 92), "STELLAR ODYSSEY  //  PORTFOLIO 2026", fill=(160, 160, 160), font=font_label_mono)

# 2. Main Name
draw.text((80, 150), "TRẦN VŨ ANH DUY", fill=(250, 250, 250), font=font_hero_bold)

# 3. Role
draw.text((80, 225), "CREATIVE DESIGNER", fill=(255, 255, 255), font=font_role_mono)
draw.line([(80, 268), (420, 268)], fill=(60, 60, 60), width=1)

# 4. Description / Tagline
draw.text((80, 290), "UX/UI Design  ·  Motion Graphics  ·  Interactive 3D", fill=(210, 210, 210), font=font_body)
draw.text((80, 325), "Bridging the gap between functional UI & cinematic storytelling.", fill=(140, 140, 140), font=font_body)

# 5. Project Tags Box
tags = ["EDURA LMS", "VERIS APP", "VIE PERFUME"]
tx = 80
for tag in tags:
    tw = int(draw.textlength(tag, font=font_small))
    draw.rectangle([tx, 395, tx + tw + 24, 427], outline=(60, 60, 60), fill=(15, 15, 15))
    draw.text((tx + 12, 403), tag, fill=(180, 180, 180), font=font_small)
    tx += tw + 36

# 6. Tech coordinates / specs watermark
draw.text((80, 520), "SPEC: REACT 19 · THREE.JS · GSAP · TAILWIND 4 · AWWWARDS SOTD READY", fill=(100, 100, 100), font=font_small)
draw.text((80, 545), "https://stellar-odyssey.vercel.app", fill=(150, 150, 150), font=font_small)

# 7. Coordinates under black hole
draw.text((bh_cx - 85, bh_cy + 130), "SINGULARITY [z = -200]", fill=(120, 120, 120), font=font_small)
draw.text((bh_cx - 85, bh_cy + 148), "SCHWARZSCHILD RADIUS 2GM/c²", fill=(80, 80, 80), font=font_small)

# Save to public/og-image.jpg
out_path = os.path.join('public', 'og-image.jpg')
img.save(out_path, 'JPEG', quality=90, progressive=True)
size_kb = os.path.getsize(out_path) / 1024
print(f"OG Image generated successfully at {out_path} ({size_kb:.1f} KB, 1200x630)")
