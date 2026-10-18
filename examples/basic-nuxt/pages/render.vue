<script setup lang="ts">
// The production render path: server-rendered (no ClientOnly), emitting the
// user components' own DOM only. In a real app `data` would come from
// storage; here that store is `page.json` on disk — the same file
// `gissen-mcp` edits, so an agent's change shows up in the browser on the
// next dev-server reload.
// Imported from `gissen/render` — the subpath a render-only app would use so
// its bundle never carries the editor stack.
import { GissenRender } from 'gissen/render'
import config from '../gissen.config'
import data from '../page.json'
</script>

<template>
  <GissenRender :config="config" :data="data" />
</template>
