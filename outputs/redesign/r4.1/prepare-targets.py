"""Offline R4.1 target preparation from the verified R0.2 assets only.

Run with the bundled Python/Pillow runtime and installed ImageMagick.
The particles suggest a structure; the completed mark remains the original asset.
"""
from hashlib import sha256
from io import BytesIO
import json
import math
from pathlib import Path
import subprocess

from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "outputs/redesign/r0.2"
DEST = ROOT / "src/3d/data/symbolTargets.json"
AI_IDS = ("chatgpt", "claude", "google-antigravity")
SCHOOL_IDS = {"Cir": "saigonUniversity", "Tel": "greenAcademy", "Pic": "arenaMultimedia"}
LUMINANCE_MIN = 110
EDGE_MAX = 0.3


def bright(pixel):
    r, g, b, alpha = pixel
    return alpha >= 128 and 0.2126 * r + 0.7152 * g + 0.0722 * b >= LUMINANCE_MIN


def logo_target(asset):
    web = next(file for file in asset["files"] if file["role"] == "web")
    path = SOURCE / web["path"]
    assert len(path.read_bytes()) == web["bytes"]
    assert sha256(path.read_bytes()).hexdigest() == web["sha256"]
    # Native SVG paths/alpha are rasterized offline, never redrawn as invented logos.
    png = subprocess.run(
        ["magick", "-background", "none", str(path), "-resize", "512x512", "PNG32:-"],
        check=True, capture_output=True,
    ).stdout
    image = Image.open(BytesIO(png)).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    candidates = [(x, y) for y in range(height) for x in range(width) if bright(pixels[x, y])]
    count = 64 if asset["id"] in AI_IDS else 192
    assert len(candidates) >= count, asset["id"]
    # Deterministic bounded farthest-point sampling spreads tiny stars across real ink.
    candidates = candidates[::max(1, len(candidates) // 3500)]
    aspect_x = web["width"] / max(web["width"], web["height"])
    aspect_y = web["height"] / max(web["width"], web["height"])
    normalized = [((x + 0.5) / width * 2 * aspect_x - aspect_x,
                   aspect_y - (y + 0.5) / height * 2 * aspect_y) for x, y in candidates]
    distances = [math.inf] * len(candidates)
    chosen = []
    index = min(range(len(candidates)), key=lambda i: normalized[i][0] ** 2 + normalized[i][1] ** 2)
    for _ in range(count):
        chosen.append(index)
        x, y = normalized[index]
        for i, (cx, cy) in enumerate(normalized):
            distances[i] = min(distances[i], (cx - x) ** 2 + (cy - y) ** 2)
        index = max(range(len(candidates)), key=distances.__getitem__)
    points = [[round(normalized[i][0], 7), round(normalized[i][1], 7), 0] for i in chosen]
    selected_pixels = [candidates[i] for i in chosen]
    edges = set()
    for i, (x, y, _) in enumerate(points):
        neighbours = sorted(range(count), key=lambda j: (points[j][0] - x) ** 2 + (points[j][1] - y) ** 2)
        for j in neighbours[1:3]:
            if math.dist(points[i], points[j]) > EDGE_MAX:
                continue
            ax, ay = selected_pixels[i]
            bx, by = selected_pixels[j]
            steps = max(abs(bx - ax), abs(by - ay), 1)
            # Do not draw across blank space or an Adobe tile's dark background.
            if all(bright(pixels[round(ax + (bx - ax) * step / steps),
                                 round(ay + (by - ay) * step / steps)]) for step in range(steps + 1)):
                edges.add(tuple(sorted((i, j))))
    return {
        "id": asset["id"], "path": path.relative_to(ROOT).as_posix(),
        "width": web["width"], "height": web["height"], "sha256": web["sha256"],
        "bytes": web["bytes"], "monoType": asset["monoType"],
        "sourceUrl": asset["sourceUrl"], "sourcePageUrl": asset["sourcePageUrl"],
        "attribution": asset["attribution"], "treatment": asset["treatment"],
        "sampling": {"method": "deterministic farthest-point from decoded bright ink",
                     "luminanceMin": LUMINANCE_MIN, "alphaMin": 128,
                     "scale": "uniform; maximum source dimension spans 2 scene units",
                     "edgeMax": EDGE_MAX, "originalLogoRequired": True},
        "points": points, "edges": sorted(edges),
    }


def main():
    manifest = json.loads((SOURCE / "logo-assets.json").read_text(encoding="utf-8"))
    constellation_path = SOURCE / "constellation-data.json"
    catalog = json.loads(constellation_path.read_text(encoding="utf-8"))
    logos = [logo_target(asset) for asset in manifest["assets"]]
    education = [{"id": SCHOOL_IDS[entry["id"]], "constellationId": entry["id"],
                  "name": entry["name"], "assignment": entry["assignment"],
                  "geometry": entry["geometry"], "projection": entry["projection"],
                  "notes": entry["notes"]}
                 for entry in catalog["constellations"] if entry["id"] in SCHOOL_IDS]
    result = {"schemaVersion": 1, "poolCount": 192, "aiLogos": list(AI_IDS),
              "logoSource": "outputs/redesign/r0.2/logo-assets.json",
              "educationSource": {"path": constellation_path.relative_to(ROOT).as_posix(),
                                  "sha256": sha256(constellation_path.read_bytes()).hexdigest(),
                                  "catalog": catalog["catalog"], "sources": catalog["sources"]},
              "logos": logos, "education": education}
    # One runnable preparation check: unique bounded targets, short edges, exact catalog copy.
    assert len(logos) == 9 and len(education) == 3
    for logo in logos:
        expected = 64 if logo["id"] in AI_IDS else 192
        assert len(logo["points"]) == len(set(map(tuple, logo["points"]))) == expected
        assert all(math.isfinite(value) and abs(value) <= 1 for point in logo["points"] for value in point)
        assert all(0 <= i < expected and 0 <= j < expected and i != j and
                   math.dist(logo["points"][i], logo["points"][j]) <= EDGE_MAX + 1e-6
                   for i, j in logo["edges"])
    for entry in education:
        original = next(c for c in catalog["constellations"] if c["id"] == entry["constellationId"])
        assert entry["geometry"] == original["geometry"] and entry["projection"] == original["projection"]
        assert len(entry["geometry"]["stars"]) + len(entry["geometry"]["supportingStars"]) <= 15
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(DEST.relative_to(ROOT)), "poolCount": result["poolCount"],
                      "logos": [{"id": l["id"], "points": len(l["points"]), "edges": len(l["edges"])} for l in logos],
                      "education": [{"id": e["id"], "figure": len(e["geometry"]["stars"]),
                                     "context": len(e["geometry"]["supportingStars"]),
                                     "edges": len(e["geometry"]["edges"])} for e in education],
                      "bytes": DEST.stat().st_size, "sha256": sha256(DEST.read_bytes()).hexdigest()}, indent=2))


if __name__ == "__main__":
    main()
