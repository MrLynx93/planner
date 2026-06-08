#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
BUILD_DIR="$SCRIPT_DIR/build"
JRE_DIR="$BUILD_DIR/jre"

# ── Build slim JREs via jlink (cached — only rebuilds if missing) ──────────
create_slim_jre() {
  local arch=$1        # aarch64 | x64
  local dest_name=$2   # mac-arm64-slim | mac-x64-slim
  local dest="$JRE_DIR/$dest_name"

  if [ -d "$dest" ]; then
    echo "    Slim JRE $dest_name already cached, skipping."
    return
  fi

  echo "    Downloading JDK for jlink ($dest_name)..."
  local url="https://api.adoptium.net/v3/binary/latest/25/ga/mac/${arch}/jdk/hotspot/normal/eclipse"
  local tmp="$JRE_DIR/jdk-${arch}.tar.gz"
  local extract_dir="$JRE_DIR/jdk-${arch}-extract"

  mkdir -p "$JRE_DIR"
  curl -L -o "$tmp" "$url"
  mkdir -p "$extract_dir"
  tar -xzf "$tmp" -C "$extract_dir"

  # macOS JDK layout: <name>.jdk/Contents/Home
  local jdk_home="$extract_dir/$(ls "$extract_dir" | head -1)/Contents/Home"

  echo "    Running jlink..."
  "$jdk_home/bin/jlink" \
    --module-path "$jdk_home/jmods" \
    --add-modules java.base,java.desktop,java.instrument,java.logging,java.management,java.naming,java.rmi,java.security.jgss,java.sql,java.xml,jdk.crypto.cryptoki,jdk.crypto.ec,jdk.management,jdk.naming.dns,jdk.unsupported,jdk.xml.dom \
    --strip-debug \
    --no-header-files \
    --no-man-pages \
    --compress=2 \
    --output "$dest"

  rm -rf "$extract_dir" "$tmp"
  echo "    Slim JRE $dest_name ready."
}

detach_planner_volumes() {
  hdiutil info 2>/dev/null | grep -oE '/Volumes/Planner[^ ]*' | while read -r vol; do
    echo "    Detaching leftover volume: $vol"
    hdiutil detach "$vol" -force 2>/dev/null || true
  done
}

echo "==> Ensuring slim JREs are present..."
create_slim_jre x64 mac-x64-slim

echo "==> Cleaning dist directory..."
rm -rf "$SCRIPT_DIR/dist"

echo "==> Building frontend..."
cd "$ROOT_DIR/frontend"
npm install
npm run build

echo "==> Building backend JAR..."
cd "$ROOT_DIR/backend"
mvn package -DskipTests -q

echo "==> Copying resources to build/..."
mkdir -p "$BUILD_DIR"
JAR=$(ls "$ROOT_DIR/backend/target"/planner-backend-*.jar | head -1)
cp "$JAR" "$BUILD_DIR/planner-backend.jar"
rm -rf "$BUILD_DIR/frontend-dist"
cp -r "$ROOT_DIR/frontend/dist" "$BUILD_DIR/frontend-dist"

echo "==> Installing electron dependencies..."
cd "$SCRIPT_DIR"
npm install

echo "==> Building macOS DMGs (slim JRE)..."
detach_planner_volumes
npm run dist-slim

echo ""
echo "Done! DMGs are at: electron/dist/Planner-*.dmg"
echo ""
echo "NOTE: On the client's Mac, after installing, run once to clear quarantine:"
echo "  sudo xattr -rd com.apple.quarantine /Applications/Planner.app"
