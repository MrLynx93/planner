#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ELECTRON_DIR="$SCRIPT_DIR/electron"
JRE_DIR="$ELECTRON_DIR/jre"

# ── Download JREs (cached — only re-downloads if missing) ──────────────────
download_jre() {
  local arch=$1        # aarch64 | x64
  local dest_name=$2   # mac-arm64 | mac-x64
  local dest="$JRE_DIR/$dest_name"

  if [ -d "$dest" ]; then
    echo "    JRE $dest_name already cached, skipping download."
    return
  fi

  echo "    Downloading JRE for $dest_name..."
  local url="https://api.adoptium.net/v3/binary/latest/25/ga/mac/${arch}/jre/hotspot/normal/eclipse"
  local tmp="$JRE_DIR/jre-${dest_name}.tar.gz"

  mkdir -p "$JRE_DIR"
  curl -L -o "$tmp" "$url"

  echo "    Extracting..."
  local extract_dir="$JRE_DIR/extract-${dest_name}"
  mkdir -p "$extract_dir"
  tar -xzf "$tmp" -C "$extract_dir"
  mv "$extract_dir"/$(ls "$extract_dir" | head -1) "$dest"
  rm -rf "$extract_dir" "$tmp"
  echo "    JRE $dest_name ready."
}

echo "==> Ensuring JREs are present..."
download_jre aarch64 mac-arm64
download_jre x64     mac-x64

echo "==> Building frontend..."
cd "$SCRIPT_DIR/frontend"
npm install
npm run build

echo "==> Building backend JAR..."
cd "$SCRIPT_DIR/backend"
mvn package -DskipTests -q

echo "==> Copying resources to electron/..."
cd "$ELECTRON_DIR"
JAR=$(ls "$SCRIPT_DIR/backend/target"/planner-backend-*.jar | head -1)
cp "$JAR" planner-backend.jar
rm -rf frontend-dist
cp -r "$SCRIPT_DIR/frontend/dist" frontend-dist

echo "==> Installing electron dependencies..."
npm install

echo "==> Building macOS DMG..."
npm run dist

echo ""
echo "Done! DMG is at: electron/dist/Planner-*.dmg"
echo ""
echo "NOTE: On the client's Mac, after installing, run once to clear quarantine:"
echo "  sudo xattr -rd com.apple.quarantine /Applications/Planner.app"
