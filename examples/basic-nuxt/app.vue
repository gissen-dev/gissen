<template>
  <div class="app-shell">
    <nav class="app-nav">
      <NuxtLink to="/">
        Editor
      </NuxtLink>
      <NuxtLink to="/render">
        Rendered page
      </NuxtLink>
    </nav>
    <div class="app-page">
      <NuxtPage />
    </div>
  </div>
</template>

<style>
@import 'gissen/style.css';

* { box-sizing: border-box; }
body { margin: 0; }

.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-nav {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-family: system-ui, sans-serif;
  font-size: 0.875rem;
}

.app-nav a {
  color: #374151;
  text-decoration: none;
}

.app-nav a.router-link-active {
  color: #111827;
  font-weight: 600;
}

.app-page {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
