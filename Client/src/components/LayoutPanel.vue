<script setup lang="ts">
import { computed } from 'vue'

import Crossover from '@/components/Crossover.vue'
import DoubleTrackBlock from '@/components/DoubleTrackBlock.vue'
import TrackBlock from '@/components/TrackBlock.vue'
import Turnout from '@/components/turnout/index.vue'
import { currentLayout } from '@/layout/currentLayout'
import {
  getLayoutItemSize,
  isCrossoverLayoutItem,
  isDoubleTrackLayoutItem,
  isTurnoutLayoutItem,
} from '@/layout/schema'
import { useCmriStore } from '@/stores/cmri'
import { useClearRouteStates } from '@/composables/useClearRouteStates'

const cmriStore = useCmriStore()
const activeLayout = currentLayout
const showGridLines = false

const { getLayoutItemVisualState, getDoubleTrackItemVisualState } = useClearRouteStates({
  row: activeLayout.row,
  getBitSourceValue: (source) => {
    if (!source) {
      return false
    }

    return cmriStore.getAnyBit(source)
  },
})

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

    if (isCrossoverLayoutItem(item)) {
      return {
        id: item.id,
        component: Crossover,
        props: {
          size: getLayoutItemSize(item),
          orientation: item.orientation,
          mapping: item.mapping,
          visualState: getLayoutItemVisualState(item.id),
        },
      }
    }

    if (isDoubleTrackLayoutItem(item)) {
      return {
        id: item.id,
        component: DoubleTrackBlock,
        props: {
          size: getLayoutItemSize(item),
          orientation: item.orientation,
          mapping: item.mapping,
          visualState: getDoubleTrackItemVisualState(item.id),
        },
      }
    }

    return {
      id: item.id,
      component: TrackBlock,
      props: {
        size: getLayoutItemSize(item),
        mapping: item.mapping,
        visualState: getLayoutItemVisualState(item.id),
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
  <div :class="['panel', { 'panel-grid-lines': showGridLines }]" :style="panelStyle">
    <component
      v-for="item in renderedRowItems"
      :is="item.component"
      :key="item.id"
      v-bind="item.props"
    />
  </div>
</template>

<style scoped>
.panel {
  position: relative;
  display: grid;
  grid-auto-rows: var(--panel-row-height);
  gap: 0;
  margin-bottom: calc(12px * var(--layout-scale));
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