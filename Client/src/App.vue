<script setup lang="ts">
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import LayoutPanel from '@/components/LayoutPanel.vue'
import { useCmriStore } from '@/stores/cmri'

const cmriStore = useCmriStore()

onMounted(() => {
  void cmriStore.connect()
})

onUnmounted(() => {
  cmriStore.disconnect().catch((error) => {
    console.error('Failed to disconnect from CMRI hub.', error)
  })
})
</script>

<template>
  <div class="container">
    <ConnectionStatus />
    <LayoutPanel />
  </div>
</template>

<style>
:root {
  --layout-scale: 1.65;
  --grid-unit: calc(20px * var(--layout-scale));
  --panel-row-height: calc(100px * var(--layout-scale));
}

/* Page */
body {
  margin: 0;
  background: #111;
  color: #ddd;
  font-family: system-ui, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  touch-action: manipulation;
}

/* Outer container sizes to content, not screen */
.container {
  padding: calc(12px * var(--layout-scale));
  border-radius: calc(10px * var(--layout-scale));
  width: fit-content;
}
</style>
