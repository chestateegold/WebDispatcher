<script setup lang="ts">
import { useCmriStore } from '@/stores/cmri'

const cmriStore = useCmriStore()

const connectionStatusLabel = computed(() => {
  switch (cmriStore.connectionState) {
    case 'connecting':
      return 'CMRI connecting'
    case 'reconnecting':
      return 'CMRI reconnecting'
    case 'error':
      return 'CMRI error'
    case 'disconnected':
      return 'CMRI disconnected'
    default:
      return ''
  }
})

const shouldShowStatus = computed(() => cmriStore.connectionState !== 'connected')
</script>

<template>
  <div
    v-if="shouldShowStatus"
    :class="['connection-status', `connection-status-${cmriStore.connectionState}`]"
    aria-live="polite"
  >
    {{ connectionStatusLabel }}
  </div>
</template>

<style scoped>
.connection-status {
  margin: 0 0 calc(8px * var(--layout-scale));
  padding: calc(4px * var(--layout-scale)) calc(10px * var(--layout-scale));
  border: calc(1px * var(--layout-scale)) solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.88);
  color: #cfcfcf;
  font-size: calc(11px * var(--layout-scale));
  letter-spacing: 0.06em;
  text-transform: uppercase;
  width: fit-content;
}

.connection-status-connecting,
.connection-status-reconnecting {
  color: #f0c674;
}

.connection-status-error,
.connection-status-disconnected {
  color: #ff7b72;
}
</style>