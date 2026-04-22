import type { ControlPointRouteDirection } from '@/layout/schema'

export type FrontendControlType = 'signal' | 'turnout'
export type SignalControlAction = 'request' | 'cancel'
export type TurnoutControlAction = 'toggle' | 'cancel'
export type SignalControlVisualState = 'idle' | 'request-pending' | 'active' | 'cancel-pending'

export interface FrontendControlMessageBase {
  messageId: string
  layoutId: string
  layoutItemId: string
  controlType: FrontendControlType
  sentAt: string
}

export interface FrontendControlMetadata {
  controlPointId: string
}

export interface SignalControlMessage extends FrontendControlMessageBase {
  controlType: 'signal'
  action: SignalControlAction
  target: {
    signalId: string
    direction: ControlPointRouteDirection
  }
  metadata: FrontendControlMetadata
}

export interface TurnoutToggleMessage extends FrontendControlMessageBase {
  controlType: 'turnout'
  action: 'toggle'
  target: {
    turnoutId: string
    selectedSignalId: string
  }
  metadata: FrontendControlMetadata
}

export interface TurnoutCancelMessage extends FrontendControlMessageBase {
  controlType: 'turnout'
  action: 'cancel'
  target: {
    turnoutId: string
    selectedSignalId: string
  }
  metadata: FrontendControlMetadata
}

export type FrontendControlMessage = SignalControlMessage | TurnoutToggleMessage | TurnoutCancelMessage