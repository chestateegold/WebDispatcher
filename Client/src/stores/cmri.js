import { ref } from 'vue'
import { defineStore } from 'pinia'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'

const FRAME_SIZE = 3
const EMPTY_FRAME = [0, 0, 0]

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

export const useCmriStore = defineStore('cmri', () => {
  const bytes = ref([...EMPTY_FRAME])
  const connectionState = ref('disconnected')
  let connectionPromise = null

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
    connectionState.value = 'disconnected'
    connectionPromise = null
  })

  function setFrame(nextBytes) {
    const normalized = Array.isArray(nextBytes) ? nextBytes.slice(0, FRAME_SIZE) : []

    bytes.value = EMPTY_FRAME.map((fallback, index) => {
      const value = normalized[index]

      return Number.isInteger(value) ? value & 0xff : fallback
    })
  }

  async function connect() {
    if (connection.state === HubConnectionState.Connected) {
      connectionState.value = 'connected'
      return
    }

    if (connectionPromise) {
      return connectionPromise
    }

    connectionState.value = 'connecting'
    connectionPromise = connection.start()
      .then(() => {
        connectionState.value = 'connected'
      })
      .catch((error) => {
        connectionState.value = 'error'
        connectionPromise = null
        throw error
      })

    return connectionPromise
  }

  async function disconnect() {
    connectionPromise = null

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

  return {
    bytes,
    connectionState,
    connect,
    disconnect,
    setFrame,
    getBit,
  }
})

