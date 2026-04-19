import type { SignalAspect, SignalAspectRequest } from './types'

// Small turnout-specific helpers stay here so the component reads top-to-bottom.
export function getSignalAspect({
  signalId,
  hasClearRouteSources,
  isClearLeftActive,
  isClearRightActive,
  activeSignalId,
}: SignalAspectRequest): SignalAspect {
  if (hasClearRouteSources) {
    if (signalId === 'single-track') {
      return isClearLeftActive || isClearRightActive ? 'green' : 'red'
    }

    if (signalId === 'track-one') {
      return isClearLeftActive ? 'green' : 'red'
    }

    if (signalId === 'track-two') {
      return isClearRightActive ? 'green' : 'red'
    }
  }

  return activeSignalId === signalId ? 'green' : 'red'
}