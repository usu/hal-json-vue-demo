<script setup>
/*
test async functionality
*/

import { getAsync, getRelationAsync, clearCache } from "@/api/async.js";

// asyncTest1: fetching the same resource multiple times triggers single network request only
const asyncTest1 = async () => {
  clearCache();

  const entity1promise = getAsync("/entities/1");
  const entity1againPromise = getAsync("/entities/1");

  // true --> returns the same promise
  console.log(entity1promise === entity1againPromise);

  const entity1 = await entity1promise;
  const entity1again = await entity1againPromise;

  console.log(entity1);
  console.log(JSON.parse(JSON.stringify(entity1)));
  console.log(entity1.data.property1);
  console.log(entity1.data.property2);

  // true --> returns the same response
  console.log(entity1 === entity1again);

  // true --> again the same response
  console.log(entity1 == (await getAsync("/entities/1")));
};

// asyncTest2: embedded parent is loaded from cache (single network request only)
const asyncTest2 = async () => {
  clearCache();

  const entity1parent = await getRelationAsync("/entities/1", "parent");

  // only 1 network request was made
  console.log(entity1parent);
};

// asyncTest3: loading parent and loading entity directly results in same response
const asyncTest3 = async () => {
  clearCache();

  const entity1parentPromise = getRelationAsync("/entities/1", "parent");
  const entity2promise = getAsync("/entities/2");

  // false --> not the same promise / 2 network requests are triggered
  console.log(entity1parentPromise === entity2promise);

  // true --> in the end, returns the same response
  console.log((await entity1parentPromise) === (await entity2promise));
};

// asyncTest4: loading same relation twice triggers only 1 network request
const asyncTest4 = async () => {
  clearCache();

  const promise1 = getRelationAsync("/entities/1", "parent");
  const promise2 = getRelationAsync("/entities/1", "parent");

  // true --> returns the same response / only 1 network request is made
  console.log((await promise1) === (await promise2));
};

// asyncTest5:
const asyncTest5 = async () => {
  clearCache();

  await getAsync("/entities/1");

  getRelationAsync("/entities/2", "nonEmbeddedRelation");

  getRelationAsync("/entities/1", "parent").then(() => {
    getRelationAsync("/entities/2", "nonEmbeddedRelation");
  });

  // true --> returns the same response / only 1 network request is made
  // console.log((await promise1) === (await promise2));
};

// asyncTest6:
const asyncTest6 = async () => {
  clearCache();

  const entity1 = await getAsync("/entities/1");

  console.log(entity1);
  console.log(entity1.property1);
  console.log(entity1.property2);

  // this needs proxies for the magic
  const promise = entity1.parent();
  console.log(promise);
  console.log(await promise);
};

// asyncTest7:
const asyncTest7 = async () => {
  clearCache();

  const entities = await getAsync("/entities");
  console.log(entities);

  const items = await getRelationAsync("/entities", "items");
  console.log(items);
};

// asyncTest8:
const asyncTest8 = async () => {
  clearCache();

  const entity2 = await getAsync("/entities/2");
  console.log(entity2);

  const children = await getRelationAsync("/entities/2", "children");
  console.log(children);
};
</script>

<template>
  <h1>Async tests</h1>
  <div><button @click="asyncTest1">asyncTest1</button></div>
  <div><button @click="asyncTest2">asyncTest2</button></div>
  <div><button @click="asyncTest3">asyncTest3</button></div>
  <div><button @click="asyncTest4">asyncTest4</button></div>
  <div><button @click="asyncTest5">asyncTest5</button></div>
  <div><button @click="asyncTest6">asyncTest6</button></div>
  <div><button @click="asyncTest7">asyncTest7</button></div>
  <div><button @click="asyncTest8">asyncTest8</button></div>
</template>
