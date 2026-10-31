<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor } from 'gissen'
import config from '../gissen.config'

const { data } = await useFetch<GissenData>('/api/page')

async function save(next: GissenData) {
  await $fetch('/api/page', { method: 'PUT', body: next })
}
</script>

<template>
  <GissenEditor v-if="data" v-model:data="data" :config="config" style="height: 100%;" @update:data="save" />
</template>
