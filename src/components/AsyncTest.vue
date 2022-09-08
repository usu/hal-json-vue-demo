<script setup>
/*
test async functionality
*/

import { getAsync, getRelationAsync, clearCache } from "@/api/async.js";

// asyncTest1: fetching the same resource multiple times triggers single network request only
const asyncTest1 = async () => {
  clearCache();
  console.log("************* asyncTest1");
  const entity1 = await getAsync("/entities/1");
  const entity1again = await getAsync("/entities/1");

  console.log(entity1);

  // true --> returns the same response
  console.log(entity1 === entity1again);

  // true --> again the same response
  console.log(entity1 == (await getAsync("/entities/1")));
};

// asyncTest2: embedded parent is loaded from cache (single network request only)
const asyncTest2 = async () => {
  clearCache();
  console.log("************* asyncTest2");

  const entity1parent = await getRelationAsync("/entities/1", "parent");

  // only 1 network request was made
  console.log(entity1parent);
};

// asyncTest3: loading parent and loading entity directly results in same response (but 2 simultaneous network requests)
const asyncTest3 = async () => {
  clearCache();
  console.log("************* asyncTest3");

  const entity1parentPromise = getRelationAsync("/entities/1", "parent");
  const entity2promise = getAsync("/entities/2");

  // true --> in the end, returns the same response
  console.log((await entity1parentPromise) === (await entity2promise));
};

// asyncTest4: loading exactly same relation twice triggers only 1 network request
const asyncTest4 = async () => {
  clearCache();
  console.log("************* asyncTest4");

  const promise1 = getRelationAsync("/entities/1", "parent");
  const promise2 = getRelationAsync("/entities/1", "parent");

  // true --> returns the same response / only 1 network request is made
  console.log((await promise1) === (await promise2));
};

// asyncTest5: non-embedded entity is loaded with separate request
const asyncTest5 = async () => {
  clearCache();
  console.log("************* asyncTest5");

  await getAsync("/entities/1");

  getRelationAsync("/entities/2", "nonEmbeddedRelation");
};

// asyncTest6: testing proxy to load relations
/*
const asyncTest6 = async () => {
  clearCache();
  console.log("************* asyncTest6");

  const entity1 = await getAsync("/entities/1");
  console.log(entity1);


  // this needs proxies for the magic
  const promise = entity1.parent();
  console.log(promise);
  console.log(await promise);
};*/

// asyncTest7: loading a collection (with items property)
const asyncTest7 = async () => {
  clearCache();
  console.log("************* asyncTest7");

  const entities = await getAsync("/entities");
  console.log(entities);

  const items = await getRelationAsync("/entities", "items"); // at the moment treated generically like any other relation (more magic possible to cover this special case)
  console.log(items);
};

// asyncTest8: loading a relation which contains an array of links
const asyncTest8 = async () => {
  clearCache();
  console.log("************* asyncTest8");

  const entity2 = await getAsync("/entities/2");
  console.log(entity2);

  const children = await getRelationAsync("/entities/2", "children");
  console.log(children);
};
</script>

<template>
  <h1>Async tests (check console)</h1>
  <div><button @click="asyncTest1">asyncTest1</button></div>
  <div><button @click="asyncTest2">asyncTest2</button></div>
  <div><button @click="asyncTest3">asyncTest3</button></div>
  <div><button @click="asyncTest4">asyncTest4</button></div>
  <div><button @click="asyncTest5">asyncTest5</button></div>
  <!-- <div><button @click="asyncTest6">asyncTest6</button></div> -->
  <div><button @click="asyncTest7">asyncTest7</button></div>
  <div><button @click="asyncTest8">asyncTest8</button></div>
</template>
