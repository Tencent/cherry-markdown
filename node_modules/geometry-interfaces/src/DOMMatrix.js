import DOMMatrixReadOnly, {initDOMMatrixReadOnly} from './DOMMatrixReadOnly'
import {
    multiplyAndApply,
    rotateAxisAngleArray,
} from './utilities'

initDOMMatrixReadOnly()

export default
class DOMMatrix extends DOMMatrixReadOnly {
    constructor(arg) {
        const numArgs = arguments.length
        if (numArgs === 0) {
            super([1, 0, 0, 1, 0, 0])
        }
        else if (numArgs === 1) {
            if (typeof arg == 'string') {
                throw new Error('CSS transformList arg not yet implemented.')
                // TODO validate that syntax of transformList matches transform-list (http://www.w3.org/TR/css-transforms-1/#typedef-transform-list).
            }
            else if (arg instanceof DOMMatrix) {
                super(arg._matrix)
            }
            else if (arg instanceof Float32Array || arg instanceof Float64Array || arg instanceof Array) {
                super(arg)
            }
        }
        else {
            throw new Error('Wrong number of arguments to DOMMatrix constructor.')
        }
    }

    // Mutable transform methods
    multiplySelf (other) {
        if (!(other instanceof DOMMatrix))
            throw new Error('The argument to multiplySelf must be an instance of DOMMatrix')

        // TODO: avoid creating a new array, just apply values directly.
        multiplyAndApply(this, other, this)

        if (!other.is2D) this._is2D = false

        return this
    }

    preMultiplySelf (other) {
        if (!(other instanceof DOMMatrix))
            throw new Error('The argument to multiplySelf must be an instance of DOMMatrix')

        // TODO: avoid creating a new array, just apply values directly.
        multiplyAndApply(other, this, this)

        if (!other.is2D) this._is2D = false

        return this
    }

    translateSelf (tx, ty, tz = 0) {
        // TODO: check args are numbers

        if (arguments.length === 1)
            throw new Error('The first two arguments (X and Y translation values) are required (the third, Z translation, is optional).')

        // http://www.w3.org/TR/2012/WD-css3-transforms-20120911/#Translate3dDefined
        const translationMatrix = new DOMMatrix([
            // column-major:
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx,ty,tz,1,
        ])

        this.multiplySelf(translationMatrix)

        if (tz != 0) {
            this._is2D = false
        }

        return this
    }

    scaleSelf (scale, originX = 0, originY = 0) {
        this.translateSelf(originX, originY)

        this.multiplySelf(new DOMMatrix([
            // 2D:
            /*a*/scale, /*b*/0,
            /*c*/0,     /*d*/scale,
            /*e*/0,     /*f*/0,
        ]))

        this.translateSelf(-originX, -originY)
        return this
    }

    scale3dSelf (scale, originX = 0, originY = 0, originZ = 0) {
        this.translateSelf(originX, originY, originZ)

        this.multiplySelf(new DOMMatrix([
            // 3D
            scale, 0,     0,     0,
            0,     scale, 0,     0,
            0,     0,     scale, 0,
            0,     0,     0,     1,
        ]))

        this.translateSelf(-originX, -originY, -originZ)
        return this
    }

    scaleNonUniformSelf (scaleX, scaleY = 1, scaleZ = 1, originX = 0, originY = 0, originZ = 0) {
        this.translateSelf(originX, originY, originZ)

        this.multiplySelf(new DOMMatrix([
            // 3D
            scaleX, 0,      0,      0,
            0,      scaleY, 0,      0,
            0,      0,      scaleZ, 0,
            0,      0,      0,      1,
        ]))

        this.translateSelf(-originX, -originY, -originZ)

        if (scaleZ !== 1 || originZ !== 0) this._is2D = false

        return this
    }

    rotateSelf (angle, originX = 0, originY = 0) {
        this.translateSelf(originX, originY)

        // axis of rotation
        const [x,y,z] = [0,0,1] // We're rotating around the Z axis.

        this.rotateAxisAngleSelf(x, y, z, angle)

        this.translateSelf(-originX, -originY)
        return this
    }

    // TODO
    rotateFromVectorSelf (x, y) {
        throw new Error('rotateFromVectorSelf is not implemented yet.')
    }

    rotateAxisAngleSelf (x, y, z, angle) {
        const rotationMatrix = new DOMMatrix(rotateAxisAngleArray(x,y,z,angle))
        this.multiplySelf(rotationMatrix)
        return this
    }

    skewXSelf (sx) {
        throw new Error('skewXSelf is not implemented yet.')
    }

    skewYSelf (sy) {
        throw new Error('skewYSelf is not implemented yet.')
    }

    invertSelf () {
        throw new Error('invertSelf is not implemented yet.')
    }

    setMatrixValue(/*DOMString*/ transformList) {
        throw new Error('setMatrixValue is not implemented yet.')
    }

    get a() { return this.m11 }
    get b() { return this.m12 }
    get c() { return this.m21 }
    get d() { return this.m22 }
    get e() { return this.m41 }
    get f() { return this.m42 }

    get m11() { return this._matrix[0]  }
    get m12() { return this._matrix[4]  }
    get m13() { return this._matrix[8]  }
    get m14() { return this._matrix[12] }

    get m21() { return this._matrix[1]  }
    get m22() { return this._matrix[5]  }
    get m23() { return this._matrix[9]  }
    get m24() { return this._matrix[13] }

    get m31() { return this._matrix[2]  }
    get m32() { return this._matrix[6]  }
    get m33() { return this._matrix[10] }
    get m34() { return this._matrix[14] }

    get m41() { return this._matrix[3]  }
    get m42() { return this._matrix[7]  }
    get m43() { return this._matrix[11] }
    get m44() { return this._matrix[15] }

    set a(value) { this.m11 = value }
    set b(value) { this.m12 = value }
    set c(value) { this.m21 = value }
    set d(value) { this.m22 = value }
    set e(value) { this.m41 = value }
    set f(value) { this.m42 = value }

    set m11(value) { this._matrix[0]  = value }
    set m12(value) { this._matrix[4]  = value }
    set m13(value) { this._matrix[8]  = value }
    set m14(value) { this._matrix[12] = value }

    set m21(value) { this._matrix[1]  = value }
    set m22(value) { this._matrix[5]  = value }
    set m23(value) { this._matrix[9]  = value }
    set m24(value) { this._matrix[13] = value }

    set m31(value) { this._matrix[2]  = value }
    set m32(value) { this._matrix[6]  = value }
    set m33(value) { this._matrix[10] = value }
    set m34(value) { this._matrix[14] = value }

    set m41(value) { this._matrix[3]  = value }
    set m42(value) { this._matrix[7]  = value }
    set m43(value) { this._matrix[11] = value }
    set m44(value) { this._matrix[15] = value }
}
