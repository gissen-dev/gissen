<script setup lang="ts">
// The production render path: server-rendered (no ClientOnly), emitting the
// user components' own DOM only. Imported from `gissen/render` — the
// subpath a render-only app would use so its bundle never carries the
// editor stack. `data` comes from the same storage the editor page writes
// to, over HTTP, so this is the real "editor saves, SSR serves" path, not a
// sample document.
import type { GissenData } from 'gissen/render'
import { GissenRender } from 'gissen/render'
import config from '../gissen.config'

const { data } = await useFetch<GissenData>('/api/page')
</script>

<template>
  <GissenRender v-if="data" :config="config" :data="data" />
</template>
