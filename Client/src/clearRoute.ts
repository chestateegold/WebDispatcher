import {
  isClearRouteLayoutItem,
  isTurnoutLayoutItem,
  type ControlPointRouteDirection,
  type LayoutRowItem,
} from '@/layout/schema'

export type ClearRouteVisualState = 'idle' | 'clear' | 'occupied'

export interface ClearRouteDescriptor {
  row: LayoutRowItem[]
  occupiedItems: Record<string, boolean>
  routeStates: Record<string, boolean>
}

export function getClearRouteSourceId(turnoutId: string, direction: ControlPointRouteDirection): string {
  return `${turnoutId}:${direction}`
}

function buildInitialRouteStates(
  row: LayoutRowItem[],
  occupiedItems: Record<string, boolean>,
): Record<string, ClearRouteVisualState> {
  const states: Record<string, ClearRouteVisualState> = {}

  for (const item of row) {
    if (!isClearRouteLayoutItem(item)) {
      continue
    }

    states[item.id] = occupiedItems[item.id] ? 'occupied' : 'idle'
  }

  return states
}

function applyClearRouteFromSource(
  row: LayoutRowItem[],
  sourceIndex: number,
  direction: ControlPointRouteDirection,
  occupiedItems: Record<string, boolean>,
  states: Record<string, ClearRouteVisualState>,
): void {
  const step = direction === 'right' ? 1 : -1

  for (let index = sourceIndex + step; index >= 0 && index < row.length; index += step) {
    const item = row[index]

    if (isTurnoutLayoutItem(item)) {
      return
    }

    if (!isClearRouteLayoutItem(item)) {
      continue
    }

    if (occupiedItems[item.id]) {
      states[item.id] = 'occupied'
      return
    }

    states[item.id] = 'clear'
  }
}

export function resolveClearRoute({ row, occupiedItems, routeStates }: ClearRouteDescriptor): Record<string, ClearRouteVisualState> {
  const states = buildInitialRouteStates(row, occupiedItems)

  for (let index = 0; index < row.length; index += 1) {
    const item = row[index]

    if (!isTurnoutLayoutItem(item)) {
      continue
    }

    for (const source of item.controlPoint?.clearRouteSources ?? []) {
      if (!routeStates[getClearRouteSourceId(item.id, source.direction)]) {
        continue
      }

      applyClearRouteFromSource(row, index, source.direction, occupiedItems, states)
    }
  }

  return states
}