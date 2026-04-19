export type ClearRouteVisualState = 'idle' | 'clear' | 'occupied'

export interface ClearRouteBlock {
  id: string
  occupied: boolean
}

export interface ClearRouteDescriptor {
  isClear: boolean
  blocks: ClearRouteBlock[]
}

export function resolveClearRoute({ isClear, blocks }: ClearRouteDescriptor): Record<string, ClearRouteVisualState> {
  const states: Record<string, ClearRouteVisualState> = {}
  let propagationStopped = !isClear

  for (const block of blocks) {
    if (block.occupied) {
      states[block.id] = 'occupied'
      propagationStopped = true
      continue
    }

    states[block.id] = propagationStopped ? 'idle' : 'clear'
  }

  return states
}