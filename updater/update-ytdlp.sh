#!/bin/sh
set -e

INSTALL_DIR="/ytdlp"
BINARY="${INSTALL_DIR}/yt-dlp"
BASE_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download"
RELEASE_FILE="yt-dlp"

mkdir -p "${INSTALL_DIR}"

download_binary() {
  echo "[updater] Downloading ${RELEASE_FILE} to ${BINARY}..."
  wget -q -O "${BINARY}.new" "${BASE_URL}/${RELEASE_FILE}"
  chmod +x "${BINARY}.new"

  if ! "${BINARY}.new" --version >/dev/null 2>&1; then
    echo "[updater] ERROR: downloaded yt-dlp binary failed executable check."
    rm -f "${BINARY}.new"
    return 1
  fi

  mv "${BINARY}.new" "${BINARY}"
  return 0
}

binary_is_usable() {
  [ -f "${BINARY}" ] && "${BINARY}" --version >/dev/null 2>&1
}

# Seed on first boot — refresh immediately if the existing file is missing or broken
if ! binary_is_usable; then
  echo "[updater] Seeding yt-dlp (${RELEASE_FILE}) to ${BINARY}..."
  download_binary
  echo "[updater] Seed complete: $("${BINARY}" --version)"
else
  echo "[updater] Binary already present and healthy at ${BINARY}: $("${BINARY}" --version)"
fi

# Daily update loop
while true; do
  sleep 86400
  echo "[updater] Updating yt-dlp (${RELEASE_FILE})..."
  if download_binary; then
    echo "[updater] Update complete: $("${BINARY}" --version)"
  else
    echo "[updater] WARNING: Download failed, keeping existing binary."
  fi
done
