<script setup lang="ts">
import { GissenEditor } from 'gissen'
import { ref } from 'vue'
import config from '../gissen.config'
import { samplePage } from '../sample-page'

const data = ref(samplePage())
</script>

<template>
  <GissenEditor v-model:data="data" :config="config" style="height: 100%;" />
</template>
