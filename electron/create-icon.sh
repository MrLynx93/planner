#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SVG="$SCRIPT_DIR/icon.svg"
ICONSET="$SCRIPT_DIR/build/AppIcon.iconset"
ICNS="$SCRIPT_DIR/build/icon.icns"

if ! command -v rsvg-convert &>/dev/null; then
  echo "rsvg-convert not found. Install with: brew install librsvg"
  exit 1
fi

mkdir -p "$ICONSET"

for size in 16 32 64 128 256 512 1024; do
  rsvg-convert -w "$size" -h "$size" "$SVG" -o "$ICONSET/tmp_${size}.png"
done

cp "$ICONSET/tmp_16.png"   "$ICONSET/icon_16x16.png"
cp "$ICONSET/tmp_32.png"   "$ICONSET/icon_16x16@2x.png"
cp "$ICONSET/tmp_32.png"   "$ICONSET/icon_32x32.png"
cp "$ICONSET/tmp_64.png"   "$ICONSET/icon_32x32@2x.png"
cp "$ICONSET/tmp_128.png"  "$ICONSET/icon_128x128.png"
cp "$ICONSET/tmp_256.png"  "$ICONSET/icon_128x128@2x.png"
cp "$ICONSET/tmp_256.png"  "$ICONSET/icon_256x256.png"
cp "$ICONSET/tmp_512.png"  "$ICONSET/icon_256x256@2x.png"
cp "$ICONSET/tmp_512.png"  "$ICONSET/icon_512x512.png"
cp "$ICONSET/tmp_1024.png" "$ICONSET/icon_512x512@2x.png"

rm "$ICONSET"/tmp_*.png

iconutil -c icns "$ICONSET" -o "$ICNS"
rm -rf "$ICONSET"

echo "Done: $ICNS"
