<script setup>
/* Turnout wrapper moved into a folder. */
import styles from '../cell.module.css'

const signalLayouts = {
  right: [
    { id: 'single-track', x: 0, y: 15, label: 'Single track signal', facing: 'left' },
    { id: 'track-one', x: 60, y: 45, label: 'Track one signal', facing: 'right' },
    { id: 'track-two', x: 60, y: -5, label: 'Track two signal', facing: 'right' },
  ],
  left: [
    { id: 'single-track', x: 0, y: 45, label: 'Single track signal', facing: 'right' },
    { id: 'track-one', x: 60, y: -5, label: 'Track one signal', facing: 'left' },
    { id: 'track-two', x: 60, y: 45, label: 'Track two signal', facing: 'left' },
  ],
}

const props = defineProps({
  size: { type: Number, default: 3, validator: (v) => Number.isInteger(v) && v >= 1 },
  direction: { type: String, default: 'left', validator: (v) => ['left', 'right'].includes(v) },
  orientation: { type: String, default: 'up', validator: (v) => ['up', 'down'].includes(v) },
  mapping: { type: Object, default: () => ({}) },
  clearLeft: { type: [Object, Array], default: null },
  clearRight: { type: [Object, Array], default: null },
  activeSignalId: { type: String, default: null },
})

const emit = defineEmits(['signal-clicked'])

const {
  occupied,
  switchNormal,
  switchReversed,
  clearLeftActive,
  clearRightActive,
  hasClearRouteSources,
} = useTurnoutMapping(props)

// Keep logical direction unchanged; use rotation for `down` orientation
const effectiveDirection = computed(() => props.direction)
const directionTransform = computed(() =>
  effectiveDirection.value === 'right' ? 'translate(60,0) scale(-1,1)' : undefined,
)
const isHorizontallyMirrored = computed(() => effectiveDirection.value === 'right')

// Rotate 180deg about the viewBox center (viewBox is "0 -20 60 80" -> center 30,20)
// Small translate to align baseline; rotated variant moved up 5px (translate 10) from previous 15.
const orientationTransform = computed(() =>
  props.orientation === 'down' ? 'translate(0,10) rotate(180 30 20)' : 'translate(0,-10)',
)

const signalPositions = computed(() => {
  return signalLayouts[props.direction] ?? signalLayouts.right
})

const ariaLabel = computed(() => `${props.orientation} ${effectiveDirection.value} turnout switch`)

const occupiedColor = '#d33'
const clearColor = '#2fbf71'
const idleColor = '#555'

const singleTrackStyle = computed(() => ({
  '--rail-stroke': occupied.value
    ? occupiedColor
    : clearLeftActive.value || clearRightActive.value
      ? clearColor
      : idleColor,
}))

const trackOneStyle = computed(() => ({
  '--rail-stroke': occupied.value && switchNormal.value
    ? occupiedColor
    : clearLeftActive.value
      ? clearColor
      : idleColor,
}))

const trackTwoStyle = computed(() => ({
  '--rail-stroke': occupied.value && switchReversed.value
    ? occupiedColor
    : clearRightActive.value
      ? clearColor
      : idleColor,
}))

const layoutStyle = computed(() => ({ gridColumn: `span ${props.size}` }))

function getRenderedFacing(facing) {
  let result = facing

  // With the whole turnout rotating around its center for `down`,
  // the signal glyph rotates with the turnout. Only compensate for
  // the horizontal mirror used by `direction === 'right'`.
  if (isHorizontallyMirrored.value) {
    if (result === 'left') return 'right'
    if (result === 'right') return 'left'
  }
  return result
}

function getSignalAspect(signalId) {
  if (hasClearRouteSources.value) {
    if (signalId === 'single-track') {
      return clearLeftActive.value || clearRightActive.value ? 'green' : 'red'
    }
    if (signalId === 'track-one') {
      return clearLeftActive.value ? 'green' : 'red'
    }
    if (signalId === 'track-two') {
      return clearRightActive.value ? 'green' : 'red'
    }
  }
  return props.activeSignalId === signalId ? 'green' : 'red'
}

function onSignalClicked(signalId) {
  emit('signal-clicked', signalId)
}
</script>

<template>
  <div :class="[styles.component, styles.layoutItem]" :style="layoutStyle">
    <svg :class="styles.svgFill" viewBox="0 -20 60 80" :aria-label="ariaLabel">
      <g :transform="orientationTransform">
        <g :transform="directionTransform">
          <Signal v-for="signal in signalPositions" :id="signal.id" :key="signal.id" :x="signal.x" :y="signal.y"
            :label="signal.label" :aspect="getSignalAspect(signal.id)"
            :facing="getRenderedFacing(signal.facing ?? 'right')" :hit-width="signal.hitWidth ?? 16" :hit-height="signal.hitHeight ?? 16"
            @activate="onSignalClicked" />

          <Geometry :thrown="switchReversed" :single-track-style="singleTrackStyle" :track-one-style="trackOneStyle"
            :track-two-style="trackTwoStyle" />
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
</style>
