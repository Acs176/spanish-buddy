#!/bin/sh
# Put the Spanish Buddy API on the Oracle VM, next to Nibelung. Safe to run again: it only replaces files and restarts.
#   sh server/deploy.sh          (from the spanish-buddy folder)
# The app itself stays on GitHub Pages (a push to main deploys it).
# First run creates /etc/spanish-buddy.env (root, 600) with two random codes: SB_TOKEN for Angela's app, SB_ADMIN_TOKEN
# for Adrián (the app's Adrián-Modus and the Mac's send.py). Read them with
#   ssh -i ~/.ssh/id_oracle ubuntu@51.170.52.105 sudo cat /etc/spanish-buddy.env
# Notifications need the VAPID private key there too, copied from the Mac's Keychain without showing it:
#   security find-generic-password -s spanish-buddy-vapid -w | ssh -i ~/.ssh/id_oracle ubuntu@51.170.52.105 'k=$(cat); sudo sed -i "/^VAPID_PRIVATE=/d" /etc/spanish-buddy.env; echo "VAPID_PRIVATE=$k" | sudo tee -a /etc/spanish-buddy.env >/dev/null; sudo systemctl restart spanish-buddy'
# A new VM: restore the database from the backup, see server/deploy/backup.sh.
set -e
HOST=ubuntu@51.170.52.105
SSH="ssh -i $HOME/.ssh/id_oracle"
NODE=v22.22.0
cd "$(dirname "$0")/.."
$SSH $HOST 'sudo mkdir -p /srv/spanish-buddy/data /etc/caddy/sites && sudo chown -R ubuntu:ubuntu /srv/spanish-buddy
  [ -f /etc/spanish-buddy.env ] || { printf "SB_TOKEN=%s\nSB_ADMIN_TOKEN=%s\n" "$(openssl rand -hex 12)" "$(openssl rand -hex 16)" | sudo tee /etc/spanish-buddy.env >/dev/null; sudo chmod 600 /etc/spanish-buddy.env; }'
rsync -az -e "$SSH" server/server.py server/deploy/backup.sh package.json package-lock.json $HOST:/srv/spanish-buddy/
rsync -az -e "$SSH" server/deploy/ $HOST:/tmp/spanish-buddy-deploy/
# Node (for web-push, the notifications): the official build, checked against nodejs.org's checksums
$SSH $HOST "command -v node >/dev/null && node -v | grep -q '^v22' || { cd /tmp && f=node-$NODE-linux-arm64.tar.xz \
  && curl -fsSLO https://nodejs.org/dist/$NODE/\$f && curl -fsSL https://nodejs.org/dist/$NODE/SHASUMS256.txt | grep \" \$f\$\" | sha256sum -c - \
  && sudo tar -xJf \$f -C /usr/local --strip-components=1 --exclude CHANGELOG.md --exclude LICENSE --exclude README.md && rm \$f; }"
$SSH $HOST 'cd /srv/spanish-buddy && npm ci --omit=dev --no-audit --no-fund --loglevel=error'
$SSH $HOST 'cd /tmp/spanish-buddy-deploy \
  && sudo cp spanish-buddy.service spanish-buddy-tick.service spanish-buddy-tick.timer spanish-buddy-backup.service spanish-buddy-backup.timer /etc/systemd/system/ \
  && sudo cp spanish-buddy.caddy /etc/caddy/sites/ \
  && { grep -q "^import /etc/caddy/sites/" /etc/caddy/Caddyfile || echo "import /etc/caddy/sites/*.caddy" | sudo tee -a /etc/caddy/Caddyfile >/dev/null; } \
  && caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1 | tail -1 \
  && sudo systemctl daemon-reload \
  && sudo systemctl enable --now spanish-buddy.service spanish-buddy-tick.timer spanish-buddy-backup.timer \
  && sudo systemctl restart spanish-buddy.service && sudo systemctl reload caddy \
  && sleep 1 && systemctl is-active spanish-buddy.service nibelung.service'
