import type { SignalAspect, SignalAspectRequest, TurnoutSignalId } from './types'

function getLeftSideSignalId(direction: SignalAspectRequest['direction'], alignedSignalId: TurnoutSignalId): TurnoutSignalId {
  return direction === 'left' ? 'single-track' : alignedSignalId
}

function getRightSideSignalId(direction: SignalAspectRequest['direction'], alignedSignalId: TurnoutSignalId): TurnoutSignalId {
  return direction === 'left' ? alignedSignalId : 'single-track'
}

// Small turnout-specific helpers stay here so the component reads top-to-bottom.
export function getSignalAspect({
  signalId,
  hasClearRouteSources,
  isClearLeftActive,
  isClearRightActive,
  direction,
  orientation,
  alignedSignalId,
  activeSignalId,
}: SignalAspectRequest): SignalAspect {
  if (hasClearRouteSources) {
    const leftSideSignalId = orientation === 'down'
      ? getRightSideSignalId(direction, alignedSignalId)
      : getLeftSideSignalId(direction, alignedSignalId)

    const rightSideSignalId = orientation === 'down'
      ? getLeftSideSignalId(direction, alignedSignalId)
      : getRightSideSignalId(direction, alignedSignalId)

    if (isClearRightActive && signalId === leftSideSignalId) {
      return 'green'
    }

    if (isClearLeftActive && signalId === rightSideSignalId) {
      return 'green'
    }

    return 'red'
  }

  return activeSignalId === signalId ? 'green' : 'red'
}