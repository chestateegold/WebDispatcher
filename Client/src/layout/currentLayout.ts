import type { LayoutDefinition } from './schema'

export const currentLayout: LayoutDefinition = {
  id: 'current-single-row',
  row: [
    {
      id: 'double-track-west',
      kind: 'double-track',
      size: 2,
      mapping: {
        trackOneOccupied: { byte: 1, bit: 4 },
        trackTwoOccupied: { byte: 1, bit: 5 },
      },
    },
    {
      id: 'turnout-one',
      kind: 'turnout',
      size: 3,
      direction: 'right',
      orientation: 'up',
      mapping: {
        occupied: [{ byte: 1, bit: 0 }, { byte: 1, bit: 1 }],
        switchPosition: { byte: 1, bit: 3 },
        clearLeft: {
          byte: 0,
          bit: 0,
          array: 'derivedIndications',
        },
        clearRight: {
          byte: 0,
          bit: 1,
          array: 'derivedIndications',
        },
      },
      controlPoint: {
        clearRouteSources: [{ direction: 'left' }, { direction: 'right' }],
      },
    },
    {
      id: 'block-one',
      kind: 'track-block',
      size: 2,
      mapping: {
        occupied: { byte: 2, bit: 3 },
      },
    },
    {
      id: 'block-two',
      kind: 'track-block',
      size: 2,
      mapping: {
        occupied: { byte: 2, bit: 2 },
      },
    },
    {
      id: 'crossover-one',
      kind: 'crossover',
      size: 3,
      orientation: 'left',
      mapping: {
        mainOccupied: { byte: 2, bit: 0 },
        crossingOccupied: { byte: 2, bit: 1 },
      },
    },
    {
      id: 'block-three',
      kind: 'track-block',
      size: 2,
      mapping: {
        occupied: { byte: 1, bit: 2 },
      },
    },
    {
      id: 'turnout-two',
      kind: 'turnout',
      size: 3,
      direction: 'left',
      orientation: 'up',
      mapping: {
        occupied: { byte: 0, bit: 0 },
        switchPosition: { byte: 0, bit: 3 },
        clearLeft: {
          byte: 0,
          bit: 2,
          array: 'derivedIndications',
        },
        clearRight: {
          byte: 0,
          bit: 3,
          array: 'derivedIndications',
        },
      },
      controlPoint: {
        clearRouteSources: [{ direction: 'left' }, { direction: 'right' }],
      },
    },
    {
      id: 'double-track-east',
      kind: 'double-track',
      size: 2,
      mapping: {
        trackOneOccupied: { byte: 2, bit: 4 },
        trackTwoOccupied: { byte: 2, bit: 5 },
      },
    },
  ],
}