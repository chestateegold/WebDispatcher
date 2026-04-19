<script setup lang="ts">
import { useCmriStore } from '@/stores/cmri'
import type { CrossoverMapping, DoubleTrackBlockMapping, TrackBlockMapping, TurnoutMapping } from '@/types/cmri'

const cmriStore = useCmriStore()

const showGridLines = false
const showConnectionStatus = true

const connectionStatusLabel = computed(() => {
  switch (cmriStore.connectionState) {
    case 'connected':
      return 'CMRI connected'
    case 'connecting':
      return 'CMRI connecting'
    case 'reconnecting':
      return 'CMRI reconnecting'
    case 'error':
      return 'CMRI error'
    default:
      return 'CMRI disconnected'
  }
})

onMounted(() => {
  void cmriStore.connect()
})

onUnmounted(() => {
  cmriStore.disconnect().catch((error) => {
    console.error('Failed to disconnect from CMRI hub.', error)
  })
})

const blockOneMapping: TrackBlockMapping = {
  occupied: { byte: 2, bit: 3 },
}
const blockOneSize = 2
const blockTwoMapping: TrackBlockMapping = {
  occupied: { byte: 2, bit: 2 },
}
const blockTwoSize = 3
const crossover1Mapping: CrossoverMapping = {
  mainOccupied: { byte: 2, bit: 0 },
  crossingOccupied: { byte: 2, bit: 1 },
}
const crossoverSize = 3
const blockThreeMapping: TrackBlockMapping = {
  occupied: { byte: 1, bit: 2 },
}
const blockThreeSize = 2
//switch 1
const turnoutOneMapping: TurnoutMapping = {
  occupied: [{ byte: 1, bit: 0 }, { byte: 1, bit: 1 }],
  switchPosition: { byte: 1, bit: 3 },
}
const turnoutOneSize = 3
const doubleTrackOneMapping: DoubleTrackBlockMapping = {
  trackOneOccupied: { byte: 0, bit: 1 },
  trackTwoOccupied: { byte: 0, bit: 2 },
}
const doubleTrackOneSize = 3
//switch 2
const turnoutTwoMapping: TurnoutMapping = {
  occupied: { byte: 0, bit: 0 },
  switchPosition: { byte: 0, bit: 3 },
}
const turnoutTwoSize = 3
const blockFourMapping: TrackBlockMapping = {
  occupied: { byte: 2, bit: 3 },
}
const blockFourSize = 2
</script>

<template>
  <div class="container">
    <div v-if="showConnectionStatus" :class="['connection-status', `connection-status-${cmriStore.connectionState}`]">
      {{ connectionStatusLabel }}
    </div>
    <div :class="['panel', { 'panel-grid-lines': showGridLines }]">
      <!--
      <TrackBlock :size="blockOneSize" :mapping="blockOneMapping" :blockEndLeft="false" />
      <TrackBlock :size="blockTwoSize" :mapping="blockTwoMapping" />
      <Crossover :size="crossoverSize" orientation="left" :mapping="crossover1Mapping" />
    -->
      <TrackBlock :size="blockThreeSize" :mapping="blockThreeMapping" />
      <Turnout :size="turnoutOneSize" direction="left" orientation="up" :mapping="turnoutOneMapping" />
      <!--
      <DoubleTrackBlock :size="doubleTrackOneSize" orientation="up" :mapping="doubleTrackOneMapping" />

      <Turnout :size="turnoutTwoSize" direction="right" orientation="up" :mapping="turnoutTwoMapping" />
      <TrackBlock :size="blockFourSize" :mapping="blockFourMapping" :blockEndRight="false" />
    -->
    </div>
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

.connection-status {
  margin: 0 0 8px;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.88);
  color: #cfcfcf;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  width: fit-content;
}

.connection-status-connected {
  color: #7bd88f;
}

.connection-status-connecting,
.connection-status-reconnecting {
  color: #f0c674;
}

.connection-status-error,
.connection-status-disconnected {
  color: #ff7b72;
}

.panel {
  position: relative;
  display: grid;
  grid-template-columns: repeat(21, var(--grid-unit));
  grid-auto-rows: var(--panel-row-height);
  gap: 0;
  margin-bottom: 12px;
  width: fit-content;
}

.panel-grid-lines {
  /* single-pixel lines on the left/top (0) and right/bottom (cell-1px) edges */
  --grid-line-color: rgba(255, 255, 255, 0.95);
  background-image:
    /* vertical: left edge */
    linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
    /* vertical: right edge */
    linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
    /* horizontal: top edge */
    linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px),
    /* horizontal: bottom edge */
    linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px);
  /* tile to the grid cell size */
  background-size: var(--grid-unit) var(--panel-row-height);
  /* position each background so one appears at the 0px edge and the other at cell-1px */
  background-position: 0 0,
    calc(var(--grid-unit) - 1px) 0,
    0 0,
    0 calc(var(--panel-row-height) - 1px);
  background-repeat: repeat;
}
</style>
