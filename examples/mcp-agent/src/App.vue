<script setup lang="ts">
import { GissenRender } from 'gissen/render'
import config from '../gissen.config'
import { data } from './page-store'
</script>

<template>
  <GissenRender :config="config" :data="data" />
</template>
