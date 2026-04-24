# we build everything to CommonJS format, since that is the format for
# publishing to NPM right now.
npm run build-cjs
# And we build the global version for those who want to use it.
npm run build-global
