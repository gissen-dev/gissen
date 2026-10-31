<script setup lang="ts">
import { status } from '../status'
</script>

<template>
  <div class="custom-block warning">
    <p class="custom-block-title">
      Status: {{ status.label }}
    </p>
    <p>{{ status.notice }}</p>
  </div>
</template>
