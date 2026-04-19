import {
  isTrackBlockLayoutItem,
  isTurnoutLayoutItem,
  type ControlPointRouteDirection,
  type LayoutRowItem,
} from '@/layout/schema'

export type ClearRouteVisualState = 'idle' | 'clear' | 'occupied'

export interface ClearRouteDescriptor {
  row: LayoutRowItem[]
  occupiedBlocks: Record<string, boolean>
  routeStates: Record<string, boolean>
}

export function getClearRouteSourceId(turnoutId: string, direction: ControlPointRouteDirection): string {
  return `${turnoutId}:${direction}`
}

function buildInitialBlockStates(
  row: LayoutRowItem[],
  occupiedBlocks: Record<string, boolean>,
): Record<string, ClearRouteVisualState> {
  const states: Record<string, ClearRouteVisualState> = {}

  for (const item of row) {
    if (!isTrackBlockLayoutItem(item)) {
      continue
    }

    states[item.id] = occupiedBlocks[item.id] ? 'occupied' : 'idle'
  }

  return states
}

function applyClearRouteFromSource(
  row: LayoutRowItem[],
  sourceIndex: number,
  direction: ControlPointRouteDirection,
  occupiedBlocks: Record<string, boolean>,
  states: Record<string, ClearRouteVisualState>,
): void {
  const step = direction === 'right' ? 1 : -1

  for (let index = sourceIndex + step; index >= 0 && index < row.length; index += step) {
    const item = row[index]

    if (isTurnoutLayoutItem(item)) {
      return
    }

    if (!isTrackBlockLayoutItem(item)) {
      continue
    }

    if (occupiedBlocks[item.id]) {
      states[item.id] = 'occupied'
      return
    }

    states[item.id] = 'clear'
  }
}

export function resolveClearRoute({ row, occupiedBlocks, routeStates }: ClearRouteDescriptor): Record<string, ClearRouteVisualState> {
  const states = buildInitialBlockStates(row, occupiedBlocks)

  for (let index = 0; index < row.length; index += 1) {
    const item = row[index]

    if (!isTurnoutLayoutItem(item)) {
      continue
    }

    for (const source of item.controlPoint?.clearRouteSources ?? []) {
      if (!routeStates[getClearRouteSourceId(item.id, source.direction)]) {
        continue
      }

      applyClearRouteFromSource(row, index, source.direction, occupiedBlocks, states)
    }
  }

  return states
}