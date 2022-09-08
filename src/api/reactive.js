import { fetchResourceAsync } from "./async.js";

import { shallowRef, watch } from "vue";

// cache for reactive object. 1 entry per requested path (=uri or =uri + relation path)
// Hence, 1 resource can have multiple entries if requested via different paths
// Equivalent to a LoadingResource/LoadingProxy
const reactiveCache = new Map();

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

  // replacing the complete value of a shallowRef is reactive
  // however: if any data within resource changes, the reactivity system wouldn't know (manual trigger of reactivity needed)
  reactiveObject.value = resource;
}

async function fetchRelationAndUpdateReactive(uri, relation, reactiveObject) {
  const resource = await fetchResourceAsync(uri);

  // because resource is a reactive object, `fetchResourceAsync` is triggered, whenever `resource?.data?._links[relation]` changes
  watch(
    () => resource?.data?._links[relation],
    async () => {
      console.log(
        `${uri} ${relation} changed to ${resource?.data?._links[relation]} - reloading new data...`
      );
      reactiveObject.value = await fetchResourceAsync(
        resource?.data?._links[relation]
      );
    },
    { immediate: true }
  );
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

/**
 * Support / debug API
 */
export function debugReactive() {
  console.log("reactiveCache");
  console.log(...reactiveCache);
}
