#!/bin/sh
set -eu
mkdir -p /data/backups
chown node:node /data /data/backups
chmod 700 /data /data/backups
exec su-exec node node server.mjs
