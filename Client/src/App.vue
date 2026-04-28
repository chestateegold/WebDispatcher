<script setup lang="ts">
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import LayoutPanel from '@/components/LayoutPanel.vue'
import { fetchCurrentLayout } from '@/layout/api'
import type { LayoutDefinition } from '@/layout/schema'
import { useCmriStore } from '@/stores/cmri'

const cmriStore = useCmriStore()
const activeLayout = ref<LayoutDefinition | null>(null)
const isLayoutLoading = ref(true)
const layoutLoadError = ref<string | null>(null)

onMounted(() => {
  void loadLayout()
  void cmriStore.connect().catch((error) => {
    console.error('Failed to connect to CMRI hub.', error)
  })
})

onUnmounted(() => {
  cmriStore.disconnect().catch((error) => {
    console.error('Failed to disconnect from CMRI hub.', error)
  })
})

async function loadLayout(): Promise<void> {
  isLayoutLoading.value = true
  layoutLoadError.value = null

  try {
    activeLayout.value = await fetchCurrentLayout()
  }
  catch (error) {
    activeLayout.value = null
    layoutLoadError.value = error instanceof Error ? error.message : 'Failed to load layout.'
  }
  finally {
    isLayoutLoading.value = false
  }
}
</script>

<template>
  <div class="container">
    <ConnectionStatus />
    <LayoutPanel v-if="activeLayout" :layout="activeLayout" />
    <div v-else-if="isLayoutLoading" class="layout-status">
      Loading layout...
    </div>
    <div v-else class="layout-status layout-status-error">
      {{ layoutLoadError ?? 'Layout unavailable.' }}
    </div>
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

.layout-status {
  padding: calc(16px * var(--layout-scale));
  color: #bbb;
  font-size: calc(14px * var(--layout-scale));
}

.layout-status-error {
  color: #ff8f8f;
}
</style>
