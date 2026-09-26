<script setup lang="ts">
defineProps<{ id: string }>()
</script>

<template>
  <div class="freeform">
    <slot name="items" />
  </div>
</template>
