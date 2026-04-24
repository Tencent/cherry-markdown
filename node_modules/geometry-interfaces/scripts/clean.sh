# Save needed .js files, .js.map files, and directories before cleaning. Feel
# free to add to the list. This section is all you need to modify.
echo saving important files.
mkdir save
mv \
    .git \
    node_modules \
    src \
    scripts \
    webpack.config.js \
    global.js \
save/

# done modifying (unless you know what you're doing) -----------------------------

# remove built files and folders (except for the save/ folder).
echo removing build files.
rm -rf ./*.js ./*.js.map `find . -maxdepth 1 -type d | cut -d/ -f2 | grep -v '^save$' | grep -v '^.$'`

echo moving saved files back.

for x in save/* save/.[!.]* save/..?*; do
  if [ -e "$x" ]; then mv -- "$x" ./; fi
done
rmdir save/

echo done moving saved files back.

