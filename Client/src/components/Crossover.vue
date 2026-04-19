<script setup>
import styles from './cell.module.css'

const props = defineProps({
  size: {
    type: Number,
    default: 3,
    validator: (value) => Number.isInteger(value) && value >= 1,
  },
  orientation: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value),
  },
  mapping: {
    type: Object,
    default: () => ({}),
  },
})

const cmriStore = useCmriStore()

const geometryTransform = computed(() =>
  props.orientation === 'right' ? 'translate(100,0) scale(-1,1)' : undefined,
)

const ariaLabel = computed(() => `${props.orientation} crossover track`)

const mainOccupied = computed(() => {
  const source = props.mapping?.mainOccupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const crossingOccupied = computed(() => {
  const source = props.mapping?.crossingOccupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const diamondOccupied = computed(() => mainOccupied.value || crossingOccupied.value)

const activeColor = '#d33'
const idleColor = '#555'

const mainTrackStyle = computed(() => ({
  '--rail-stroke': mainOccupied.value ? activeColor : idleColor,
  '--rail-fill': mainOccupied.value ? activeColor : idleColor,
}))

const crossingTrackStyle = computed(() => ({
  '--rail-stroke': crossingOccupied.value ? activeColor : idleColor,
  '--rail-fill': crossingOccupied.value ? activeColor : idleColor,
}))

const diamondStyle = computed(() => ({
  '--rail-stroke': diamondOccupied.value ? activeColor : idleColor,
  '--rail-fill': diamondOccupied.value ? activeColor : idleColor,
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

        <polygon points="1,6 21,6 29,14 1,14" :class="[styles.polyline, styles.rail]" :style="mainTrackStyle" />

        <polygon points="31,6 59,6 59,14 39,14" :class="[styles.polyline, styles.rail]" :style="mainTrackStyle" />

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