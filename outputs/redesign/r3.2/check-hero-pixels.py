"""Read-only PNG checks; explicit ROIs are image observations, not DOM measurements."""
import hashlib
import json
from pathlib import Path
from PIL import Image

out = Path(__file__).resolve().parent
regions = {
    1440: {"core_above_disk": (1282, 298, 1300, 308), "outside_O_right_gutter": (1384, 280, 1390, 340), "empty_background": (60, 610, 1380, 790)},
    390: {"core_above_disk": (348, 224, 352, 227), "outside_O_right_gutter": (377, 214, 383, 241), "empty_background": (20, 600, 370, 740)},
    320: {"core_above_disk": (282, 220, 285, 223), "outside_O_right_gutter": (306, 212, 313, 233), "empty_background": (20, 600, 300, 740)},
}
results = []
for width, rois in regions.items():
    file = out / "screenshots" / f"inspect-{width}.png"
    image = Image.open(file).convert("RGB")
    assert image.width == width
    deviations = [max(p) - min(p) for p in image.get_flattened_data()]
    result = {"file": str(file.relative_to(out)), "sha256": hashlib.sha256(file.read_bytes()).hexdigest(), "size": image.size,
              "pixels": image.width * image.height, "maxChannelDeviation": max(deviations), "coloredPixelsOver1": sum(d > 1 for d in deviations), "regions": {}}
    for name, box in rois.items():
        pixels = list(image.crop(box).get_flattened_data())
        values = [max(p) for p in pixels]
        result["regions"][name] = {"box": box, "pixels": len(values), "minRGBMax": min(values), "maxRGBMax": max(values),
                                    "meanRGBMax": round(sum(values) / len(values), 4), "pixelsAtMost16": sum(v <= 16 for v in values), "pixelsOver32": sum(v > 32 for v in values), "maxChannelDeviation": max(max(p)-min(p) for p in pixels)}
    results.append(result)
document = {"note": "App fullscreen turbulence grain removed. Full PNG channel deviations remain on LCD text antialias; core/gutter/background ROIs have no channel deviations. ROIs manually selected on actual Hero PNGs; localized outside-O gutter does not prove all glyph margins. No screenshot pixels altered.", "results": results}
(out / "hero-pixels.json").write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(document, ensure_ascii=False, indent=2))
assert all(r["regions"]["core_above_disk"]["maxRGBMax"] <= 16 for r in results)
assert all(r["regions"]["outside_O_right_gutter"]["pixelsOver32"] == 0 for r in results)
assert all(r["regions"]["empty_background"]["pixelsOver32"] == 0 for r in results)
