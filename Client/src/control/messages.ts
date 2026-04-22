import type { TurnoutDirection, TurnoutOrientation, TurnoutSignalId } from '@/components/turnout/types'
import type { ControlPointRouteDirection } from '@/layout/schema'
import type { FrontendControlMessageBase, SignalControlAction, SignalControlMessage, TurnoutCancelMessage, TurnoutToggleMessage } from '@/types/control'

const turnoutSignalIdList = ['single-track', 'track-one', 'track-two'] as const satisfies readonly TurnoutSignalId[]

interface ControlMessageContext {
  layoutId: string
  layoutItemId: string
  controlPointId: string
}

interface SignalMessageArgs extends ControlMessageContext {
  action: SignalControlAction
  signalId: string
  direction: ControlPointRouteDirection
}

interface TurnoutToggleMessageArgs extends ControlMessageContext {
  turnoutId: string
  selectedSignalId: string
}

interface TurnoutCancelMessageArgs extends ControlMessageContext {
  turnoutId: string
  selectedSignalId: string
}

interface TurnoutSignalArgs {
  signalId: TurnoutSignalId
  direction: TurnoutDirection
  orientation: TurnoutOrientation
}

function createMessageBase<TControlType extends FrontendControlMessageBase['controlType']>(
  context: ControlMessageContext,
  controlType: TControlType,
): Omit<FrontendControlMessageBase, 'controlType'> & { controlType: TControlType } {
  return {
    messageId: crypto.randomUUID(),
    layoutId: context.layoutId,
    layoutItemId: context.layoutItemId,
    controlType,
    sentAt: new Date().toISOString(),
  }
}

function flipDirection(direction: ControlPointRouteDirection): ControlPointRouteDirection {
  return direction === 'left' ? 'right' : 'left'
}

export const turnoutSignalIds = turnoutSignalIdList

export function isTurnoutSignalId(value: string): value is TurnoutSignalId {
  return turnoutSignalIdList.includes(value as TurnoutSignalId)
}

export function getAlignedTurnoutSignalId(isSwitchNormal: boolean): TurnoutSignalId {
  return isSwitchNormal ? 'track-one' : 'track-two'
}

export function shouldToggleTurnoutForSignalSelection(signalId: TurnoutSignalId, alignedSignalId: TurnoutSignalId): boolean {
  return signalId !== 'single-track' && signalId !== alignedSignalId
}

export function getTurnoutSignalSide({ signalId, direction, orientation }: TurnoutSignalArgs): ControlPointRouteDirection {
  let side: ControlPointRouteDirection = signalId === 'single-track' ? 'left' : 'right'

  if (direction === 'right') {
    side = flipDirection(side)
  }

  if (orientation === 'down') {
    side = flipDirection(side)
  }

  return side
}

export function getRouteDirectionForTurnoutSignal(args: TurnoutSignalArgs): ControlPointRouteDirection {
  return flipDirection(getTurnoutSignalSide(args))
}

export function buildSignalControlMessage(args: SignalMessageArgs): SignalControlMessage {
  return {
    ...createMessageBase(args, 'signal'),
    action: args.action,
    target: {
      signalId: args.signalId,
      direction: args.direction,
    },
    metadata: {
      controlPointId: args.controlPointId,
    },
  }
}

export function buildTurnoutToggleMessage(args: TurnoutToggleMessageArgs): TurnoutToggleMessage {
  return {
    ...createMessageBase(args, 'turnout'),
    action: 'toggle',
    target: {
      turnoutId: args.turnoutId,
      selectedSignalId: args.selectedSignalId,
    },
    metadata: {
      controlPointId: args.controlPointId,
    },
  }
}

export function buildTurnoutCancelMessage(args: TurnoutCancelMessageArgs): TurnoutCancelMessage {
  return {
    ...createMessageBase(args, 'turnout'),
    action: 'cancel',
    target: {
      turnoutId: args.turnoutId,
      selectedSignalId: args.selectedSignalId,
    },
    metadata: {
      controlPointId: args.controlPointId,
    },
  }
}