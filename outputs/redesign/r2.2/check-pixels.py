"""Compare real R2.2 browser captures; build an evidence contact sheet without editing originals."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parent
FRAMES = ROOT / "screenshots"
POSES = ("0", "0.25", "0.5", "0.75", "1")
VIEWPORTS = ("desktop", "mobile")
missing, pairs, metrics = [], [], []


def luminance_metrics(image):
    r, g, b = image.split()
    maximum = ImageChops.lighter(ImageChops.lighter(r, g), b)
    histogram = maximum.histogram()
    total = image.width * image.height
    colour_error = ImageChops.lighter(ImageChops.lighter(ImageChops.difference(r, g), ImageChops.difference(g, b)), ImageChops.difference(r, b))
    colour_histogram = colour_error.histogram()
    return {
        "maximum_rgb": max(image.getextrema()[i][1] for i in range(3)),
        "white_fraction": sum(histogram[250:]) / total,
        "non_mono_pixels_over_1": sum(colour_histogram[2:]),
    }


for viewport in VIEWPORTS:
    for pose in POSES:
        images = []
        for direction in ("forward", "reverse"):
            path = FRAMES / f"{viewport}-{direction}-{pose}.png"
            if not path.is_file():
                missing.append(path.name)
                images.append(None)
                continue
            with Image.open(path) as original:
                image = original.convert("RGB")
                image.load()
            images.append(image)
            metrics.append({"file": path.name, "size": image.size, **luminance_metrics(image)})
        if None in images:
            continue
        forward, reverse = images
        if forward.size != reverse.size:
            pairs.append({"viewport": viewport, "progress": float(pose), "same_size": False, "pass": False})
            continue
        difference = ImageChops.difference(forward, reverse)
        channels = difference.split()
        maximum = ImageChops.lighter(ImageChops.lighter(channels[0], channels[1]), channels[2])
        histogram = maximum.histogram()
        total = forward.width * forward.height
        changed = total - histogram[0]
        significant = sum(histogram[4:])
        pairs.append({
            "viewport": viewport, "progress": float(pose), "size": forward.size,
            "same_size": True, "exact": changed == 0, "changed_pixels": changed,
            "changed_fraction": changed / total, "pixels_over_3": significant,
            "fraction_over_3": significant / total,
            "max_channel_difference": max(part[1] for part in difference.getextrema()),
            "mean_absolute_channel_difference": sum(ImageStat.Stat(difference).mean) / 3,
            "pass": changed == 0,
        })

# Same states at the same progress: no hidden HUD exclusions or reconstructed pixels.
dark_frames = [row for row in metrics if row["file"].endswith("-0.5.png")]
dark_pass = all(row["maximum_rgb"] <= 3 for row in dark_frames)
mono_pass = all(row["non_mono_pixels_over_1"] == 0 for row in metrics)
complete = len(pairs) == 10 and not missing
passed = complete and all(row["pass"] for row in pairs) and dark_pass and mono_pass
result = {
    "complete": complete, "passed": passed, "missing": missing,
    "pairs": pairs, "frame_metrics": metrics,
    "dark_interval_pass": dark_pass, "monochrome_pass": mono_pass,
    "scope": "Encoded screenshot pixels; does not establish raw HDR finite values or real-device FPS.",
    "capture_policy": "Original PNGs unchanged; Browser hides HUD/controls before capture. Comparison uses all original pixels.",
}
(ROOT / "pixel-results.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

column_width, gutter, heading_height = 480, 12, 30
rows = []
for viewport in VIEWPORTS:
    for direction in ("forward", "reverse"):
        available = [FRAMES / f"{viewport}-{direction}-{pose}.png" for pose in POSES]
        heights = []
        for path in available:
            if path.is_file():
                with Image.open(path) as image:
                    heights.append(round(image.height * column_width / image.width))
        if heights:
            rows.append((viewport, direction, available, max(heights)))
sheet_height = sum(height + heading_height + gutter for _, _, _, height in rows) + 55
sheet = Image.new("RGB", (5 * (column_width + gutter) + gutter, sheet_height), "#050505")
draw = ImageDraw.Draw(sheet)
draw.text((gutter, 12), "R2.2 | Browser screenshots | desktop/mobile forward/reverse | illustrations: none", fill="white")
y = 45
for viewport, direction, available, height in rows:
    for index, path in enumerate(available):
        x = gutter + index * (column_width + gutter)
        draw.text((x, y), f"{viewport} {direction} p={POSES[index]}", fill="white")
        if path.is_file():
            with Image.open(path) as source:
                thumbnail = source.convert("RGB")
                thumbnail.thumbnail((column_width, height), Image.Resampling.LANCZOS)
            sheet.paste(thumbnail, (x, y + heading_height))
        else:
            draw.text((x, y + heading_height), "MISSING CAPTURE", fill="white")
    y += height + heading_height + gutter
sheet_path = ROOT / ("contact-sheet.jpg" if complete else "contact-sheet-incomplete.jpg")
sheet.save(sheet_path, quality=90)
print(json.dumps({"complete": complete, "passed": passed, "pairs": len(pairs), "missing": missing, "dark_interval_pass": dark_pass, "monochrome_pass": mono_pass, "sheet": str(sheet_path)}, indent=2))
sys.exit(0 if passed else 2)
