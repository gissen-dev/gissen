<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { onMounted, ref } from 'vue'

// A short, silent clip when its file exists at build time (see
// scripts/demo-video/README.md for how files get there), and the fallback
// below when it does not. Which files exist is decided in
// .vitepress/config.ts, so adding a video needs no code change.
const props = defineProps<{
  kind: 'editor' | 'agent'
}>()

const { theme } = useData()
const media = theme.value.demoVideos?.[props.kind]

const reducedMotion = ref(false)
onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})
</script>

<template>
  <figure v-if="media" class="demo-media">
    <!-- Muted so autoplay is allowed; with reduced motion it waits for a click instead. -->
    <video
      :autoplay="!reducedMotion"
      :controls="reducedMotion"
      muted
      loop
      playsinline
      preload="metadata"
      :poster="media.poster ? withBase(media.poster) : undefined"
    >
      <source v-if="media.webm" :src="withBase(media.webm)" type="video/webm">
      <source v-if="media.mp4" :src="withBase(media.mp4)" type="video/mp4">
    </video>
  </figure>
  <figure v-else-if="kind === 'editor'" class="demo-media">
    <a :href="withBase('/playground')">
      <img
        :src="withBase('/demo/editor-screenshot.png')"
        alt="The Gissen editor with a sidebar of components, a canvas showing a page, and a properties panel. Open the playground to try it."
        width="1168"
        height="642"
        loading="lazy"
      >
    </a>
  </figure>
</template>

<style scoped>
.demo-media {
  margin: 24px auto;
  max-width: 960px;
}

.demo-media video,
.demo-media img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
</style>
