#!/usr/bin/env bash
# Downloads GPT-2 small (124M) from HuggingFace (no auth needed) into weights/.
set -euo pipefail
cd "$(dirname "$0")"

REPO="openai-community/gpt2"
BASE="https://huggingface.co/$REPO/resolve/main"
DEST="weights"
FILES=(model.safetensors config.json tokenizer.json)

mkdir -p "$DEST"
for f in "${FILES[@]}"; do
  if [ -f "$DEST/$f" ]; then
    echo "have $DEST/$f, skipping"
  else
    echo "downloading $f"
    curl -L --fail --progress-bar -o "$DEST/$f.tmp" "$BASE/$f"
    mv "$DEST/$f.tmp" "$DEST/$f"
  fi
done
