#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_NAME="EaseExpoTVTest"
EXPO_SDK_VERSION="55"

export EXPO_NO_TELEMETRY=1
export CI=1
export LANG=${LANG:-en_US.UTF-8}
export LC_ALL=${LC_ALL:-en_US.UTF-8}

cd "$REPO_ROOT"

echo "Packing local react-native-ease package"
PACK_OUTPUT="$(npm pack)"
TARBALL_FILENAME="$(echo "$PACK_OUTPUT" | tail -n 1 | tr -d '\r\n')"
TARBALL_PATH="$REPO_ROOT/$TARBALL_FILENAME"

TMP_DIR="$(mktemp -d)"
PROJECT_DIR="$TMP_DIR/$PROJECT_NAME"

cleanup() {
  rm -f "$TARBALL_PATH"
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Creating Expo project ($PROJECT_NAME) targeting SDK $EXPO_SDK_VERSION"
cd "$TMP_DIR"
npx create-expo-app@latest "$PROJECT_NAME" --template "default@$EXPO_SDK_VERSION" --yes

cd "$PROJECT_DIR"

echo "Installing TV dependencies"
npx expo install react-native@npm:react-native-tvos@0.83.4-1 expo-dev-client @react-native-tvos/config-tv -- --dev

echo "Installing local tarball"
npm install "$TARBALL_PATH"

APP_JSON_PATH="$PROJECT_DIR/app.json"
APP_JSON_PATH="$APP_JSON_PATH" node <<'NODE'
const fs = require('fs');
const path = process.env.APP_JSON_PATH;
const json = JSON.parse(fs.readFileSync(path, 'utf8'));
json.expo = json.expo || {};
json.expo.plugins = json.expo.plugins || [];
if (!json.expo.plugins.includes('@react-native-tvos/config-tv')) {
  json.expo.plugins.push('@react-native-tvos/config-tv');
}
json.expo.install = json.expo.install || {};
const exclude = new Set(json.expo.install.exclude || []);
exclude.add('react-native');
json.expo.install.exclude = Array.from(exclude);
fs.writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
NODE

echo "Running Expo TV prebuild"
EXPO_TV=1 npx expo prebuild --clean --platform ios

cd ios

echo "Building tvOS app"
xcodebuild \
  -workspace "$PROJECT_NAME.xcworkspace" \
  -configuration Debug \
  -scheme "$PROJECT_NAME" \
  -sdk appletvsimulator \
  -destination 'generic/platform=tvOS Simulator' \
  -derivedDataPath "$TMP_DIR/DerivedData" \
  build

echo "tvOS Expo integration build completed successfully."
