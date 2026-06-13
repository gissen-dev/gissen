<script setup lang="ts">
import type { ComponentData } from 'gissen'

defineProps<{
  id: string
  children: ComponentData[]
}>()
</script>

<template>
  <div class="container">
    <!-- Slot convention: the editor passes rendered children via the named slot "children" -->
    <slot name="children" />
  </div>
</template>
