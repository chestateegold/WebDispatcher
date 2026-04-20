<script setup lang="ts">
import styles from './cell.module.css'

import { clearColor, occupiedColor, idleColor } from '@/components/constants'
import type { ClearRouteVisualState } from '@/clearRoute'
import { useCmriStore } from '@/stores/cmri'
import type { CrossoverMapping } from '@/types/cmri'

type CrossoverOrientation = 'left' | 'right'

interface Props {
  size?: number
  orientation?: CrossoverOrientation
  mapping?: CrossoverMapping
  visualState?: ClearRouteVisualState | null
}

const props = withDefaults(defineProps<Props>(), {
  size: 3,
  orientation: 'left',
  mapping: () => ({}),
  visualState: null,
})

const cmriStore = useCmriStore()

function getRailColor(state: ClearRouteVisualState): string {
  if (state === 'occupied') {
    return occupiedColor
  }

  if (state === 'clear') {
    return clearColor
  }

  return idleColor
}

const geometryTransform = computed(() =>
  props.orientation === 'right' ? 'translate(100,0) scale(-1,1)' : undefined,
)

const ariaLabel = computed(() => `${props.orientation} crossover track`)

const mainOccupied = computed(() => {
  const source = props.mapping.mainOccupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const crossingOccupied = computed(() => {
  const source = props.mapping.crossingOccupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const diamondOccupied = computed(() => mainOccupied.value || crossingOccupied.value)

const resolvedMainVisualState = computed<ClearRouteVisualState>(() => {
  if (mainOccupied.value || props.visualState === 'occupied') {
    return 'occupied'
  }

  if (props.visualState === 'clear') {
    return 'clear'
  }

  return 'idle'
})

const resolvedDiamondVisualState = computed<ClearRouteVisualState>(() => {
  if (diamondOccupied.value || props.visualState === 'occupied') {
    return 'occupied'
  }

  if (props.visualState === 'clear') {
    return 'clear'
  }

  return 'idle'
})

const mainTrackStyle = computed(() => ({
  '--rail-stroke': getRailColor(resolvedMainVisualState.value),
  '--rail-fill': getRailColor(resolvedMainVisualState.value),
}))

const crossingTrackStyle = computed(() => ({
  '--rail-stroke': crossingOccupied.value ? occupiedColor : idleColor,
  '--rail-fill': crossingOccupied.value ? occupiedColor : idleColor,
}))

const diamondStyle = computed(() => ({
  '--rail-stroke': getRailColor(resolvedDiamondVisualState.value),
  '--rail-fill': getRailColor(resolvedDiamondVisualState.value),
}))

const layoutStyle = computed(() => ({
  gridColumn: `span ${props.size}`,
}))
</script>

<template>
  <div :class="[styles.component, styles.layoutItem, 'track']" :style="layoutStyle">
    <svg :class="styles.svgFill" viewBox="0 -20 60 80" :aria-label="ariaLabel">
      <g transform="translate(0,10)">
        <g :transform="geometryTransform">
        <!-- Main Track -->
        <line x1="0" y1="4" x2="0" y2="16" :class="[styles.blockEnd, styles.rail]" :style="mainTrackStyle" />

        <polygon points="0,6 21,6 29,14 0,14" :class="[styles.polyline, styles.rail]" :style="mainTrackStyle" />

        <polygon points="31,6 60,6 60,14 39,14" :class="[styles.polyline, styles.rail]" :style="mainTrackStyle" />

        <line x1="60" y1="4" x2="60" y2="16" :class="[styles.blockEnd, styles.rail]" :style="mainTrackStyle" />

        <!-- Diamond -->
        <polygon points="21,6 31,6 39,14 29,14" :class="[styles.polyline, styles.rail]" :style="diamondStyle" />

        <!-- Crossing Track -->
        <polygon points="0,-15 21,6 31,6 5,-20" :class="[styles.polyline, styles.rail]" :style="crossingTrackStyle" />
        <polygon points="55,40 29,14 39,14 60,35" :class="[styles.polyline, styles.rail]" :style="crossingTrackStyle" />
        </g>
      </g>
    </svg>
  </div>
</template>