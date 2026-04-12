import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCmriStore = defineStore('cmri', () => {
  const bytes = ref([0, 0, 0])

  function setFrame(nextBytes) {
    const normalized = Array.isArray(nextBytes) ? nextBytes.slice(0, 3) : []

    bytes.value = [0, 0, 0].map((fallback, index) => {
      const value = normalized[index]

      return Number.isInteger(value) ? value & 0xff : fallback
    })
  }

  function getBit(byteIndex, bitIndex) {
    if (!Number.isInteger(byteIndex) || byteIndex < 0 || byteIndex > 2) {
      return false
    }

    if (!Number.isInteger(bitIndex) || bitIndex < 0 || bitIndex > 7) {
      return false
    }

    return (bytes.value[byteIndex] & (1 << bitIndex)) !== 0
  }

  return {
    bytes,
    setFrame,
    getBit,
  }
})

