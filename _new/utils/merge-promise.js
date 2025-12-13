const nativePromisePrototype = (async () => {})().constructor.prototype;
const descriptors = ['then', 'catch', 'finally'].map((property) => [
  property,
  Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property),
]);

/**
 * Mix promise methods into an arbitrary object.
 *
 * @param {object} thing - Target object to decorate.
 * @param {Promise|Function} promise - Promise or factory returning one.
 * @returns {object} The decorated object.
 */
export default function mergePromise(thing, promise) {
  for (const [property, descriptor] of descriptors) {
    const value =
      typeof promise === 'function' ? (...args) => Reflect.apply(descriptor.value, promise(), args) : descriptor.value.bind(promise);
    Reflect.defineProperty(thing, property, { ...descriptor, value });
  }

  return thing;
}
