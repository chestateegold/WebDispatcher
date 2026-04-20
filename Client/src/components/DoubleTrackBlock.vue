<script setup lang="ts">
import styles from './cell.module.css'

import { clearColor, occupiedColor, idleColor } from '@/components/constants'

import type { DoubleTrackClearRouteVisualState, ClearRouteVisualState } from '@/clearRoute'
import { useCmriStore } from '@/stores/cmri'
import type { DoubleTrackBlockMapping } from '@/types/cmri'

type TrackOrientation = 'up' | 'down'

interface Props {
  size?: number
  mapping?: DoubleTrackBlockMapping
  orientation?: TrackOrientation
  visualState?: DoubleTrackClearRouteVisualState | null
}

const props = withDefaults(defineProps<Props>(), {
  size: 5,
  mapping: () => ({}),
  orientation: 'up',
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

const trackOneOccupied = computed(() => {
  const source = props.mapping.trackOneOccupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const trackTwoOccupied = computed(() => {
  const source = props.mapping.trackTwoOccupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const resolvedTrackOneVisualState = computed<ClearRouteVisualState>(() => {
  if (trackOneOccupied.value || props.visualState?.trackOne === 'occupied') {
    return 'occupied'
  }

  if (props.visualState?.trackOne === 'clear') {
    return 'clear'
  }

  return 'idle'
})

const resolvedTrackTwoVisualState = computed<ClearRouteVisualState>(() => {
  if (trackTwoOccupied.value || props.visualState?.trackTwo === 'occupied') {
    return 'occupied'
  }

  if (props.visualState?.trackTwo === 'clear') {
    return 'clear'
  }

  return 'idle'
})

const trackOneStyle = computed(() => ({
  '--rail-stroke': getRailColor(resolvedTrackOneVisualState.value),
}))

const trackTwoStyle = computed(() => ({
  '--rail-stroke': getRailColor(resolvedTrackTwoVisualState.value),
}))

const blockWidth = computed(() => props.size * 20)

const innerTrackEnd = computed(() => Math.max(1, blockWidth.value - 1))

const viewBox = computed(() => `0 -20 ${blockWidth.value} 80`)

const layoutStyle = computed(() => ({
  gridColumn: `span ${props.size}`,
}))

const orientationTransform = computed(() =>
  props.orientation === 'down' ? 'translate(0,20)' : 'translate(0,0)',
)
</script>

<template>
  <div :class="[styles.component, styles.layoutItem, 'double-track']" :style="layoutStyle">
    <svg :class="styles.svgFill" :viewBox="viewBox" aria-label="Double track block">
      <g :transform="orientationTransform">
        <line x1="0" y1="-6" x2="0" y2="6" :class="[styles.blockEnd, styles.rail]" :style="trackOneStyle" />
        <line x1="1" y1="0" :x2="innerTrackEnd" y2="0" :class="[styles.straight, styles.rail]" :style="trackOneStyle" />
        <line :x1="blockWidth" y1="-6" :x2="blockWidth" y2="6" :class="[styles.blockEnd, styles.rail]" :style="trackOneStyle" />

        <line x1="0" y1="14" x2="0" y2="26" :class="[styles.blockEnd, styles.rail]" :style="trackTwoStyle" />
        <line x1="1" y1="20" :x2="innerTrackEnd" y2="20" :class="[styles.straight, styles.rail]" :style="trackTwoStyle" />
        <line :x1="blockWidth" y1="14" :x2="blockWidth" y2="26" :class="[styles.blockEnd, styles.rail]" :style="trackTwoStyle" />
      </g>
    </svg>
  </div>
</template>