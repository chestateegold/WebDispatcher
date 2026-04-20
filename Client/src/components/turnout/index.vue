<script setup lang="ts">
/* Turnout wrapper moved into a folder. */
import styles from '../cell.module.css'
import { clearColor, idleColor, occupiedColor } from '@/components/constants'
import { signalLayouts } from './constants'
import { getSignalAspect } from './helpers'
import type { RailColorArgs, RailStyle, SignalFacing, TurnoutProps, TurnoutSignalId } from './types'
import { useTurnoutMapping } from './useTurnoutMapping'

const props = withDefaults(defineProps<TurnoutProps>(), {
  size: 3,
  direction: 'left',
  orientation: 'up',
  mapping: () => ({}),
  activeSignalId: null,
})

const emit = defineEmits<{ 'signal-clicked': [signalId: TurnoutSignalId] }>()

// Store / mapping
const {
  isOccupied,
  isSwitchNormal,
  isSwitchReversed,
  isClearLeftActive,
  isClearRightActive,
  hasClearRouteSources,
} = useTurnoutMapping(props)

// Transforms
// Keep logical direction unchanged; use rotation for `down` orientation
const effectiveDirection = computed(() => props.direction)
const isHorizontallyMirrored = computed(() => effectiveDirection.value === 'right')

// Compose the view transform in one place so the template only needs a single <g>.
const viewTransform = computed(() => {
  const transforms = []

  if (props.orientation === 'down') {
    // Rotate about the SVG viewBox center and nudge into position.
    transforms.push('translate(0,10)', 'rotate(180 30 20)')
  } else {
    transforms.push('translate(0,-10)')
  }

  if (effectiveDirection.value === 'right') {
    transforms.push('translate(60,0) scale(-1,1)')
  }

  return transforms.join(' ')
})

const signalPositions = computed(() => {
  return signalLayouts[props.direction] ?? signalLayouts.right
})

const ariaLabel = computed(() => `${props.orientation} ${effectiveDirection.value} turnout switch`)
const hasActiveClearRoute = computed(() => isClearLeftActive.value || isClearRightActive.value)
const alignedSignalId = computed<TurnoutSignalId>(() => (isSwitchNormal.value ? 'track-one' : 'track-two'))

// Color logic
function railColor({ occupied, switchState, clearActive }: RailColorArgs): string {
  if (occupied && switchState) {
    return occupiedColor
  }

  if (clearActive) {
    return clearColor
  }

  return idleColor
}

const singleTrackStyle = computed<RailStyle>(() => {
  return {
    '--rail-stroke': railColor({
      occupied: isOccupied.value,
      switchState: true,
      clearActive: hasActiveClearRoute.value,
    }),
  }
})

const trackOneStyle = computed<RailStyle>(() => {
  return {
    '--rail-stroke': railColor({
      occupied: isOccupied.value,
      switchState: isSwitchNormal.value,
      clearActive: hasActiveClearRoute.value && isSwitchNormal.value,
    }),
  }
})

const trackTwoStyle = computed<RailStyle>(() => {
  return {
    '--rail-stroke': railColor({
      occupied: isOccupied.value,
      switchState: isSwitchReversed.value,
      clearActive: hasActiveClearRoute.value && isSwitchReversed.value,
    }),
  }
})

const layoutStyle = computed(() => ({ gridColumn: `span ${props.size}` }))

// Helpers
function getRenderedFacing(facing: SignalFacing): SignalFacing {
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

function getSignalAspectForId(signalId: TurnoutSignalId) {
  return getSignalAspect({
    signalId,
    hasClearRouteSources: hasClearRouteSources.value,
    isClearLeftActive: isClearLeftActive.value,
    isClearRightActive: isClearRightActive.value,
    direction: props.direction,
    orientation: props.orientation,
    alignedSignalId: alignedSignalId.value,
    activeSignalId: props.activeSignalId,
  })
}

function isTurnoutSignalId(signalId: string): signalId is TurnoutSignalId {
  return signalId === 'single-track' || signalId === 'track-one' || signalId === 'track-two'
}

function onSignalClicked(signalId: string) {
  if (!isTurnoutSignalId(signalId)) {
    return
  }

  emit('signal-clicked', signalId)
}
</script>

<template>
  <!-- Template -->
  <div :class="[styles.component, styles.layoutItem]" :style="layoutStyle">
    <svg :class="styles.svgFill" viewBox="0 -20 60 80" :aria-label="ariaLabel">
      <g :transform="viewTransform">
        <Signal v-for="signal in signalPositions" :id="signal.id" :key="signal.id" :x="signal.x" :y="signal.y"
          :label="signal.label" :aspect="getSignalAspectForId(signal.id)"
          :facing="getRenderedFacing(signal.facing ?? 'right')" :hit-width="signal.hitWidth ?? 16" :hit-height="signal.hitHeight ?? 16"
          @activate="onSignalClicked" />

        <Geometry :thrown="isSwitchReversed" :single-track-style="singleTrackStyle" :track-one-style="trackOneStyle"
          :track-two-style="trackTwoStyle" />
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
