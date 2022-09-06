import { getAsync, getRelationAsync, emitter } from "./async.js";

import { triggerRef, shallowRef } from "vue";

const reactiveCache = new Map();

// maps URIs to dependent reactive objects
const dependencyMap = new Map();

// register listener for resource updates
emitter.on("resourceUpdated", triggerReactive);

export function debugReactive() {
  console.log("reactiveCache");
  console.log(...reactiveCache);

  console.log("dependencyMap");
  console.log(...dependencyMap);
}

export function getReactive(uri) {
  const reactiveObject = getReactiveFromCache(uri);
  fetchResourceAndUpdateReactive(uri, reactiveObject);
  return reactiveObject;
}

export function getRelationReactive(uri, relation) {
  const reactiveObject = getReactiveFromCache(`${uri}#${relation}`);
  fetchRelationAndUpdateReactive(uri, relation, reactiveObject);
  return reactiveObject;
}

function getReactiveFromCache(cacheKey) {
  if (reactiveCache.has(cacheKey)) {
    return reactiveCache.get(cacheKey);
  }

  const reactiveObject = shallowRef({});
  reactiveCache.set(cacheKey, reactiveObject);
  return reactiveObject;
}

function triggerReactive(uri) {
  if (dependencyMap.has(uri)) {
    dependencyMap.get(uri).forEach((reactiveObject) => {
      triggerRef(reactiveObject);
    });
  }
}

async function fetchResourceAndUpdateReactive(uri, reactiveObject) {
  const resource = await getAsync(uri);
  addDependency(uri, reactiveObject);
  reactiveObject.value = resource;
}

async function fetchRelationAndUpdateReactive(uri, relation, reactiveObject) {
  const resource = await getRelationAsync(uri, relation);
  addDependency(resource.data._links.self, reactiveObject); // only here we know which resource was returned
  reactiveObject.value = resource;
}

function addDependency(uri, reactiveObject) {
  let dependentObjects;
  if (dependencyMap.has(uri)) {
    dependentObjects = dependencyMap.get(uri);
  } else {
    dependentObjects = [];
    dependencyMap.set(uri, dependentObjects);
  }

  dependentObjects.push(reactiveObject);
}
