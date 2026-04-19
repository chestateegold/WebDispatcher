<script setup lang="ts">
import styles from './cell.module.css'
import { clearColor, idleColor, occupiedColor } from './turnout/constants'

import type { ClearRouteVisualState } from '@/clearRoute'
import { useCmriStore } from '@/stores/cmri'
import type { TrackBlockMapping } from '@/types/cmri'

interface Props {
  size?: number
  blockEndLeft?: boolean
  blockEndRight?: boolean
  mapping?: TrackBlockMapping
  visualState?: ClearRouteVisualState | null
}

const props = withDefaults(defineProps<Props>(), {
  size: 3,
  blockEndLeft: true,
  blockEndRight: true,
  mapping: () => ({}),
  visualState: null,
})

const cmriStore = useCmriStore()

const isOccupied = computed(() => {
  const source = props.mapping.occupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const resolvedVisualState = computed<ClearRouteVisualState>(() => {
  if (isOccupied.value || props.visualState === 'occupied') {
    return 'occupied'
  }

  if (props.visualState === 'clear') {
    return 'clear'
  }

  return 'idle'
})

const railStyle = computed(() => ({
  '--rail-stroke': resolvedVisualState.value === 'clear'
    ? clearColor
    : resolvedVisualState.value === 'occupied'
      ? occupiedColor
      : idleColor,
}))

const blockWidth = computed(() => props.size * 20)

const innerTrackEnd = computed(() => Math.max(1, blockWidth.value - 1))

const viewBox = computed(() => `0 -20 ${blockWidth.value} 80`)

const layoutStyle = computed(() => ({
  gridColumn: `span ${props.size}`,
}))
</script>

<template>
  <div :class="[styles.component, styles.layoutItem, 'track']" :style="layoutStyle">
    <svg :class="styles.svgFill" :viewBox="viewBox" aria-label="Track block">
      <line v-if="blockEndLeft" x1="0" y1="14" x2="0" y2="26" :class="[styles.blockEnd, styles.rail]" :style="railStyle" />
      <line x1="1" y1="20" :x2="innerTrackEnd" y2="20" :class="[styles.straight, styles.rail]" :style="railStyle" />
      <line v-if="blockEndRight" :x1="blockWidth" y1="14" :x2="blockWidth" y2="26" :class="[styles.blockEnd, styles.rail]" :style="railStyle" />
    </svg>
  </div>
</template>