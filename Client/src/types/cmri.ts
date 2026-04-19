export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'error' | 'disconnected'

export type FrameName = 'indications' | 'derivedIndications'

export interface BitSource {
  byte: number
  bit: number
  array?: FrameName
}

export type BitSourceLike = BitSource | BitSource[]

export interface TrackBlockMapping {
  occupied?: BitSourceLike
}

export interface DoubleTrackBlockMapping {
  trackOneOccupied?: BitSourceLike
  trackTwoOccupied?: BitSourceLike
}

export interface CrossoverMapping {
  mainOccupied?: BitSourceLike
  crossingOccupied?: BitSourceLike
}

export interface TurnoutMapping {
  occupied?: BitSourceLike
  switchPosition?: BitSource
  clearLeft?: BitSourceLike
  clearRight?: BitSourceLike
}

export interface FrameEnvelope {
  indications: number[]
  derivedIndications: number[]
}