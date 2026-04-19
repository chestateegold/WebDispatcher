import { ref } from 'vue'
import { defineStore } from 'pinia'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'

import type { BitSource, BitSourceLike, ConnectionState, FrameEnvelope, FrameName } from '@/types/cmri'

const FRAME_SIZE = 3
const EMPTY_FRAME = [0, 0, 0] as const
const RECONNECT_DELAY_MS = 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isBitSource(value: unknown): value is BitSource {
  return isRecord(value)
    && Number.isInteger(value.byte)
    && Number.isInteger(value.bit)
    && (value.array === undefined || value.array === 'indications' || value.array === 'derivedIndications')
}

function normalizeFramePayload(payload: unknown): number[] {
  if (Array.isArray(payload)) {
    return payload.filter((value): value is number => typeof value === 'number' && Number.isInteger(value))
  }

  if (payload instanceof Uint8Array) {
    return Array.from(payload)
  }

  if (typeof payload === 'string') {
    try {
      const decoded = atob(payload)

      return Array.from(decoded, (char) => char.charCodeAt(0))
    }
    catch {
      return []
    }
  }

  if (isRecord(payload)) {
    return Object.values(payload).filter((value): value is number => typeof value === 'number' && Number.isInteger(value))
  }

  return []
}

function normalizeEnvelopePayload(payload: unknown): FrameEnvelope {
  if (isRecord(payload) && ('indications' in payload || 'derivedIndications' in payload)) {
    return {
      indications: normalizeFramePayload(payload.indications),
      derivedIndications: normalizeFramePayload(payload.derivedIndications),
    }
  }

  return {
    indications: normalizeFramePayload(payload),
    derivedIndications: [],
  }
}

function normalizeBitSources(source: BitSourceLike | null | undefined): BitSource[] {
  if (Array.isArray(source)) {
    return source.filter(isBitSource)
  }

  if (isBitSource(source)) {
    return [source]
  }

  return []
}

export const useCmriStore = defineStore('cmri', () => {
  const indications = ref<number[]>([...EMPTY_FRAME])
  const derivedIndications = ref<number[]>([...EMPTY_FRAME])
  const bytes = indications
  const connectionState = ref<ConnectionState>('disconnected')
  let connectionPromise: Promise<void> | null = null
  let reconnectTimer: number | null = null
  let shouldStayConnected = false

  const connection = new HubConnectionBuilder()
    .withUrl('/cmriHub')
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()

  connection.on('ReceiveMessage', (payload: unknown) => {
    setFrame(normalizeEnvelopePayload(payload))
  })

  connection.onreconnecting(() => {
    connectionState.value = 'reconnecting'
  })

  connection.onreconnected(() => {
    connectionState.value = 'connected'
  })

  connection.onclose(() => {
    clearReconnectTimer()
    connectionState.value = 'disconnected'
    connectionPromise = null

    if (shouldStayConnected) {
      scheduleReconnect()
    }
  })

  function clearReconnectTimer() {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function scheduleReconnect() {
    if (!shouldStayConnected || reconnectTimer !== null) {
      return
    }

    connectionState.value = 'reconnecting'
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null
      void startConnection()
    }, RECONNECT_DELAY_MS)
  }

  function normalizeStoredFrame(nextBytes: number[]): number[] {
    const normalized = nextBytes.slice(0, FRAME_SIZE)

    return EMPTY_FRAME.map((fallback, index) => {
      const value = normalized[index]

      return Number.isInteger(value) ? value & 0xff : fallback
    })
  }

  function setFrame(nextPayload: unknown) {
    const envelope = normalizeEnvelopePayload(nextPayload)

    indications.value = normalizeStoredFrame(envelope.indications)
    derivedIndications.value = normalizeStoredFrame(envelope.derivedIndications)
  }

  async function startConnection(): Promise<void> {
    if (connection.state === HubConnectionState.Connected) {
      connectionState.value = 'connected'
      return
    }

    if (connection.state === HubConnectionState.Connecting || connection.state === HubConnectionState.Reconnecting) {
      return connectionPromise ?? Promise.resolve()
    }

    if (connectionPromise) {
      return connectionPromise
    }

    clearReconnectTimer()
    connectionState.value = connectionState.value === 'reconnecting' ? 'reconnecting' : 'connecting'
    connectionPromise = connection.start()
      .then(() => {
        connectionState.value = 'connected'
        connectionPromise = null
      })
      .catch((error: unknown) => {
        connectionPromise = null

        if (shouldStayConnected) {
          scheduleReconnect()
          return
        }

        connectionState.value = 'error'
        throw error
      })

    return connectionPromise
  }

  async function connect(): Promise<void> {
    shouldStayConnected = true
    return startConnection()
  }

  async function disconnect(): Promise<void> {
    shouldStayConnected = false
    connectionPromise = null
    clearReconnectTimer()

    if (connection.state === HubConnectionState.Disconnected) {
      connectionState.value = 'disconnected'
      return
    }

    await connection.stop()
    connectionState.value = 'disconnected'
  }

  function getFrame(frameName: FrameName = 'indications'): number[] {
    return frameName === 'derivedIndications' ? derivedIndications.value : indications.value
  }

  function getBit(byteIndex: number, bitIndex: number, frameName: FrameName = 'indications'): boolean {
    if (!Number.isInteger(byteIndex) || byteIndex < 0 || byteIndex >= FRAME_SIZE) {
      return false
    }

    if (!Number.isInteger(bitIndex) || bitIndex < 0 || bitIndex > 7) {
      return false
    }

    return (getFrame(frameName)[byteIndex] & (1 << bitIndex)) !== 0
  }

  function getAnyBit(source: BitSourceLike | null | undefined): boolean {
    return normalizeBitSources(source).some(({ byte, bit, array }) => getBit(byte, bit, array))
  }

  return {
    bytes,
    indications,
    derivedIndications,
    connectionState,
    connect,
    disconnect,
    setFrame,
    getBit,
    getAnyBit,
  }
})