"""Precompute the FullCircle demo data with the real model.

Usage: python precompute.py <path-to-backend/.env> <out-dir>

Writes <out-dir>/fullcircle.json (the exact data the demo build would contain)
and <out-dir>/review.md (the same data, for reading). The Last.fm key is read
from the env file into the process environment and is never printed or written.
"""
import contextlib
import io
import json
import os
import sys
from pathlib import Path

import requests
from dotenv import dotenv_values

SEEDS = [
    "Laufey",
    "Little Simz",
    "Dave",
    "Cuco",
    "Rosalía",
    "Arctic Monkeys",
    "Radiohead",
    "Tame Impala",
]
GENERIC_TAGS = {"seen live", "favorite", "favorites", "love", "awesome", "cool", "good"}
THRESHOLD = 0.60  # app.py's value
TOP_N = 10
UI_TAGS = 6  # page.tsx shows matching_tags.slice(0, 6)

BACKEND = Path(__file__).resolve().parents[2] / "backend"


def lastfm_key(env_path: Path) -> str:
    values = dotenv_values(env_path)
    if not values.get("LASTFM_API_KEY"):
        sys.exit(f"LASTFM_API_KEY missing or empty; variable names present: {sorted(values)}")
    return values["LASTFM_API_KEY"]


def seed_tags(artist: str, key: str) -> list[str]:
    # Same filter as frontend lib/lastfm.ts getArtistTags.
    r = requests.get(
        "https://ws.audioscrobbler.com/2.0/",
        params={"method": "artist.gettoptags", "artist": artist, "api_key": key, "format": "json"},
        timeout=20,
    )
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        sys.exit(f"Last.fm error for {artist}: {data.get('message')}")
    tags = data.get("toptags", {}).get("tag", [])
    kept = [t for t in tags if t["name"].lower() not in GENERIC_TAGS and int(t["count"]) > 0]
    return [t["name"].lower() for t in kept[:10]]


def main() -> None:
    env_path, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    key = lastfm_key(env_path)

    tags_by_seed = {s: seed_tags(s, key) for s in SEEDS}
    del key

    # predict.py loads artifacts from a relative path and prints candidate
    # artist names while it runs; run it from backend/ with stdout discarded.
    os.chdir(BACKEND)
    sys.path.insert(0, str(BACKEND))
    with contextlib.redirect_stdout(io.StringIO()):
        import predict

    meta = json.loads((BACKEND / "model_artifacts" / "model_metadata.json").read_text())

    seeds_out = []
    for seed in SEEDS:
        tags = tags_by_seed[seed]
        entry = {"seed": seed, "tags": tags}
        for weighted in (True, False):
            with contextlib.redirect_stdout(io.StringIO()):
                recs = predict.generate_recommendations(
                    seed, tags, weighted=weighted, threshold=THRESHOLD, top_n=TOP_N, exclude_artists=[]
                )
            variant = "weighted" if weighted else "unweighted"
            if recs and "message" in recs[0]:
                entry["probability"] = recs[0]["probability"]
                entry[variant] = []
                entry["refused"] = True
            else:
                entry["probability"] = recs[0]["prediction_confidence"]
                entry[variant] = [
                    {
                        "rank": i + 1,
                        "artist": r["artist"],
                        "similarity": round(r["similarity_to_input"], 4),
                        "matching_tags": r["matching_tags"][:UI_TAGS],
                    }
                    for i, r in enumerate(recs)
                ]
        entry["probability"] = round(entry["probability"], 4)
        seeds_out.append(entry)

    out = {
        "model": {
            "trained_at": meta["trained_at"],
            "test_accuracy": round(meta["test_accuracy"], 4),
            "cv_accuracy": round(meta["cv_accuracy"], 4),
            "n_features": meta["n_features"],
        },
        "threshold": THRESHOLD,
        "seeds": seeds_out,
    }
    (out_dir / "fullcircle.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = ["# FullCircle demo: review file", "", f"Model trained {meta['trained_at']}, test accuracy {out['model']['test_accuracy']}, CV {out['model']['cv_accuracy']}.", ""]
    for e in seeds_out:
        lines += [f"## {e['seed']}", "", f"Tags: {', '.join(e['tags'])}", f"Prediction confidence: {e['probability']:.2%}", ""]
        if e.get("refused"):
            lines += [f"Below the {THRESHOLD:.0%} threshold: the model returns no recommendations.", ""]
            continue
        lines += ["| # | weighted | sim | tags | unweighted | sim | tags |", "|---|---|---|---|---|---|---|"]
        for w, u in zip(e["weighted"], e["unweighted"]):
            lines.append(f"| {w['rank']} | {w['artist']} | {w['similarity']:.1%} | {', '.join(w['matching_tags'])} | {u['artist']} | {u['similarity']:.1%} | {', '.join(u['matching_tags'])} |")
        lines.append("")
    (out_dir / "review.md").write_text("\n".join(lines), encoding="utf-8")
    print("seeds:", len(seeds_out), "refused:", [e["seed"] for e in seeds_out if e.get("refused")])
    print("wrote", out_dir / "fullcircle.json", "and", out_dir / "review.md")


if __name__ == "__main__":
    main()
