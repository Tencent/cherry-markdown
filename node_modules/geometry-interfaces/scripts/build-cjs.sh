./scripts/transpile.sh $1
babel esmodule --source-maps --out-dir . --plugins=transform-es2015-modules-commonjs,add-module-exports $1
