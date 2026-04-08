#!/bin/bash
# 新しいスケッチを作成する
# Usage: ./scripts/new-sketch.sh [YYYY-MM-DD]
# 日付を省略すると今日の日付で作成

DATE=${1:-$(date +%Y-%m-%d)}
SKETCHES_DIR="$(dirname "$0")/../public/sketches"
TEMPLATE_DIR="$SKETCHES_DIR/_template"
TARGET_DIR="$SKETCHES_DIR/$DATE"

if [ -d "$TARGET_DIR" ]; then
  echo "Already exists: $TARGET_DIR"
  exit 1
fi

cp -r "$TEMPLATE_DIR" "$TARGET_DIR"
sed -i '' "s/YYYY-MM-DD/$DATE/g" "$TARGET_DIR/meta.json"

echo "Created: $TARGET_DIR"
echo "  diary.md    - 日記を書く"
echo "  meta.json   - メタデータ"
echo "  index.html  - スケッチ（自由に書き換え）"
