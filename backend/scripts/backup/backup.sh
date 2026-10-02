#!/usr/bin/env bash
# Take a compressed, restorable backup of the ElderCare database.
#
# Usage:
#   DATABASE_URL=postgres://user:pass@host:5432/eldercare  ./scripts/backup/backup.sh [output-dir]
#
# Writes <output-dir>/eldercare-<UTC timestamp>.dump (pg_dump custom format: compressed,
# supports parallel restore, and can restore a single table without touching the rest).
# Exits non-zero on any failure so it is safe to wire into cron/systemd (see backup.timer below).
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL, e.g. postgres://eldercare:pass@localhost:5432/eldercare}"
OUT_DIR="${1:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/eldercare-$STAMP.dump"

mkdir -p "$OUT_DIR"
echo "[backup] dumping to $FILE"
pg_dump --format=custom --compress=9 --no-owner --no-privileges --file="$FILE" "$DATABASE_URL"

# A backup you haven't verified isn't a backup — list the archive's table of contents as a smoke test.
pg_restore --list "$FILE" > /dev/null
echo "[backup] OK: $(du -h "$FILE" | cut -f1) — $(pg_restore --list "$FILE" | grep -c '^[0-9]') objects"

# Keep the last 14 daily backups in this directory; older ones are removed.
# (This is local retention only — copy backups to off-host storage, e.g. S3, for real durability.)
find "$OUT_DIR" -maxdepth 1 -name 'eldercare-*.dump' -mtime +14 -print -delete
