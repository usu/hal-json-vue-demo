import { fetchResourceAsync, fetchRelationAsync } from "./async.js";
import { watch, shallowReactive } from "vue";

// cache for reactive resource loaders. 1 entry per requested path (=uri or =uri + relation path)
// Hence, 1 resource can have multiple entries if requested via different paths
// Equivalent to a LoadingResource/LoadingProxy
const resourceLoaderCache = new Map();

/**
 * External API
 */

export function getReactive(uri) {
  const resourceLoader = getLoaderFromCache(uri);
  resourceLoader.loadResource(fetchResourceAsync(uri));
  return resourceLoader;
}

/**
 * Internal API
 */
function getRelationReactive(
  parentRequestPath,
  parentResourcePromise,
  relation
) {
  const resourceLoader = getLoaderFromCache(`${parentRequestPath}#${relation}`);
  resourceLoader.loadResource(
    fetchRelationAndWatchForChanges(
      parentResourcePromise,
      relation,
      resourceLoader
    )
  );
  return resourceLoader;
}

async function fetchRelationAndWatchForChanges(
  parentResourcePromise,
  relation,
  resourceLoader
) {
  const parentResource = await parentResourcePromise;
  const uri = parentResource.data._links.self;

  // because resource is a reactive object, `fetchRelationAsync` is triggered, whenever `resource?.data?._links[relation]` changes
  watch(
    () => parentResource?.data?._links[relation],
    async (newLink) => {
      console.log(
        `${uri} ${relation} changed to ${newLink} - reloading new data...`
      );

      resourceLoader.loadResource(fetchRelationAsync(uri, relation));

      // TODO: only reloading this resourceLoader is not enough. All subkeys need to be reloaded as well
      // Example: `parent` link on `/entity1` changes. Then we need to reload `/entity1#parent` as well as `/entity1#parent#parent` or any other subkeys of `/entity1#parent`
      // Maybe it's also better to move responsibility for this watcher into the ResourceLoader class...
    }
  );

  return fetchRelationAsync(uri, relation);
}

function getLoaderFromCache(requestPath) {
  if (resourceLoaderCache.has(requestPath)) {
    return resourceLoaderCache.get(requestPath);
  }

  // if no cache hit --> initialize empty shallow reactive object
  const resourceLoader = shallowReactive(new ResourceLoader(requestPath));
  resourceLoaderCache.set(requestPath, resourceLoader);
  return resourceLoader;
}

/**
 * Support / debug API
 */
export function debugReactive() {
  console.log("resourceLoaderCache");
  console.log(...resourceLoaderCache);
}

/**
 * ResourceLoader class (part of public API)
 * (might be enhanced with Proxy functionality later)
 */

class ResourceLoader {
  resourcePromise = null; // promise which is loading (or has loaded) `resource`
  resource = null; // pointer to reactive `resource` object from async module
  requestPath = null; // initial requestPath (e.g. '/entity1#parent#parent`)

  constructor(requestPath, resource = null) {
    this.requestPath = requestPath;
    this.resource = resource;
  }

  get uriOrCacheKey() {
    if (this.resource?.data?._links?.self) {
      return this.resource.data._links.self;
    }

    return this.requestPath;
  }

  getRelation(relation) {
    return getRelationReactive(
      this.uriOrCacheKey,
      this.resourcePromise,
      relation
    );
  }

  async loadResource(promise) {
    this.resourcePromise = promise;
    this.resource = await promise; // works because `this` points to the reactive Proxy, and not to ResourceLoader directly
    return this.resource;
  }
}
