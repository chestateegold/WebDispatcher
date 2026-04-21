<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'

import Crossover from '@/components/Crossover.vue'
import DoubleTrackBlock from '@/components/DoubleTrackBlock.vue'
import TrackBlock from '@/components/TrackBlock.vue'
import { getSignalAspect } from '@/components/turnout/helpers'
import Turnout from '@/components/turnout/index.vue'
import type { TurnoutSignalId } from '@/components/turnout/types'
import {
  buildSignalControlMessage,
  buildTurnoutToggleMessage,
  getAlignedTurnoutSignalId,
  getRouteDirectionForTurnoutSignal,
  isTurnoutSignalId,
  shouldToggleTurnoutForSignalSelection,
  turnoutSignalIds,
} from '@/control/messages'
import { currentLayout } from '@/layout/currentLayout'
import {
  getLayoutItemSize,
  isCrossoverLayoutItem,
  isDoubleTrackLayoutItem,
  isTurnoutLayoutItem,
  type TurnoutLayoutItem,
} from '@/layout/schema'
import type { SignalControlVisualState } from '@/types/control'
import { useCmriStore } from '@/stores/cmri'
import { useClearRouteStates } from '@/composables/useClearRouteStates'

const cmriStore = useCmriStore()
const activeLayout = currentLayout
const showGridLines = false
const signalPendingStates = ref<Record<string, Extract<SignalControlVisualState, 'request-pending' | 'cancel-pending'>>>({})

const turnoutItemsById = new Map(
  activeLayout.row
    .filter(isTurnoutLayoutItem)
    .map((item) => [item.id, item] as const),
)

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
          onSignalClicked: (signalId: TurnoutSignalId) => {
            void handleTurnoutSignalClicked(item.id, signalId)
          },
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

watchEffect(() => {
  const nextPendingStates = { ...signalPendingStates.value }
  let changed = false

  for (const [stateKey, pendingState] of Object.entries(nextPendingStates)) {
    const separatorIndex = stateKey.indexOf(':')

    if (separatorIndex < 0) {
      delete nextPendingStates[stateKey]
      changed = true
      continue
    }

    const layoutItemId = stateKey.slice(0, separatorIndex)
    const signalId = stateKey.slice(separatorIndex + 1)
    const item = turnoutItemsById.get(layoutItemId)

    if (!item || !isTurnoutSignalId(signalId)) {
      delete nextPendingStates[stateKey]
      changed = true
      continue
    }

    const isActive = isTurnoutSignalIndicatedActive(item, signalId)

    if ((pendingState === 'request-pending' && isActive) || (pendingState === 'cancel-pending' && !isActive)) {
      delete nextPendingStates[stateKey]
      changed = true
    }
  }

  if (changed) {
    signalPendingStates.value = nextPendingStates
  }
})

function getSignalStateKey(layoutItemId: string, signalId: TurnoutSignalId): string {
  return `${layoutItemId}:${signalId}`
}

function isTurnoutSwitchNormal(item: TurnoutLayoutItem): boolean {
  const switchPositionSource = item.mapping?.switchPosition

  if (!switchPositionSource) {
    return true
  }

  return cmriStore.getBit(switchPositionSource.byte, switchPositionSource.bit, switchPositionSource.array)
}

function isTurnoutSignalIndicatedActive(item: TurnoutLayoutItem, signalId: TurnoutSignalId): boolean {
  return getSignalAspect({
    signalId,
    hasClearRouteSources: (item.controlPoint?.clearRouteSources?.length ?? 0) > 0,
    isClearLeftActive: cmriStore.getAnyBit(item.mapping?.clearLeft),
    isClearRightActive: cmriStore.getAnyBit(item.mapping?.clearRight),
    direction: item.direction,
    orientation: item.orientation,
    alignedSignalId: getAlignedTurnoutSignalId(isTurnoutSwitchNormal(item)),
    activeSignalId: null,
  }) === 'green'
}

function getTurnoutSignalControlState(item: TurnoutLayoutItem, signalId: TurnoutSignalId): SignalControlVisualState {
  const pendingState = signalPendingStates.value[getSignalStateKey(item.id, signalId)]
  const isIndicatedActive = isTurnoutSignalIndicatedActive(item, signalId)

  if (pendingState === 'request-pending' && isIndicatedActive) {
    return 'active'
  }

  if (pendingState === 'cancel-pending' && !isIndicatedActive) {
    return 'idle'
  }

  if (pendingState) {
    return pendingState
  }

  return isIndicatedActive ? 'active' : 'idle'
}

async function handleTurnoutSignalClicked(layoutItemId: string, signalId: TurnoutSignalId): Promise<void> {
  const item = turnoutItemsById.get(layoutItemId)
  const controlPointId = item?.controlPoint?.id

  if (!item || !controlPointId) {
    return
  }

  const alignedSignalId = getAlignedTurnoutSignalId(isTurnoutSwitchNormal(item))

  if (shouldToggleTurnoutForSignalSelection(signalId, alignedSignalId)) {
    try {
      await cmriStore.sendControlMessage(buildTurnoutToggleMessage({
        layoutId: activeLayout.id,
        layoutItemId: item.id,
        turnoutId: item.id,
        selectedSignalId: signalId,
        controlPointId,
      }))
    }
    catch (error) {
      console.error('Failed to send turnout toggle control message.', error)
    }

    return
  }

  const currentState = getTurnoutSignalControlState(item, signalId)

  if (currentState === 'cancel-pending') {
    return
  }

  const nextAction = currentState === 'request-pending' || currentState === 'active' ? 'cancel' : 'request'
  const nextPendingState = nextAction === 'cancel' ? 'cancel-pending' : 'request-pending'
  const stateKey = getSignalStateKey(item.id, signalId)

  try {
    await cmriStore.sendControlMessage(buildSignalControlMessage({
      layoutId: activeLayout.id,
      layoutItemId: item.id,
      controlPointId,
      action: nextAction,
      signalId,
      direction: getRouteDirectionForTurnoutSignal({
        signalId,
        direction: item.direction,
        orientation: item.orientation,
      }),
    }))

    signalPendingStates.value = {
      ...signalPendingStates.value,
      [stateKey]: nextPendingState,
    }
  }
  catch (error) {
    console.error('Failed to send signal control message.', error)
  }
}
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