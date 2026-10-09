"""Read-only source validation and manifest for the three R6.1 EDURA figures."""
import hashlib
import json
from pathlib import Path

from PIL import Image, __version__ as pillow_version

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
pack = json.loads((ROOT / "outputs/redesign/r0.3/asset-index.json").read_text(encoding="utf-8-sig"))
selected = []
names = {"A02": "overview.webp", "A07": "problem.webp", "A09": "solution.webp"}
for asset_id, name in names.items():
    asset = next(item for item in pack["assets"] if item["id"] == asset_id)
    path = ROOT / asset["path"]
    data = path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    assert digest == asset["sha256"], f"Source hash drift: {asset_id}"
    assert len(data) == asset["bytes"], f"Source bytes drift: {asset_id}"
    assert asset["classification"] != "competitor-apms"
    assert asset["selection"] == "primary"
    with Image.open(path) as image:
        image.load()
        assert image.format == "WEBP" and image.mode == "RGB"
        assert image.size == (1400, 989) == (asset["width"], asset["height"])
        chromatic = sum(1 for r, g, b in image.get_flattened_data() if max(r, g, b) - min(r, g, b) > 8)
        assert chromatic > 0, f"Unexpected grayscale image: {asset_id}"
        actual = {"format": image.format, "mode": image.mode, "width": image.width,
                  "height": image.height, "alpha": False, "decode": "pass",
                  "bytes": len(data), "sha256": digest,
                  "chromaticPixelThreshold": "max(R,G,B)-min(R,G,B)>8",
                  "chromaticPixelCount": chromatic, "pixelCount": image.width * image.height}
    selected.append({"id": asset_id, "sourcePath": asset["path"],
                     "sourceAbsolutePath": str(path).replace("\\", "/"),
                     "sourceUrl": asset["sourceUrl"], "sourcePage": asset["sourcePage"],
                     "sourceId": asset["sourceId"], "classification": asset["classification"],
                     "recommendedPublicPath": "public/projects/edura/" + name,
                     "alt": asset["alt"], "caption": asset["caption"],
                     "attribution": asset["attribution"], "restriction": asset["restriction"],
                     "recommendedDisplay": asset["recommendedDisplay"], "actual": actual})
assert len({asset["actual"]["sha256"] for asset in selected}) == 3
result = {"task": "R6.1", "checkedLocalDate": "2026-10-08", "status": "selected-originals-verified",
          "sourcePack": "outputs/redesign/r0.3/asset-index.json", "pillowVersion": pillow_version,
          "totalBytes": sum(asset["actual"]["bytes"] for asset in selected), "assets": selected,
          "originalsUnchanged": True, "publicCopiedByThisAudit": False,
          "derivativesRecommended": False,
          "reason": "1400px original WebP files are already 92-136 KB, sufficient at max CSS width 1280px on DPR1; no re-encoding or semantic edits needed.",
          "limits": ["Embedded slide text is not legible at 320/390px; sourced DOM copy and captions remain primary.",
                     "Only 1400px sources available; high-DPR display cannot claim native 2x detail at 1280px CSS width.",
                     "A02 is an EDURA UI overview, A07/A09 are concept slides, not a tested flow or outcome.",
                     "No live CDN GET or gallery completeness test in this read-only local audit.",
                     "APMS A15-A17 excluded; no replacement product screens inferred."]}
(OUT / "selected-assets.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": "pass", "assets": 3, "totalBytes": result["totalBytes"], "pillowVersion": pillow_version,
                  "results": [{"id": item["id"], **item["actual"]} for item in selected]}, ensure_ascii=False))
