import { computed } from 'vue'

import { useCmriStore } from '@/stores/cmri'
import type { BitSource, BitSourceLike } from '@/types/cmri'

import type { TurnoutMappingInput } from './types'

function isBitSource(source: unknown): source is BitSource {
  return source !== null
    && typeof source === 'object'
    && Number.isInteger((source as BitSource).byte)
    && Number.isInteger((source as BitSource).bit)
}

function hasBitSource(source: BitSourceLike | null | undefined): source is BitSourceLike {
  if (Array.isArray(source)) {
    return source.length > 0 && source.every(isBitSource)
  }

  return isBitSource(source)
}

function getBitValue(store: ReturnType<typeof useCmriStore>, source: BitSource | null | undefined, fallback = false): boolean {
  if (!isBitSource(source)) {
    return fallback
  }

  return store.getBit(source.byte, source.bit, source.array)
}

function getAnyBitValue(store: ReturnType<typeof useCmriStore>, source: BitSourceLike | null | undefined): boolean {
  if (!hasBitSource(source)) {
    return false
  }

  return store.getAnyBit(source)
}

export function useTurnoutMapping(props: TurnoutMappingInput) {
  const cmriStore = useCmriStore()

  const isOccupied = computed(() => getAnyBitValue(cmriStore, props.mapping?.occupied))

  const isSwitchReversed = computed(() => {
    const source = props.mapping?.switchPosition

    if (!isBitSource(source)) {
      return false
    }

    return !getBitValue(cmriStore, source)
  })

  const isSwitchNormal = computed(() => !isSwitchReversed.value)

  const isClearLeftActive = computed(() => getAnyBitValue(cmriStore, props.mapping?.clearLeft))

  const isClearRightActive = computed(() => getAnyBitValue(cmriStore, props.mapping?.clearRight))

  const hasClearRouteSources = computed(() => hasBitSource(props.mapping?.clearLeft) || hasBitSource(props.mapping?.clearRight))

  return {
    isOccupied,
    isSwitchNormal,
    isSwitchReversed,
    isClearLeftActive,
    isClearRightActive,
    hasClearRouteSources,
  }
}