import { computed } from 'vue'

import {
  getClearRouteSourceId,
  resolveClearRoute,
  type ClearRouteVisualState,
  type DoubleTrackClearRouteVisualState,
  type DoubleTrackOccupancyState,
  type DoubleTrackRouteTrack,
} from '@/clearRoute'
import {
  isClearRouteLayoutItem,
  isDoubleTrackLayoutItem,
  isTurnoutLayoutItem,
  type ClearRouteLayoutItem,
  type LayoutRowItem,
  type TurnoutLayoutItem,
} from '@/layout/schema'
import type { BitSourceLike, TurnoutMapping } from '@/types/cmri'

interface UseClearRouteStatesOptions {
  row: LayoutRowItem[]
  getBitSourceValue: (source: BitSourceLike | undefined) => boolean
}

export function useClearRouteStates({ row, getBitSourceValue }: UseClearRouteStatesOptions) {
  const occupiedRouteItemStates = computed(() => {
    const states: Record<string, boolean> = {}

    for (const item of row) {
      if (!isClearRouteLayoutItem(item) || isDoubleTrackLayoutItem(item)) {
        continue
      }

      states[item.id] = isClearRouteItemOccupied(item, getBitSourceValue)
    }

    return states
  })

  const occupiedDoubleTrackStates = computed(() => {
    const states: Record<string, DoubleTrackOccupancyState> = {}

    for (const item of row) {
      if (!isDoubleTrackLayoutItem(item)) {
        continue
      }

      states[item.id] = {
        trackOne: getBitSourceValue(item.mapping?.trackOneOccupied),
        trackTwo: getBitSourceValue(item.mapping?.trackTwoOccupied),
      }
    }

    return states
  })

  const clearRouteSourceStates = computed(() => {
    const states: Record<string, boolean> = {}

    for (const item of row) {
      if (!isTurnoutLayoutItem(item)) {
        continue
      }

      for (const source of item.controlPoint?.clearRouteSources ?? []) {
        states[getClearRouteSourceId(item.id, source.direction)] = getBitSourceValue(
          getTurnoutClearRouteSource(item.mapping, source.direction),
        )
      }
    }

    return states
  })

  const clearRouteSourceTracks = computed(() => {
    const states: Record<string, DoubleTrackRouteTrack | undefined> = {}

    for (const item of row) {
      if (!isTurnoutLayoutItem(item)) {
        continue
      }

      for (const source of item.controlPoint?.clearRouteSources ?? []) {
        states[getClearRouteSourceId(item.id, source.direction)] = getTurnoutRouteTrack(
          item,
          source.direction,
          getBitSourceValue,
        )
      }
    }

    return states
  })

  const resolvedClearRouteStates = computed(() => {
    return resolveClearRoute({
      row,
      occupiedItems: occupiedRouteItemStates.value,
      occupiedDoubleTrackItems: occupiedDoubleTrackStates.value,
      routeStates: clearRouteSourceStates.value,
      routeTracks: clearRouteSourceTracks.value,
    })
  })

  const clearRouteStates = computed(() => resolvedClearRouteStates.value.itemStates)

  const doubleTrackClearRouteStates = computed(() => resolvedClearRouteStates.value.doubleTrackStates)

  function getLayoutItemVisualState(itemId: string): ClearRouteVisualState | undefined {
    return clearRouteStates.value[itemId]
  }

  function getDoubleTrackItemVisualState(itemId: string): DoubleTrackClearRouteVisualState | undefined {
    return doubleTrackClearRouteStates.value[itemId]
  }

  return {
    occupiedRouteItemStates,
    occupiedDoubleTrackStates,
    clearRouteSourceStates,
    clearRouteSourceTracks,
    clearRouteStates,
    doubleTrackClearRouteStates,
    resolvedClearRouteStates,
    getLayoutItemVisualState,
    getDoubleTrackItemVisualState,
  }
}

function isClearRouteItemOccupied(
  item: ClearRouteLayoutItem,
  getBitSourceValue: (source: BitSourceLike | undefined) => boolean,
): boolean {
  if (item.kind === 'track-block') {
    return getBitSourceValue(item.mapping?.occupied)
  }

  if (item.kind === 'double-track') {
    return getBitSourceValue(item.mapping?.trackOneOccupied) || getBitSourceValue(item.mapping?.trackTwoOccupied)
  }

  return getBitSourceValue(item.mapping?.mainOccupied) || getBitSourceValue(item.mapping?.crossingOccupied)
}

function getTurnoutRouteTrack(
  item: TurnoutLayoutItem,
  direction: 'left' | 'right',
  getBitSourceValue: (source: BitSourceLike | undefined) => boolean,
): DoubleTrackRouteTrack | undefined {
  const doubleTrackSide = item.direction === 'left' ? 'right' : 'left'

  if (direction !== doubleTrackSide) {
    return undefined
  }

  return isTurnoutSwitchReversed(item.mapping, getBitSourceValue) ? 'trackOne' : 'trackTwo'
}

function isTurnoutSwitchReversed(
  mapping: TurnoutMapping | undefined,
  getBitSourceValue: (source: BitSourceLike | undefined) => boolean,
): boolean {
  const source = mapping?.switchPosition

  if (!source) {
    return false
  }

  return !getBitSourceValue(source)
}

function getTurnoutClearRouteSource(
  mapping: TurnoutMapping | undefined,
  direction: 'left' | 'right',
): BitSourceLike | undefined {
  return direction === 'left' ? mapping?.clearLeft : mapping?.clearRight
}