<script setup>
/*
test async functionality
*/

import { getReactive, getRelationReactive } from "@/api/reactive.js";

import { getAsync } from "@/api/async.js";

const entity1 = getReactive("/entities/1");
const entity1parent = getRelationReactive("/entities/1", "parent");
const entity2 = getReactive("/entities/2");

// reactiveTest1: load /api_call_with_sideeffect with comes with new data for /entities/2
const reactiveTest1 = async () => {
  await getAsync("/api_call_with_sideeffect");
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
