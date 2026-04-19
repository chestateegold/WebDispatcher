function hasBitSource(source) {
  if (Array.isArray(source)) {
    return source.length > 0
  }

  if (!source || typeof source !== 'object') {
    return false
  }

  return Number.isInteger(source.byte) && Number.isInteger(source.bit)
}

function getBitValue(store, source, fallback = false) {
  if (!hasBitSource(source)) {
    return fallback
  }

  return store.getBit(source.byte, source.bit, source.array)
}

function getAnyBitValue(store, source) {
  if (!hasBitSource(source)) {
    return false
  }

  return store.getAnyBit(source)
}

export function useTurnoutMapping(props) {
  const cmriStore = useCmriStore()

  const isOccupied = computed(() => getAnyBitValue(cmriStore, props.mapping?.occupied))

  const isSwitchReversed = computed(() => {
    const source = props.mapping?.switchPosition

    if (!hasBitSource(source)) {
      return false
    }

    return !getBitValue(cmriStore, source)
  })

  const isSwitchNormal = computed(() => !isSwitchReversed.value)

  const isClearLeftActive = computed(() => getAnyBitValue(cmriStore, props.clearLeft))

  const isClearRightActive = computed(() => getAnyBitValue(cmriStore, props.clearRight))

  const hasClearRouteSources = computed(() => hasBitSource(props.clearLeft) || hasBitSource(props.clearRight))

  return {
    isOccupied,
    isSwitchNormal,
    isSwitchReversed,
    isClearLeftActive,
    isClearRightActive,
    hasClearRouteSources,
  }
}