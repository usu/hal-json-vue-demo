import { fetch } from "./apiMock.js";
import Emittery from "emittery";

// cache for actual resource data (in raw format as provided by the fetcher). 1 entry per known uri (either requested uri or detected in response)
const resourceCache = new Map();

// cache for loading promises. 1 entry per requested uri
const promiseCache = new Map();

// event system used to signal changes in individual resources
export const emitter = new Emittery();

/**
 * public API
 */
export function getAsync(uri) {
  // Unwrap the data
  return fetchResourceAsync(uri);

  // Or: Use proxies for more magic:
  /*
  return fetchResourceAsync(uri).then(
    (resource) => new ResourceProxy(resource)
  );*/
}

export function getRelationAsync(uri, relation) {
  // Unwrap the data
  return fetchRelationAsync(uri, relation);

  // Returning resource does the job at the moment. Use proxies for more magic:
  /*
  return fetchRelationAsync(uri, relation).then(
    (resource) => new ResourceProxy(resource)
  );*/
}

/**
 * internal functions
 */

export function fetchResourceAsync(uri) {
  // avoid loading the same resource twice
  if (promiseCache.has(uri)) {
    return promiseCache.get(uri);
  }

  let promise;
  if (resourceCache.has(uri)) {
    promise = Promise.resolve(resourceCache.get(uri));
  } else {
    promise = fetchFromNetwork(uri);
  }

  promiseCache.set(uri, promise); // --> at the moment, promises are never removed from promiseCache. No harm at the moment but might be relevant later
  return promise;
}

export async function fetchRelationAsync(uri, relation) {
  const resource = await fetchResourceAsync(uri);

  const link = resource?.data?._links[relation];

  // not a collection --> fetch resource
  if (!Array.isArray(link)) {
    return fetchResourceAsync(resource?.data?._links[relation]);
  }

  // collection --> make sure all items of the Array are loaded
  let itemPromises = [];
  link.forEach((item) => itemPromises.push(fetchResourceAsync(item)));
  return (await Promise.allSettled(itemPromises)).map((result) => result.value);
}

// resource is not in the cache --> really fetch from network and process all resources in the response
async function fetchFromNetwork(uri) {
  const apiResponse = await fetch(uri);

  // populate resourceCache with all resources contained in api response
  for (const [key, value] of Object.entries(apiResponse)) {
    let resource = resourceCache.get(key);
    if (!resource) {
      resourceCache.set(key, (resource = {}));
    }

    resource.data = value; // careful to not override complete cache item to not destroy linking from any other objects

    emitter.emit("resourceUpdated", key); // signal update of resource
  }

  return resourceCache.get(uri);
}

/**
 * Support / debug API
 */
export function clearCache() {
  promiseCache.clear();
  resourceCache.clear();
}

export function debugAsync() {
  console.log("promiseCache");
  console.log(...promiseCache);

  console.log("resourceCache");
  console.log(...resourceCache);
}

/*
class ResourceProxy {
  constructor(originalObject) {
    const handler = {
      get: function (target, prop) {
        if (prop === Symbol.toPrimitive) {
          return () => "";
        }

        if (
          [
            "then",
            "toJSON",
            Symbol.toStringTag,
            "state",
            "getters",
            "$options",
            "_isVue",
            "__file",
            "render",
            "constructor",
          ].includes(prop)
        ) {
          return undefined;
        }

        // proxy to properties that actually exist on original object
        if (Reflect.has(target, prop)) {
          return Reflect.get(target, prop);
        }

        // Normal property access: return a function that yields another LoadingStoreValue and renders as empty string
        return () => getRelationAsync(target?._links?.self, prop);
      },
      ownKeys(target) {
        return Reflect.ownKeys(target);
      },
    };
    return new Proxy(originalObject, handler);
  }
} */
