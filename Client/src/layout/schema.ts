import type { TurnoutDirection, TurnoutOrientation } from '@/components/turnout/types'
import type { CrossoverMapping, DoubleTrackBlockMapping, TrackBlockMapping, TurnoutMapping } from '@/types/cmri'

export const defaultLayoutItemSize = 3

export type LayoutRenderKind = 'track-block' | 'turnout' | 'crossover' | 'double-track'
export type ControlPointRouteDirection = 'left' | 'right'
export type CrossoverOrientation = 'left' | 'right'
export type DoubleTrackOrientation = 'up' | 'down'

interface LayoutRowItemBase {
  id: string
  kind: LayoutRenderKind
  size?: number
}

export interface TrackBlockLayoutItem extends LayoutRowItemBase {
  kind: 'track-block'
  mapping?: TrackBlockMapping
  blockEndLeft?: boolean
  blockEndRight?: boolean
}

export interface CrossoverLayoutItem extends LayoutRowItemBase {
  kind: 'crossover'
  orientation?: CrossoverOrientation
  mapping?: CrossoverMapping
}

export interface DoubleTrackLayoutItem extends LayoutRowItemBase {
  kind: 'double-track'
  orientation?: DoubleTrackOrientation
  mapping?: DoubleTrackBlockMapping
}

export interface TurnoutClearRouteSource {
  direction: ControlPointRouteDirection
}

export interface TurnoutControlPointMetadata {
  clearRouteSources?: TurnoutClearRouteSource[]
}

export interface TurnoutLayoutItem extends LayoutRowItemBase {
  kind: 'turnout'
  direction: TurnoutDirection
  orientation: TurnoutOrientation
  mapping?: TurnoutMapping
  controlPoint?: TurnoutControlPointMetadata
}

export type ClearRouteLayoutItem = TrackBlockLayoutItem | CrossoverLayoutItem | DoubleTrackLayoutItem
export type LayoutRowItem = TrackBlockLayoutItem | CrossoverLayoutItem | DoubleTrackLayoutItem | TurnoutLayoutItem

export interface LayoutDefinition {
  id: string
  row: LayoutRowItem[]
}

export function getLayoutItemSize(item: LayoutRowItem): number {
  return item.size ?? defaultLayoutItemSize
}

export function isTrackBlockLayoutItem(item: LayoutRowItem): item is TrackBlockLayoutItem {
  return item.kind === 'track-block'
}

export function isCrossoverLayoutItem(item: LayoutRowItem): item is CrossoverLayoutItem {
  return item.kind === 'crossover'
}

export function isDoubleTrackLayoutItem(item: LayoutRowItem): item is DoubleTrackLayoutItem {
  return item.kind === 'double-track'
}

export function isClearRouteLayoutItem(item: LayoutRowItem): item is ClearRouteLayoutItem {
  return isTrackBlockLayoutItem(item) || isCrossoverLayoutItem(item) || isDoubleTrackLayoutItem(item)
}

export function isTurnoutLayoutItem(item: LayoutRowItem): item is TurnoutLayoutItem {
  return item.kind === 'turnout'
}