#!/bin/sh
# Nightly: dump the database as SQL text into the private repo Acs176/nibelung-backup (as spanish-buddy.sql, next to
# Nibelung's dump; same deploy key) and push it, if anything changed.
# Restore on a new VM: run deploy.sh, then
#   sudo systemctl stop spanish-buddy && git clone git@github.com:Acs176/nibelung-backup.git /tmp/b \
#   && rm -f /srv/spanish-buddy/data/spanish-buddy.db* && sqlite3 /srv/spanish-buddy/data/spanish-buddy.db < /tmp/b/spanish-buddy.sql \
#   && sudo systemctl start spanish-buddy
set -e
DB=/srv/spanish-buddy/data/spanish-buddy.db
REPO=/srv/spanish-buddy/backup-repo
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/nibelung_backup -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
[ -d $REPO/.git ] || git clone -q git@github.com:Acs176/nibelung-backup.git $REPO
cd $REPO
git pull -q --ff-only
sqlite3 $DB ".backup /tmp/spanish-buddy-backup.db"   # a consistent copy, even while the API is writing
sqlite3 /tmp/spanish-buddy-backup.db .dump > spanish-buddy.sql
rm /tmp/spanish-buddy-backup.db
git add spanish-buddy.sql
git diff --cached --quiet && { echo "backup: no changes"; exit 0; }
git -c user.name="Spanish Buddy server" -c user.email="spanish-buddy@localhost" commit -q -m "Spanish Buddy backup $(date -u +%F)"
git push -q
echo "backup: pushed"
