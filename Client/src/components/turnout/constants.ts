import type { SignalLayout, TurnoutDirection } from './types'

// Shared turnout layout and visual constants live here to keep the component focused on behavior.
export const signalLayouts: Record<TurnoutDirection, SignalLayout[]> = {
  right: [
    { id: 'single-track', x: 0, y: 15, label: 'Single track signal', facing: 'left' },
    { id: 'track-one', x: 60, y: 45, label: 'Track one signal', facing: 'right' },
    { id: 'track-two', x: 60, y: -5, label: 'Track two signal', facing: 'right' },
  ],
  left: [
    { id: 'single-track', x: 0, y: 45, label: 'Single track signal', facing: 'right' },
    { id: 'track-two', x: 60, y: -5, label: 'Track two signal', facing: 'left' },
    { id: 'track-one', x: 60, y: 45, label: 'Track one signal', facing: 'left' },
  ],
}

//TODO: move these into a constant file more easily accessible by other components
export const occupiedColor = '#d33'
export const clearColor = '#00b050'
export const idleColor = '#555'