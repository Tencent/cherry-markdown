#!/usr/bin/env bash
# Default to running checks unless every changed path is known to be unrelated.
set -uo pipefail
changed=$(mktemp)
old_header=$(mktemp)
new_header=$(mktemp)
trap 'rm -f "$changed" "$old_header" "$new_header"' EXIT
merge_base=$(git merge-base "$1" "$2") || {
  echo 'Unable to find merge base; running Milkdown checks.' >&2
  echo 'required=true'
  exit 0
}
if ! git diff --no-renames --name-only -z "$1...$2" -- > "$changed"; then
  echo 'Unable to determine changed files; running Milkdown checks.' >&2
  echo 'required=true'
  exit 0
fi
if [ ! -s "$changed" ]; then
  echo 'No changed files found; running Milkdown checks.' >&2
  echo 'required=true'
  exit 0
fi
while IFS= read -r -d '' path; do
  case "$path" in
    .changeset/*.md)
      # A prose-only edit does not change the planned release. New, deleted,
      # malformed, or front-matter changes remain relevant.
      if ! git show "$merge_base:$path" | awk 'NR == 1 && $0 != "---" { exit 1 } { print } NR > 1 && $0 == "---" { found = 1; exit } END { if (!found) exit 1 }' > "$old_header" ||
         ! git show "$2:$path" | awk 'NR == 1 && $0 != "---" { exit 1 } { print } NR > 1 && $0 == "---" { found = 1; exit } END { if (!found) exit 1 }' > "$new_header" ||
         ! cmp -s "$old_header" "$new_header"; then
        echo "Milkdown checks required for changeset: $path" >&2
        echo 'required=true'
        exit 0
      fi ;;
    README.md|README.CN.md|CONTRIBUTING.md|CONTRIBUTING.CN.md|SECURITY.md|CODE_OF_CONDUCT.md|LICENSE|docs/*|packages/client/*|packages/miniProgram/*|packages/vscodePlugin/*) ;;
    *) echo "Milkdown checks required for: $path" >&2; echo 'required=true'; exit 0 ;;
  esac
done < "$changed"
echo 'No Milkdown-related changes detected.' >&2
echo 'required=false'
