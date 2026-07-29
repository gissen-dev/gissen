<script setup lang="ts">
// The production render path: server-rendered (no ClientOnly), emitting the
// user components' own DOM only. In a real app `data` would come from
// storage; here it is the sample document the editor page starts from.
// Imported from `gissen/render` — the subpath a render-only app would use so
// its bundle never carries the editor stack.
import { GissenRender } from 'gissen/render'
import config from '../gissen.config'
import { samplePage } from '../sample-page'

const data = samplePage()
</script>

<template>
  <GissenRender :config="config" :data="data" />
</template>
