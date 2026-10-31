---
layout: page
title: Playground
sidebar: false
aside: false
---

<script setup>
import { defineAsyncComponent } from 'vue'

// Imported lazily on purpose. VitePress builds two chunks per page (one for
// the first load, one for in-site navigation); a static import would bundle
// the editor into both, and the editor's lazily loaded canvas chunk would
// then look up its store in the other copy and fail. A dynamic import gives
// the editor one chunk that both page chunks share.
const Playground = defineAsyncComponent(() => import('./playground/Playground.vue'))
</script>

<div class="playground-intro">

# Playground

<GissenStatus />

This is the real editor, running in your browser. Nothing is saved, and a reload starts over. Open Preview to see the same document drawn by `GissenRender`, or JSON to see what the editor produces.

</div>

<ClientOnly>
  <Playground />
</ClientOnly>

<style>
.playground-intro {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 16px 0;
}

/* layout: page applies no document styles, so the intro sets its own. */
.playground-intro h1 {
  margin: 0 0 16px;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.playground-intro p {
  margin: 16px 0 0;
  line-height: 1.7;
}

.playground-intro code {
  font-size: 0.9em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--vp-code-bg);
}
</style>
