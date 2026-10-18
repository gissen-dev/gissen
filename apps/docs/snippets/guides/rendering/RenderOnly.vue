<script setup lang="ts">
import type { GissenData } from 'gissen/render'
import { GissenRender } from 'gissen/render'
import config from './config'

defineProps<{ data: GissenData }>()
</script>

<template>
  <GissenRender :config="config" :data="data" />
</template>
