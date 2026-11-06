#!/usr/bin/env bash
set -eu
script=$(cd "$(dirname "$0")" && pwd)/milkdown-changes.sh
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
cd "$fixture"
git init -q
git config user.email test@example.invalid
git config user.name test
mkdir -p packages/client packages/milkdown packages/cherry-markdown/src .changeset
printf '%s\n' '---' '"@cherry-markdown/milkdown": patch' '---' '' 'old description' > .changeset/example.md
echo before > README.md
echo before > packages/client/file.js
echo before > packages/milkdown/file.js
echo before > packages/cherry-markdown/src/file.js
git add .
git commit -qm base
base=$(git rev-parse HEAD)
check() {
  expected=$1
  actual=$(bash "$script" "$base" HEAD)
  if [ "$actual" != "required=$expected" ]; then
    echo "Expected $expected, got $actual" >&2
    exit 1
  fi
}
reset_fixture() { git reset -q --hard "$base"; git clean -qfd; }
commit_change() { git add -A; git commit -qm change; }
echo doc >> README.md; commit_change; check false
reset_fixture
echo client >> packages/client/file.js; commit_change; check false
reset_fixture
echo prose >> .changeset/example.md; commit_change; check false
reset_fixture
printf '%s\n' '---' '"@cherry-markdown/milkdown": minor' '---' 'description' > .changeset/example.md; commit_change; check true
reset_fixture
echo new > .changeset/new.md; commit_change; check true
reset_fixture
git rm -q .changeset/example.md; commit_change; check true
reset_fixture
echo change >> packages/milkdown/file.js; commit_change; check true
reset_fixture
echo change >> packages/cherry-markdown/src/file.js; commit_change; check true
reset_fixture
echo change > yarn.lock; commit_change; check true
reset_fixture
git mv packages/milkdown/file.js packages/client/moved.js; commit_change; check true
reset_fixture
check true
actual=$(bash "$script" invalid-ref HEAD 2>/dev/null)
test "$actual" = required=true
echo 'Milkdown change detection scenarios passed.'
