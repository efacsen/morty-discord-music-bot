#!/bin/sh
set -e

INSTALL_DIR="/ytdlp"
BINARY="${INSTALL_DIR}/yt-dlp"
BASE_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download"

# Detect architecture
ARCH="$(uname -m)"
if [ "${ARCH}" = "aarch64" ]; then
  RELEASE_FILE="yt-dlp_linux_aarch64"
else
  RELEASE_FILE="yt-dlp"
fi

mkdir -p "${INSTALL_DIR}"

# Seed on first boot — skip download if binary already present
if [ ! -f "${BINARY}" ]; then
  echo "[updater] Seeding yt-dlp (${RELEASE_FILE}) to ${BINARY}..."
  wget -q -O "${BINARY}.new" "${BASE_URL}/${RELEASE_FILE}"
  chmod +x "${BINARY}.new"
  mv "${BINARY}.new" "${BINARY}"
  echo "[updater] Seed complete: $(${BINARY} --version)"
else
  echo "[updater] Binary already present at ${BINARY}, skipping initial seed."
fi

# Daily update loop
while true; do
  sleep 86400
  echo "[updater] Updating yt-dlp (${RELEASE_FILE})..."
  if wget -q -O "${BINARY}.new" "${BASE_URL}/${RELEASE_FILE}"; then
    chmod +x "${BINARY}.new"
    mv "${BINARY}.new" "${BINARY}"
    echo "[updater] Update complete: $(${BINARY} --version)"
  else
    echo "[updater] WARNING: Download failed, keeping existing binary."
    rm -f "${BINARY}.new"
  fi
done
