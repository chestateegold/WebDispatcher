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
  --ui-scale: 1.65;
  --grid-unit: 20px;
  --panel-row-height: 100px;
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
  padding: 12px;
  border-radius: 10px;
  width: fit-content;
  transform: scale(var(--ui-scale));
  transform-origin: center;
}
</style>
