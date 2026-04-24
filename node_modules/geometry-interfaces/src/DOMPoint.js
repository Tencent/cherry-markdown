let privatesMap
const _ = o => {
    if (!privatesMap) {
        privatesMap = new WeakMap
        let privates = {}
        privatesMap.set(o, privates)
        return privates
    }
    else {
        let privates = privatesMap.get(o)

        if (privates === undefined) {
            privates = {}
            privatesMap.set(o, privates)
        }

        return privates
    }
}

export
class DOMPointReadOnly {
    constructor(x,y,z,w) {
        if (arguments.length === 1) {
            if (!isDOMPointInit(x))
                throw new TypeError('Expected an object with x, y, z, and w properties')

            _(this).x = x.x
            _(this).y = x.y
            _(this).z = x.z
            _(this).w = x.w
        }
        else if (arguments.length === 4)  {
            _(this).x = x || 0
            _(this).y = y || 0
            _(this).z = z || 0
            _(this).w = w || 0
        }
        else {
            throw new TypeError('Expected 1 or 4 arguments')
        }
    }

    get x() { return _(this).x }
    get y() { return _(this).y }
    get z() { return _(this).z }
    get w() { return _(this).w }

    matrixTransform(matrix) {
        let result = new this.constructor(this)
        // TODO
        //const x
        //const y
        //const z
        //const w

        return result
    }

    static fromPoint(other) {
        return new this(other)
    }
}

export
class DOMPoint extends DOMPointReadOnly {
    set x(value) { _(this).x = value }
    set y(value) { _(this).y = value }
    set z(value) { _(this).z = value }
    set w(value) { _(this).w = value }
}

export default DOMPoint

function isDOMPointInit(o) {
    if (typeof o != 'object') return false

    if (
        'x' in o &&
        'y' in o &&
        'z' in o &&
        'w' in o
    ) return true

    return false
}
