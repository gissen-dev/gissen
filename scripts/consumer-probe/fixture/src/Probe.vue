<!--
  Template-path probe: vue-tsc must type-check component bindings in a consumer
  SFC — the exact surface where the `.vue`-import dts bug made `config` checks
  silently vanish. The `@vue-expect-error` is the tripwire: if `GissenEditor`
  regresses to `any`, the expected template error disappears and the probe fails.
-->
<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor } from 'gissen'
import { GissenRender } from 'gissen/render'
import { ref } from 'vue'
import { probeConfig } from './probe'

const doc = ref<GissenData>({ version: 1, root: { props: {} }, content: [] })
</script>

<template>
  <GissenEditor v-model:data="doc" :config="probeConfig" />
  <GissenRender :config="probeConfig" :data="doc" />
  <!-- @vue-expect-error a malformed `config` must fail template type-checking -->
  <GissenEditor v-model:data="doc" :config="{ components: 42 }" />
</template>
