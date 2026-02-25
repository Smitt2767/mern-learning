#!/bin/sh
# Copies packages/env/.env to all backend services.
# Usage: pnpm env:copy

SOURCE="packages/env/.env"

if [ ! -f "$SOURCE" ]; then
  echo "Error: $SOURCE not found."
  echo "Copy packages/env/.env.example to packages/env/.env and fill in your values first."
  exit 1
fi

for target in auth-server admin-server mail-server sync-server main-server packages/database; do
  cp "$SOURCE" "$target/.env"
  echo "Copied -> $target/.env"
done

echo "\nDone."
