import {
  isClearRouteLayoutItem,
  isDoubleTrackLayoutItem,
  isTurnoutLayoutItem,
  type ControlPointRouteDirection,
  type LayoutRowItem,
} from '@/layout/schema'

export type ClearRouteVisualState = 'idle' | 'clear' | 'occupied'
export type DoubleTrackRouteTrack = 'trackOne' | 'trackTwo'

export interface DoubleTrackOccupancyState {
  trackOne: boolean
  trackTwo: boolean
}

export interface DoubleTrackClearRouteVisualState {
  trackOne: ClearRouteVisualState
  trackTwo: ClearRouteVisualState
}

export interface ResolvedClearRouteStates {
  itemStates: Record<string, ClearRouteVisualState>
  doubleTrackStates: Record<string, DoubleTrackClearRouteVisualState>
}

export interface ClearRouteDescriptor {
  row: LayoutRowItem[]
  occupiedItems: Record<string, boolean>
  occupiedDoubleTrackItems: Record<string, DoubleTrackOccupancyState>
  routeStates: Record<string, boolean>
  routeTracks: Record<string, DoubleTrackRouteTrack | undefined>
}

export function getClearRouteSourceId(turnoutId: string, direction: ControlPointRouteDirection): string {
  return `${turnoutId}:${direction}`
}

function buildInitialRouteStates(
  row: LayoutRowItem[],
  occupiedItems: Record<string, boolean>,
  occupiedDoubleTrackItems: Record<string, DoubleTrackOccupancyState>,
): ResolvedClearRouteStates {
  const itemStates: Record<string, ClearRouteVisualState> = {}
  const doubleTrackStates: Record<string, DoubleTrackClearRouteVisualState> = {}

  for (const item of row) {
    if (!isClearRouteLayoutItem(item)) {
      continue
    }

    if (isDoubleTrackLayoutItem(item)) {
      const occupiedState = occupiedDoubleTrackItems[item.id]

      doubleTrackStates[item.id] = {
        trackOne: occupiedState?.trackOne ? 'occupied' : 'idle',
        trackTwo: occupiedState?.trackTwo ? 'occupied' : 'idle',
      }

      continue
    }

    itemStates[item.id] = occupiedItems[item.id] ? 'occupied' : 'idle'
  }

  return {
    itemStates,
    doubleTrackStates,
  }
}

function applyClearRouteFromSource(
  row: LayoutRowItem[],
  sourceIndex: number,
  direction: ControlPointRouteDirection,
  occupiedItems: Record<string, boolean>,
  occupiedDoubleTrackItems: Record<string, DoubleTrackOccupancyState>,
  routeTrack: DoubleTrackRouteTrack | undefined,
  states: ResolvedClearRouteStates,
): void {
  const step = direction === 'right' ? 1 : -1
  let activeRouteTrack = routeTrack

  for (let index = sourceIndex + step; index >= 0 && index < row.length; index += step) {
    const item = row[index]

    if (isTurnoutLayoutItem(item)) {
      return
    }

    if (!isClearRouteLayoutItem(item)) {
      continue
    }

    if (isDoubleTrackLayoutItem(item)) {
      if (!activeRouteTrack) {
        continue
      }

      if (occupiedDoubleTrackItems[item.id]?.[activeRouteTrack]) {
        states.doubleTrackStates[item.id][activeRouteTrack] = 'occupied'
        return
      }

      states.doubleTrackStates[item.id][activeRouteTrack] = 'clear'
      continue
    }

    if (occupiedItems[item.id]) {
      states.itemStates[item.id] = 'occupied'
      return
    }

    states.itemStates[item.id] = 'clear'

    if (activeRouteTrack) {
      activeRouteTrack = undefined
    }
  }
}

export function resolveClearRoute({
  row,
  occupiedItems,
  occupiedDoubleTrackItems,
  routeStates,
  routeTracks,
}: ClearRouteDescriptor): ResolvedClearRouteStates {
  const states = buildInitialRouteStates(row, occupiedItems, occupiedDoubleTrackItems)

  for (let index = 0; index < row.length; index += 1) {
    const item = row[index]

    if (!isTurnoutLayoutItem(item)) {
      continue
    }

    for (const source of item.controlPoint?.clearRouteSources ?? []) {
      if (!routeStates[getClearRouteSourceId(item.id, source.direction)]) {
        continue
      }

      applyClearRouteFromSource(
        row,
        index,
        source.direction,
        occupiedItems,
        occupiedDoubleTrackItems,
        routeTracks[getClearRouteSourceId(item.id, source.direction)],
        states,
      )
    }
  }

  return states
}