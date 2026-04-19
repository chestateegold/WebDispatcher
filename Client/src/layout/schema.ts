import type { TurnoutDirection, TurnoutOrientation } from '@/components/turnout/types'
import type { TrackBlockMapping, TurnoutMapping } from '@/types/cmri'

export const defaultLayoutItemSize = 3

export type LayoutRenderKind = 'track-block' | 'turnout'
export type ControlPointRouteDirection = 'left' | 'right'

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

export type LayoutRowItem = TrackBlockLayoutItem | TurnoutLayoutItem

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

export function isTurnoutLayoutItem(item: LayoutRowItem): item is TurnoutLayoutItem {
  return item.kind === 'turnout'
}