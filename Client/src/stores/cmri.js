import { ref } from 'vue'
import { defineStore } from 'pinia'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'

const FRAME_SIZE = 3
const EMPTY_FRAME = [0, 0, 0]
const RECONNECT_DELAY_MS = 1000

function normalizeFramePayload(payload) {
  if (Array.isArray(payload)) {
    return payload
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

  if (payload && typeof payload === 'object') {
    return Object.values(payload)
  }

  return []
}

function normalizeBitSources(source) {
  if (Array.isArray(source)) {
    return source
  }

  if (source && typeof source === 'object') {
    return [source]
  }

  return []
}

export const useCmriStore = defineStore('cmri', () => {
  const bytes = ref([...EMPTY_FRAME])
  const connectionState = ref('disconnected')
  let connectionPromise = null
  let reconnectTimer = null
  let shouldStayConnected = false

  const connection = new HubConnectionBuilder()
    .withUrl('/cmriHub')
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()

  connection.on('ReceiveMessage', (payload) => {
    setFrame(normalizeFramePayload(payload))
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

  function setFrame(nextBytes) {
    const normalized = Array.isArray(nextBytes) ? nextBytes.slice(0, FRAME_SIZE) : []

    bytes.value = EMPTY_FRAME.map((fallback, index) => {
      const value = normalized[index]

      return Number.isInteger(value) ? value & 0xff : fallback
    })
  }

  async function startConnection() {
    if (connection.state === HubConnectionState.Connected) {
      connectionState.value = 'connected'
      return
    }

    if (connection.state === HubConnectionState.Connecting || connection.state === HubConnectionState.Reconnecting) {
      return connectionPromise
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
      .catch((error) => {
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

  async function connect() {
    shouldStayConnected = true
    return startConnection()
  }

  async function disconnect() {
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

  function getBit(byteIndex, bitIndex) {
    if (!Number.isInteger(byteIndex) || byteIndex < 0 || byteIndex >= FRAME_SIZE) {
      return false
    }

    if (!Number.isInteger(bitIndex) || bitIndex < 0 || bitIndex > 7) {
      return false
    }

    return (bytes.value[byteIndex] & (1 << bitIndex)) !== 0
  }

  function getAnyBit(source) {
    return normalizeBitSources(source).some(({ byte, bit }) => getBit(byte, bit))
  }

  return {
    bytes,
    connectionState,
    connect,
    disconnect,
    setFrame,
    getBit,
    getAnyBit,
  }
})

