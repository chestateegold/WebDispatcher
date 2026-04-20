import { computed } from 'vue'

import { getClearRouteSourceId, resolveClearRoute, type ClearRouteVisualState } from '@/clearRoute'
import { isClearRouteLayoutItem, isTurnoutLayoutItem, type ClearRouteLayoutItem, type LayoutRowItem } from '@/layout/schema'
import type { BitSourceLike, TurnoutMapping } from '@/types/cmri'

interface UseClearRouteStatesOptions {
  row: LayoutRowItem[]
  getBitSourceValue: (source: BitSourceLike | undefined) => boolean
}

export function useClearRouteStates({ row, getBitSourceValue }: UseClearRouteStatesOptions) {
  const occupiedRouteItemStates = computed(() => {
    const states: Record<string, boolean> = {}

    for (const item of row) {
      if (!isClearRouteLayoutItem(item)) {
        continue
      }

      states[item.id] = isClearRouteItemOccupied(item, getBitSourceValue)
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

  const clearRouteStates = computed(() => {
    return resolveClearRoute({
      row,
      occupiedItems: occupiedRouteItemStates.value,
      routeStates: clearRouteSourceStates.value,
    })
  })

  function getLayoutItemVisualState(itemId: string): ClearRouteVisualState | undefined {
    return clearRouteStates.value[itemId]
  }

  return {
    occupiedRouteItemStates,
    clearRouteSourceStates,
    clearRouteStates,
    getLayoutItemVisualState,
  }
}

function isClearRouteItemOccupied(
  item: ClearRouteLayoutItem,
  getBitSourceValue: (source: BitSourceLike | undefined) => boolean,
): boolean {
  if (item.kind === 'track-block') {
    return getBitSourceValue(item.mapping?.occupied)
  }

  return getBitSourceValue(item.mapping?.mainOccupied) || getBitSourceValue(item.mapping?.crossingOccupied)
}

function getTurnoutClearRouteSource(
  mapping: TurnoutMapping | undefined,
  direction: 'left' | 'right',
): BitSourceLike | undefined {
  return direction === 'left' ? mapping?.clearLeft : mapping?.clearRight
}