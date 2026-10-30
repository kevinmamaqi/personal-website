"""Render the committed social card with ImageMagick and the site's fonts."""
import argparse
import json
from pathlib import Path
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument("--font-dir", type=Path, required=True,
                    help="Directory containing EBGaramond.ttf and Inter.ttf")
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
css = (root / "public/styles/base.css").read_text()
colors = {key: re.search(r"--" + key + r":\s*([^;]+);", css).group(1).strip()
          for key in ("paper", "ink", "line", "muted")}
lines = ["Hi, I’m Kevin.", "I write software and lead", "the teams that build it."]
headline = json.loads(re.search(r'HEADLINE = ("[^"]+")',
                               (root / "src/content/positioning.ts").read_text()).group(1))
assert " ".join(lines) == headline, "Update the social card line breaks for the new headline."
serif, sans = (args.font_dir / "EBGaramond.ttf"), (args.font_dir / "Inter.ttf")
subprocess.run([
    "magick", "-size", "1200x630", "xc:" + colors["paper"],
    "-fill", colors["ink"], "-font", str(sans), "-pointsize", "32",
    "-annotate", "+64+108", "Kevin Mamaqi Kapllani",
    "-font", str(serif), "-pointsize", "68", "-annotate", "+64+222", lines[0],
    "-annotate", "+64+302", lines[1], "-annotate", "+64+382", lines[2],
    "-stroke", colors["line"], "-strokewidth", "1", "-draw", "line 64,492 1136,492",
    "-stroke", "none", "-fill", colors["muted"], "-font", str(sans), "-pointsize", "26",
    "-annotate", "+64+548", "kevinmamaqi.com", str(root / "public/social-card.png"),
], check=True)
