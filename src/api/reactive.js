import { fetchResourceAsync, fetchRelationAsync, emitter } from "./async.js";

import { triggerRef, shallowRef } from "vue";

// cache for reactive object. 1 entry per requested path (=uri or =uri + relation path)
// Hence, 1 resource can have multiple entries if requested via different paths
// Equivalent to a LoadingResource/LoadingProxy
const reactiveCache = new Map();

// maps URIs to dependent reactive objects
const dependencyMap = new Map();

// register listener for resource updates
emitter.on("resourceUpdated", triggerReactive);

/**
 * External API
 */

export function getReactive(uri) {
  const reactiveObject = getReactiveFromCache(uri);
  fetchResourceAndUpdateReactive(uri, reactiveObject);
  return reactiveObject;
}

export function getRelationReactive(uri, relation) {
  // at the moment, only 1 nesting level is supported, however the concept could be easily extended
  // e.g. "/subchild#parent#parent" and "/child#parent" and "/parent" could be 3 different reactive objects all pointing to the same resource
  const reactiveObject = getReactiveFromCache(`${uri}#${relation}`);
  fetchRelationAndUpdateReactive(uri, relation, reactiveObject);
  return reactiveObject;
}

/**
 * Internal API
 */
async function fetchResourceAndUpdateReactive(uri, reactiveObject) {
  const resource = await fetchResourceAsync(uri);
  addDependency(uri, reactiveObject);

  // replacing the complete value of a shallowRef is reactive
  // however: if any data within resource changes, the reactivity system wouldn't know (manual trigger of reactivity needed)
  reactiveObject.value = resource;
}

async function fetchRelationAndUpdateReactive(uri, relation, reactiveObject) {
  const resource = await fetchRelationAsync(uri, relation);
  addDependency(resource.data._links.self, reactiveObject); // only here we know which resource was returned

  // replacing the complete value of a shallowRef is reactive
  // however: if any data within resource changes, the reactivity system wouldn't know (manual trigger of reactivity needed)
  reactiveObject.value = resource;
}

function getReactiveFromCache(cacheKey) {
  if (reactiveCache.has(cacheKey)) {
    return reactiveCache.get(cacheKey);
  }

  // if no cache hit --> initialize empty shallow reactive object
  const reactiveObject = shallowRef({});
  reactiveCache.set(cacheKey, reactiveObject);
  return reactiveObject;
}

// if data at resource uri has changed --> trigger reactivity for all reactive object that point to this resource
function triggerReactive(uri) {
  if (dependencyMap.has(uri)) {
    dependencyMap.get(uri).forEach((reactiveObject) => {
      triggerRef(reactiveObject);
    });
  }
}

function addDependency(uri, reactiveObject) {
  let dependentObjects = dependencyMap.get(uri);
  if (!dependentObjects) {
    dependencyMap.set(uri, (dependentObjects = []));
  }

  dependentObjects.push(reactiveObject);
}

/**
 * Support / debug API
 */
export function debugReactive() {
  console.log("reactiveCache");
  console.log(...reactiveCache);

  console.log("dependencyMap");
  console.log(...dependencyMap);
}
