<script setup lang="ts">
import { GissenEditor } from 'gissen'
import { ref } from 'vue'
import config from '../gissen.config'
import page from '../page.json'

// Cloned: the editor mutates `data` in place, and the imported JSON module is
// shared with the render page. Editor changes stay in memory — they are not
// written back to `page.json`, so a dev-server reload returns to the file.
const data = ref(structuredClone(page))
</script>

<template>
  <GissenEditor v-model:data="data" :config="config" style="height: 100%;" />
</template>
