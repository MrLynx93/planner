#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Building backend..."
cd "$SCRIPT_DIR/backend"
mvn package -DskipTests -q

echo "Copying JAR..."
cp target/planner-backend-*.jar "$SCRIPT_DIR/electron/planner-backend.jar"

echo "Starting Electron (empty database)..."
cd "$SCRIPT_DIR/electron"
CLEAN=true npm start
