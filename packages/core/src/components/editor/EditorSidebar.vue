<script setup lang="ts">
import type { GissenConfig } from '../../types'
import { computed, ref } from 'vue'
import { useSidebarDnD } from '../../composables/useGissenDnD'

const props = defineProps<{ config: GissenConfig }>()

// Computed so a swapped `config` prop updates the palette.
const componentTypes = computed(() => Object.keys(props.config.components))

const listEl = ref<HTMLElement | null>(null)
useSidebarDnD(listEl)
</script>

<template>
  <aside class="gissen-sidebar">
    <div class="gissen-sidebar__header">
      Components
    </div>
    <ul ref="listEl" class="gissen-sidebar__list">
      <li
        v-for="type in componentTypes"
        :key="type"
        class="gissen-sidebar__item"
        :data-gissen-type="type"
      >
        <svg class="gissen-sidebar__item-icon" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5" />
        </svg>
        {{ type }}
      </li>
    </ul>
  </aside>
</template>
