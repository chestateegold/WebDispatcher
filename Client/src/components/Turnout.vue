<script setup>
import { computed } from 'vue'
import { useCmriStore } from '../stores/cmri'
import styles from './cell.module.css'

const props = defineProps({
  size: {
    type: Number,
    default: 3,
    validator: (value) => Number.isInteger(value) && value >= 1,
  },
  direction: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value),
  },
  orientation: {
    type: String,
    default: 'up',
    validator: (value) => ['up', 'down'].includes(value),
  },
  mapping: {
    type: Object,
    default: () => ({}),
  },
})

const cmriStore = useCmriStore()

// Compute an effective direction so when the turnout is flipped
// over the X axis (`orientation === 'down') the visual left/right
// are treated consistently for the user. This keeps the switch
// position semantics unchanged while matching the rendered direction.
const effectiveDirection = computed(() => {
  if (props.orientation === 'down') {
    return props.direction === 'left' ? 'right' : 'left'
  }

  return props.direction
})

const directionTransform = computed(() =>
  effectiveDirection.value === 'right' ? 'translate(60,0) scale(-1,1)' : undefined,
)

const orientationTransform = computed(() =>
  props.orientation === 'down' ? 'translate(0,60) scale(1,-1)' : undefined,
)

const occupied = computed(() => {
  const source = props.mapping?.occupied

  if (!source) {
    return false
  }

  return cmriStore.getBit(source.byte, source.bit)
})

const switchReversed = computed(() => {
  const source = props.mapping?.switchPosition

  if (!source) {
    return false
  }

  return cmriStore.getBit(source.byte, source.bit)
})

const switchNormal = computed(() => !switchReversed.value)

const ariaLabel = computed(() => `${props.orientation} ${effectiveDirection.value} turnout switch`)

const activeColor = '#d33'
const idleColor = '#555'

const singleTrackStyle = computed(() => ({
  '--rail-stroke': occupied.value ? activeColor : idleColor,
}))

const trackOneStyle = computed(() => ({
  '--rail-stroke': occupied.value && switchNormal.value ? activeColor : idleColor,
}))

const trackTwoStyle = computed(() => ({
  '--rail-stroke': occupied.value && switchReversed.value ? activeColor : idleColor,
}))

const layoutStyle = computed(() => ({
  gridColumn: `span ${props.size}`,
}))
</script>

<template>
  <div :class="[styles.component, styles.layoutItem, 'turnout', { thrown: switchReversed }]" :style="layoutStyle">
    <svg :class="styles.svgFill" viewBox="0 0 60 60" :aria-label="ariaLabel">
      <g :transform="orientationTransform">
        <g :transform="directionTransform">
          <!-- single track -->
          <line x1="0" y1="24" x2="0" y2="36" :class="[styles.blockEnd, styles.rail]" :style="singleTrackStyle" /> 
          <line x1="1" y1="30" x2="10" y2="30" :class="[styles.straight, styles.rail]" :style="singleTrackStyle" />

          <!-- track 1 -->
          <line x1="60" y1="24" x2="60" y2="36" :class="[styles.blockEnd, styles.rail]" :style="trackOneStyle" />
          <line x1="35" y1="30" x2="59" y2="30" :class="[styles.straight, styles.rail]" :style="trackOneStyle" />

          <!-- track 2 -->
          <polyline points="32,18 40,10 59,10" :class="[styles.straight, styles.rail]" :style="trackTwoStyle" /> 
          <line x1="60" y1="4" x2="60" y2="16" :class="[styles.blockEnd, styles.rail]" :style="trackTwoStyle" />

          <!-- turnout normal -->
          <line x1="10" y1="30" x2="35" y2="30" :class="[styles.straight, styles.rail, 'switch-border', 'switch-normal']" />
          <line x1="11" y1="30" x2="34" y2="30" :class="[styles.straight, styles.rail, 'switch-normal']" :style="trackOneStyle" />

          <!-- turnout reverse -->
          <polyline points="10,30 20,30 32,18" :class="[styles.straight, styles.rail, 'switch-border', 'switch-reverse']" />
          <polyline points="11,30 20,30 31,19" :class="[styles.straight, styles.rail, 'switch-reverse']" :style="trackTwoStyle" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.switch-border {
  stroke: #fff;
  stroke-width: 10;
}

.turnout .switch-normal,
.turnout .switch-reverse {
  opacity: 0;
}

.turnout:not(.thrown) .switch-normal {
  opacity: 1;
}

.turnout.thrown .switch-reverse {
  opacity: 1;
}
</style>