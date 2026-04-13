<script setup>
import { computed } from 'vue'
import { useCmriStore } from '../stores/cmri'
import styles from './cell.module.css'

const props = defineProps({
  size: {
    type: Number,
    default: 3,
    validator: (value) => Number.isInteger(value) && value >= 1,
  },
  blockEndLeft: {
    type: Boolean,
    default: true,
  },
  blockEndRight: {
    type: Boolean,
    default: true,
  },
  mapping: {
    type: Object,
    default: () => ({}),
  },
})

const cmriStore = useCmriStore()

const occupied = computed(() => {
  const source = props.mapping?.occupied

  if (!source) {
    return false
  }

  return cmriStore.getAnyBit(source)
})

const blockWidth = computed(() => props.size * 20)

const innerTrackEnd = computed(() => Math.max(1, blockWidth.value - 1))

const viewBox = computed(() => `0 0 ${blockWidth.value} 60`)

const layoutStyle = computed(() => ({
  gridColumn: `span ${props.size}`,
}))
</script>

<template>
  <div :class="[styles.component, styles.layoutItem, 'track', { occupied }]" :style="layoutStyle">
    <svg :class="styles.svgFill" :viewBox="viewBox" aria-label="Track block">
      <line v-if="blockEndLeft" x1="0" y1="24" x2="0" y2="36" :class="[styles.blockEnd, styles.rail]" />
      <line x1="1" y1="30" :x2="innerTrackEnd" y2="30" :class="[styles.straight, styles.rail]" />
      <line v-if="blockEndRight" :x1="blockWidth" y1="24" :x2="blockWidth" y2="36" :class="[styles.blockEnd, styles.rail]" />
    </svg>
  </div>
</template>

<style scoped>
.track {
  --rail-stroke: #555;
}

.occupied {
  --rail-stroke: #d33;
}
</style>