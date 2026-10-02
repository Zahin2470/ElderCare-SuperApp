#!/usr/bin/env bash
# Restore an ElderCare backup into a database. Designed to be safe by default:
# refuses to run without --yes, and refuses to restore into a database whose name
# doesn't contain "restore" or "test" unless --force is also given (guards against
# accidentally overwriting the live database while testing a restore).
#
# Usage:
#   DATABASE_URL=postgres://user:pass@host:5432/eldercare_restore_test \
#     ./scripts/backup/restore.sh backups/eldercare-20260101T000000Z.dump --yes
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL — the TARGET database to restore into}"
FILE="${1:?Usage: restore.sh <dump-file> [--yes] [--force]}"
YES=false; FORCE=false
for a in "${@:2}"; do [[ "$a" == "--yes" ]] && YES=true; [[ "$a" == "--force" ]] && FORCE=true; done

DB_NAME="$(node -e "console.log(new URL(process.env.DATABASE_URL).pathname.replace('/',''))")"
if [[ "$FORCE" != true ]] && [[ ! "$DB_NAME" =~ (restore|test) ]]; then
  echo "[restore] Refusing: target database '$DB_NAME' doesn't look like a restore/test database." >&2
  echo "[restore] Pass --force if you really mean to restore into it (e.g. real disaster recovery)." >&2
  exit 1
fi
if [[ "$YES" != true ]]; then
  echo "[restore] This REPLACES all data in '$DB_NAME'. Re-run with --yes to proceed." >&2
  exit 1
fi

echo "[restore] restoring $FILE into $DB_NAME"
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$DATABASE_URL" "$FILE"
echo "[restore] OK"
