import { fetch } from "./apiMock.js";

const promiseCache = new Map();
const resourceCache = new Map();

/**
 * public API
 */
export function getAsync(uri) {
  return fetchResourceAsync(uri);

  // Returning resource does the job at the moment. Use proxies for more magic:
  /*
  return fetchResourceAsync(uri).then(
    (resource) => new ResourceProxy(resource)
  );*/
}

export function getRelationAsync(uri, relation) {
  return fetchRelationAsync(uri, relation);

  // Returning resource does the job at the moment. Use proxies for more magic:
  /*
  return fetchRelationAsync(uri, relation).then(
    (resource) => new ResourceProxy(resource)
  );*/
}

export function clearCache() {
  promiseCache.clear();
  resourceCache.clear();
}

/**
 * internal functions
 */

function fetchResourceAsync(uri) {
  if (promiseCache.has(uri)) {
    return promiseCache.get(uri);
  }

  let promise;
  if (resourceCache.has(uri)) {
    promise = Promise.resolve(resourceCache.get(uri));
  } else {
    promise = fetchFromNetwork(uri);
  }

  promiseCache.set(uri, promise);
  return promise;
}

async function fetchRelationAsync(uri, relation) {
  const resource = await fetchResourceAsync(uri);

  const link = resource?._links[relation];

  if (!Array.isArray(link)) {
    return fetchResourceAsync(resource?._links[relation]);
  }

  // collection --> make sure all items are loaded
  let itemPromises = [];
  link.forEach((item) => itemPromises.push(fetchResourceAsync(item)));
  return (await Promise.allSettled(itemPromises)).map((result) => result.value);
}

async function fetchFromNetwork(uri) {
  const apiResponse = await fetch(uri);

  // populate resourceCache with all resources contained in api response
  for (const [key, value] of Object.entries(apiResponse)) {
    resourceCache.set(key, value);
  }

  return resourceCache.get(uri);
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