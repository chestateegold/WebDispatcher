<script setup>
import { computed } from 'vue'
import { useCmriStore } from '../stores/cmri'
import Signal from './Signal.vue'
import styles from './cell.module.css'

const defaultSignals = [
  {
    id: 'single-track',
    x: 0,
    y: 45,
    label: 'Single track signal',
    facing: 'right',
  },
  {
    id: 'track-one',
    x: 60,
    y: 45,
    label: 'Track one signal',
    facing: 'left',
  },
  {
    id: 'track-two',
    x: 60,
    y: -5,
    label: 'Track two signal',
    facing: 'left',
  },
]

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
  signals: {
    type: Array,
    default: () => [],
  },
  activeSignalId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['signal-clicked'])

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
  props.orientation === 'down' ? 'translate(0,50) scale(1,-1)' : 'translate(0,-10)',
)

const occupied = computed(() => {
  const source = props.mapping?.occupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const switchReversed = computed(() => {
  const source = props.mapping?.switchPosition

  if (!source) {
    return false
  }

  return !cmriStore.getBit(source.byte, source.bit)
})

const switchNormal = computed(() => !switchReversed.value)

const turnoutSignals = computed(() =>
  props.signals.length > 0 ? props.signals : defaultSignals,
)

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

function onSignalClicked(signalId) {
  emit('signal-clicked', signalId)
}
</script>

<template>
  <div :class="[styles.component, styles.layoutItem, 'turnout', { thrown: switchReversed }]" :style="layoutStyle">
    <svg :class="styles.svgFill" viewBox="0 -20 60 80" :aria-label="ariaLabel">
      <g :transform="orientationTransform">
        <g :transform="directionTransform">
          <Signal
            v-for="signal in turnoutSignals"
            :id="signal.id"
            :key="signal.id"
            :x="signal.x"
            :y="signal.y"
            :label="signal.label"
            :aspect="activeSignalId === signal.id ? 'green' : 'red'"
            :facing="signal.facing ?? 'right'"
            :hit-width="signal.hitWidth ?? 16"
            :hit-height="signal.hitHeight ?? 16"
            @activate="onSignalClicked"
          />

          <!-- single track -->
          <line x1="0" y1="24" x2="0" y2="36" :class="[styles.blockEnd, styles.rail]" :style="singleTrackStyle" /> 
          <line x1="1" y1="30" x2="17" y2="30" :class="[styles.straight, styles.rail]" :style="singleTrackStyle" />

          <!-- track 1 -->
          <line x1="60" y1="24" x2="60" y2="36" :class="[styles.blockEnd, styles.rail]" :style="trackOneStyle" />
          <line x1="42" y1="30" x2="59" y2="30" :class="[styles.straight, styles.rail]" :style="trackOneStyle" />

          <!-- track 2 -->
          <polyline points="39,18 47,10 59,10" :class="[styles.straight, styles.rail]" :style="trackTwoStyle" /> 
          <line x1="60" y1="4" x2="60" y2="16" :class="[styles.blockEnd, styles.rail]" :style="trackTwoStyle" />

          <!-- turnout normal -->
          <line x1="17" y1="30" x2="42" y2="30" :class="[styles.straight, styles.rail, 'switch-border', 'switch-normal']" />
          <line x1="18" y1="30" x2="41" y2="30" :class="[styles.straight, styles.rail, 'switch-normal']" :style="trackOneStyle" />

          <!-- turnout reverse -->
          <polyline points="17,30 27,30 39,18" :class="[styles.straight, styles.rail, 'switch-border', 'switch-reverse']" />
          <polyline points="18,30 27,30 38,19" :class="[styles.straight, styles.rail, 'switch-reverse']" :style="trackTwoStyle" />
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