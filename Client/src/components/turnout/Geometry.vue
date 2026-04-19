<script setup>
import styles from '../cell.module.css'

defineProps({
  thrown: {
    type: Boolean,
    default: false,
  },
  singleTrackStyle: {
    type: Object,
    default: () => ({}),
  },
  trackOneStyle: {
    type: Object,
    default: () => ({}),
  },
  trackTwoStyle: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <g>
    <line x1="0" y1="24" x2="0" y2="36" :class="[styles.blockEnd, styles.rail]" :style="singleTrackStyle" />
    <line x1="1" y1="30" x2="17" y2="30" :class="[styles.straight, styles.rail]" :style="singleTrackStyle" />

    <line x1="60" y1="24" x2="60" y2="36" :class="[styles.blockEnd, styles.rail]" :style="trackOneStyle" />
    <line x1="42" y1="30" x2="59" y2="30" :class="[styles.straight, styles.rail]" :style="trackOneStyle" />

    <polyline points="39,18 47,10 59,10" :class="[styles.straight, styles.rail]" :style="trackTwoStyle" />
    <line x1="60" y1="4" x2="60" y2="16" :class="[styles.blockEnd, styles.rail]" :style="trackTwoStyle" />

    <line x1="17" y1="30" x2="42" y2="30" :class="[styles.straight, styles.rail, 'switch-border']" :style="{ opacity: thrown ? 0 : 1 }" />
    <line x1="18" y1="30" x2="41" y2="30" :class="[styles.straight, styles.rail]" :style="[{ opacity: thrown ? 0 : 1 }, trackOneStyle]" />

    <polyline points="17,30 27,30 39,18" :class="[styles.straight, styles.rail, 'switch-border']" :style="{ opacity: thrown ? 1 : 0 }" />
    <polyline points="18,30 27,30 38,19" :class="[styles.straight, styles.rail]" :style="[{ opacity: thrown ? 1 : 0 }, trackTwoStyle]" />
  </g>
</template>

<style scoped>
.switch-border {
  stroke: #fff;
  stroke-width: 10;
}
</style>