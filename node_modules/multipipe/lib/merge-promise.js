'use strict'

// Adapted from
// https://github.com/sindresorhus/execa/blob/120230cade59099214905ac2a9136e406c0b6f3a/lib/promise.js

const descriptors = ['then', 'catch', 'finally'].map(property => [
  property,
  Reflect.getOwnPropertyDescriptor(Promise.prototype, property)
])

module.exports = (stream, createPromise) => {
  for (const [property, descriptor] of descriptors) {
    const value = (...args) =>
      Reflect.apply(descriptor.value, createPromise(), args)
    Reflect.defineProperty(stream, property, { ...descriptor, value })
  }
  return stream
}
