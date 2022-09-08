<script setup>
/*
test reactive functionality
*/

import { getReactive, getRelationReactive } from "@/api/reactive.js";

// all of these are empty reactive objects, but will display data once the network request has finished
const entity1 = getReactive("/entities/1");
const entity1parent = getRelationReactive("/entities/1", "parent");
const entity2 = getReactive("/entities/2");

// reactiveTest1: load /api_call_with_sideeffect with comes with new data for /entities/1
const reactiveTest1 = async () => {
  // payload contains new data for /entities/1
  // --> reactivity is triggered via triggerReactice
  // --> entity1 shows new data for properties
  // --> entity1parent still shows data for /entities/2, although it should now show /entities/3
  getReactive("/api_call_with_sideeffect");
};
</script>

<template>
  <h1>Reactive tests</h1>
  <div><button @click="reactiveTest1">reactiveTest1</button></div>

  <h2>Entity1</h2>
  <pre>{{ entity1 }}</pre>

  <h2>Entity1#parent</h2>
  <pre>{{ entity1parent }}</pre>

  <h2>Entity2</h2>
  <pre>{{ entity2 }}</pre>
</template>
