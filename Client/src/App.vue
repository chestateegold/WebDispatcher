<script setup lang="ts">
import TrackBlock from '@/components/TrackBlock.vue'
import Turnout from '@/components/turnout/index.vue'
import { getClearRouteSourceId, resolveClearRoute, type ClearRouteVisualState } from '@/clearRoute'
import { currentLayout } from '@/layout/currentLayout'
import {
  getLayoutItemSize,
  isTrackBlockLayoutItem,
  isTurnoutLayoutItem,
} from '@/layout/schema'
import { useCmriStore } from '@/stores/cmri'
import type { BitSourceLike, TrackBlockMapping, TurnoutMapping } from '@/types/cmri'

const cmriStore = useCmriStore()
const activeLayout = currentLayout

const showGridLines = false
const showConnectionStatus = true

//TODO: move this and the markup to a separate component
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

function getBitSourceValue(source: BitSourceLike | undefined): boolean {
  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
}

function isTrackBlockOccupied(mapping: TrackBlockMapping | undefined): boolean {
  return getBitSourceValue(mapping?.occupied)
}

function getTurnoutClearRouteSource(mapping: TurnoutMapping | undefined, direction: 'left' | 'right'): BitSourceLike | undefined {
  return direction === 'left' ? mapping?.clearLeft : mapping?.clearRight
}

const occupiedBlockStates = computed(() => {
  const states: Record<string, boolean> = {}

  for (const item of activeLayout.row) {
    if (!isTrackBlockLayoutItem(item)) {
      continue
    }

    states[item.id] = isTrackBlockOccupied(item.mapping)
  }

  return states
})

const clearRouteSourceStates = computed(() => {
  const states: Record<string, boolean> = {}

  for (const item of activeLayout.row) {
    if (!isTurnoutLayoutItem(item)) {
      continue
    }

    for (const source of item.controlPoint?.clearRouteSources ?? []) {
      states[getClearRouteSourceId(item.id, source.direction)] = getBitSourceValue(
        getTurnoutClearRouteSource(item.mapping, source.direction),
      )
    }
  }

  return states
})

const clearRouteStates = computed(() => {
  return resolveClearRoute({
    row: activeLayout.row,
    occupiedBlocks: occupiedBlockStates.value,
    routeStates: clearRouteSourceStates.value,
  })
})

function getTrackBlockVisualState(blockId: string): ClearRouteVisualState | undefined {
  return clearRouteStates.value[blockId]
}

const renderedRowItems = computed(() => {
  return activeLayout.row.map((item) => {
    if (isTurnoutLayoutItem(item)) {
      return {
        id: item.id,
        component: Turnout,
        props: {
          size: getLayoutItemSize(item),
          direction: item.direction,
          orientation: item.orientation,
          mapping: item.mapping,
        },
      }
    }

    return {
      id: item.id,
      component: TrackBlock,
      props: {
        size: getLayoutItemSize(item),
        mapping: item.mapping,
        visualState: getTrackBlockVisualState(item.id),
        blockEndLeft: item.blockEndLeft,
        blockEndRight: item.blockEndRight,
      },
    }
  })
})

const panelStyle = computed(() => ({
  gridTemplateColumns: `repeat(${activeLayout.row.reduce((total, item) => total + getLayoutItemSize(item), 0)}, var(--grid-unit))`,
}))
</script>

<template>
  <div class="container">
    <div v-if="showConnectionStatus" :class="['connection-status', `connection-status-${cmriStore.connectionState}`]">
      {{ connectionStatusLabel }}
    </div>
    <div :class="['panel', { 'panel-grid-lines': showGridLines }]" :style="panelStyle">
      <component
        v-for="item in renderedRowItems"
        :is="item.component"
        :key="item.id"
        v-bind="item.props"
      />
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
