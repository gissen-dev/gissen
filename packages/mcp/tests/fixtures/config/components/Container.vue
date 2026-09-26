<script setup lang="ts">
defineProps<{ id: string }>()
</script>

<template>
  <div class="container">
    <slot name="children" />
  </div>
</template>
