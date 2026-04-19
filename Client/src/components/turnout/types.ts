import type { CSSProperties } from 'vue'

import type { BitSourceLike, TurnoutMapping } from '@/types/cmri'

export type TurnoutDirection = 'left' | 'right'
export type TurnoutOrientation = 'up' | 'down'
export type SignalFacing = 'left' | 'right' | 'up' | 'down'
export type SignalAspect = 'red' | 'green'
export type TurnoutSignalId = 'single-track' | 'track-one' | 'track-two'

export type RailStyle = CSSProperties & Record<string, string | number>

export interface SignalLayout {
  id: TurnoutSignalId
  x: number
  y: number
  label: string
  facing: SignalFacing
  hitWidth?: number
  hitHeight?: number
}

export interface TurnoutProps {
  size?: number
  direction?: TurnoutDirection
  orientation?: TurnoutOrientation
  mapping?: TurnoutMapping
  clearLeft?: BitSourceLike | null
  clearRight?: BitSourceLike | null
  activeSignalId?: TurnoutSignalId | null
}

export interface TurnoutMappingInput {
  mapping?: TurnoutMapping
  clearLeft?: BitSourceLike | null
  clearRight?: BitSourceLike | null
}

export interface RailColorArgs {
  occupied: boolean
  switchState: boolean
  clearActive: boolean
}

export interface SignalAspectRequest {
  signalId: TurnoutSignalId
  hasClearRouteSources: boolean
  isClearLeftActive: boolean
  isClearRightActive: boolean
  activeSignalId: TurnoutSignalId | null
}