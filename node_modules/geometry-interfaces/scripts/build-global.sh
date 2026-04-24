# Here we use webpack to build a UMD (Universal Module Definition) module that
# will put the exports of your package entrypoint onto the the global scope
# (`window` in a browser, for example)

# Choose the name of the global symbol your project will define (for example,
# the variable name that will be assigned onto `window` when this runs in a
# browser).
package_name='GeometryInterfaces'

webpack \
    --display-optimization-bailout \
    --progress \
    --colors \
    --output-library-target umd \
    src/index.js \
    global.js \
    --output-library $package_name $1
