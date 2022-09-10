<script setup>
/*
test reactive functionality
*/

import { getReactive } from "@/api/reactive.js";

import { computed } from "vue";

// all of these are empty reactive objects, but will display data once the network request has finished
const entity1 = getReactive("/entities/1");
const entity1property1 = computed(() => entity1.resource?.data?.property1);

const entity1_parent = entity1.getRelation("parent");
console.log(entity1_parent === entity1.getRelation("parent")); // true --> returns the same object

const entity1_parent_nonEmbeddedRelation = entity1
  .getRelation("parent")
  .getRelation("nonEmbeddedRelation");

const entity2 = getReactive("/entities/2");
const allEntities = getReactive("/entities").getRelation("items");

// reactiveTest1: load /api_call_with_sideeffect with comes with new data for /entities/1
const reactiveTest1 = async () => {
  // payload contains new data for /entities/1 and for /entities
  // --> entity1 shows new data for properties
  // --> entity1parent is relinked to /entities/3
  // --> allEntities looses the last item
  getReactive("/api_call_with_sideeffect");
};
</script>

<template>
  <h1>Reactive tests</h1>
  <div><button @click="reactiveTest1">reactiveTest1</button></div>

  <h2>Entity1</h2>
  <pre>{{ entity1 }}</pre>
  entity1.property1: {{ entity1.resource?.data?.property1 }}<br />
  entity1.property1: {{ entity1property1 }}<br />

  <h2>Entity1#parent</h2>
  <pre>{{ entity1_parent }}</pre>

  <h2>entitiy1#parent#nonEmbeddedRelation:</h2>
  <pre>{{ entity1_parent_nonEmbeddedRelation }}</pre>
  <br />

  <h2>Entity2</h2>
  <pre>{{ entity2 }}</pre>

  <h2>All entities (collection test)</h2>
  <pre>{{ allEntities }}</pre>
</template>
