#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
BUILD_DIR="$SCRIPT_DIR/build"
JRE_DIR="$BUILD_DIR/jre"

# ── Download pre-built Windows JRE from Adoptium (cached) ────────────────────
# Cross-platform jlink (macOS → Windows) is unreliable: macOS jlink embeds
# macOS launcher stubs instead of Windows PE executables. Use the pre-built JRE.
create_win_jre() {
  local dest="$JRE_DIR/win-x64-slim"

  if [ -d "$dest" ]; then
    echo "    Windows JRE already cached, skipping."
    return
  fi

  echo "    Downloading Windows x64 JRE from Adoptium..."
  local url="https://api.adoptium.net/v3/binary/latest/25/ga/windows/x64/jre/hotspot/normal/eclipse"
  local tmp="$JRE_DIR/jre-win-x64.zip"
  local extract_dir="$JRE_DIR/jre-win-x64-extract"

  mkdir -p "$JRE_DIR"
  curl -L -o "$tmp" "$url"
  mkdir -p "$extract_dir"
  unzip -q "$tmp" -d "$extract_dir"

  # Adoptium zip has one top-level directory (e.g. jdk-25.0.1+9-jre)
  local jre_dir="$extract_dir/$(ls "$extract_dir" | head -1)"
  mv "$jre_dir" "$dest"

  rm -rf "$extract_dir" "$tmp"
  echo "    Windows JRE ready."
}

# ── Generate icon.ico from icon.svg ───────────────────────────────────────────
create_ico() {
  local ico="$BUILD_DIR/icon.ico"

  if [ -f "$ico" ]; then
    echo "    icon.ico already exists, skipping."
    return
  fi

  if ! command -v rsvg-convert &>/dev/null; then
    echo "    ERROR: rsvg-convert not found. Install with: brew install librsvg"
    exit 1
  fi

  if ! command -v convert &>/dev/null && ! command -v magick &>/dev/null; then
    echo "    ERROR: ImageMagick not found. Install with: brew install imagemagick"
    exit 1
  fi

  local CONVERT="convert"
  command -v magick &>/dev/null && CONVERT="magick"

  echo "    Generating icon.ico..."
  local tmpdir
  tmpdir="$(mktemp -d)"

  for size in 16 32 48 64 128 256; do
    rsvg-convert -w "$size" -h "$size" "$SCRIPT_DIR/icon.svg" -o "$tmpdir/icon_${size}.png"
  done

  "$CONVERT" \
    "$tmpdir/icon_16.png" \
    "$tmpdir/icon_32.png" \
    "$tmpdir/icon_48.png" \
    "$tmpdir/icon_64.png" \
    "$tmpdir/icon_128.png" \
    "$tmpdir/icon_256.png" \
    "$ico"

  rm -rf "$tmpdir"
  echo "    icon.ico ready."
}

echo "==> Ensuring Windows JRE is present..."
create_win_jre

echo "==> Ensuring icon.ico is present..."
create_ico

echo "==> Cleaning dist directory..."
rm -rf "$SCRIPT_DIR/dist"

echo "==> Building frontend..."
cd "$ROOT_DIR/frontend"
npm install
npm run build

echo "==> Building backend JAR..."
cd "$ROOT_DIR/backend"
mvn package -DskipTests -q -P electron

echo "==> Copying resources to build/..."
mkdir -p "$BUILD_DIR"
JAR=$(ls "$ROOT_DIR/backend/target"/planner-backend-*.jar | head -1)
cp "$JAR" "$BUILD_DIR/planner-backend.jar"
rm -rf "$BUILD_DIR/frontend-dist"
cp -r "$ROOT_DIR/frontend/dist" "$BUILD_DIR/frontend-dist"

echo "==> Installing electron dependencies..."
cd "$SCRIPT_DIR"
npm install

echo "==> Building Windows installer..."
npm run dist-slim-win

echo ""
echo "Done! Executable is at: electron/dist/Planner *.exe"
