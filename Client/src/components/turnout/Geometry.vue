<script setup lang="ts">
import styles from '../cell.module.css'

import type { RailStyle } from './types'

interface Props {
  thrown?: boolean
  singleTrackStyle?: RailStyle
  trackOneStyle?: RailStyle
  trackTwoStyle?: RailStyle
  pending?: boolean
  interactive?: boolean
  showHitboxOutlines?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  thrown: false,
  singleTrackStyle: () => ({}),
  trackOneStyle: () => ({}),
  trackTwoStyle: () => ({}),
  pending: false,
  interactive: true,
  showHitboxOutlines: false,
})

const emit = defineEmits<{ activate: [] }>()

function activate() {
  if (!props.interactive) {
    return
  }

  emit('activate')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  activate()
}
</script>

<template>
  <g>
    <line x1="0" y1="24" x2="0" y2="36" :class="[styles.blockEnd, styles.rail]" :style="singleTrackStyle" />
    <line x1="0" y1="30" x2="17" y2="30" :class="[styles.straight, styles.rail]" :style="singleTrackStyle" />

    <line x1="60" y1="24" x2="60" y2="36" :class="[styles.blockEnd, styles.rail]" :style="trackOneStyle" />
    <line x1="42" y1="30" x2="60" y2="30" :class="[styles.straight, styles.rail]" :style="trackOneStyle" />

    <polyline points="39,18 47,10 60,10" :class="[styles.straight, styles.rail]" :style="trackTwoStyle" />
    <line x1="60" y1="4" x2="60" y2="16" :class="[styles.blockEnd, styles.rail]" :style="trackTwoStyle" />

    <line x1="17" y1="30" x2="42" y2="30" :class="[styles.straight, styles.rail, 'switch-border']" :style="{ opacity: thrown ? 0 : 1 }" />
    <line
      x1="18"
      y1="30"
      x2="41"
      y2="30"
      :class="[styles.straight, styles.rail, { 'switch-pending': pending && !thrown }]"
      :style="[{ opacity: thrown ? 0 : 1 }, trackOneStyle]"
    />

    <polyline points="17,30 27,30 39,18" :class="[styles.straight, styles.rail, 'switch-border']" :style="{ opacity: thrown ? 1 : 0 }" />
    <polyline
      points="18,30 27,30 38,19"
      :class="[styles.straight, styles.rail, { 'switch-pending': pending && thrown }]"
      :style="[{ opacity: thrown ? 1 : 0 }, trackTwoStyle]"
    />

    <g
      :class="['switch-hitbox-group', { 'switch-hitbox-interactive': interactive }]"
      aria-label="Toggle turnout switch"
      :tabindex="interactive ? 0 : undefined"
      role="button"
      @click.stop="activate"
      @keydown="onKeydown"
    >
      <rect
        x="14"
        y="12"
        width="30"
        height="24"
        :class="['switch-hitbox', { 'switch-hitbox-outline': props.showHitboxOutlines }]"
        rx="4"
        ry="4"
      />
    </g>
  </g>
</template>

<style scoped>
.switch-border {
  stroke: #fff;
  stroke-width: 10;
}

.switch-hitbox-group {
  pointer-events: auto;
  outline: none;
}

.switch-hitbox-interactive {
  cursor: pointer;
}

.switch-hitbox {
  fill: transparent;
  stroke: none;
}

.switch-hitbox-outline {
  stroke: rgba(255, 255, 255, 0.9);
  stroke-width: 1;
}

.switch-pending {
  animation: switch-pending-blink 1.5s step-end infinite;
}

.switch-hitbox-group:focus,
.switch-hitbox-group:focus-visible {
  outline: none;
}

@keyframes switch-pending-blink {
  0%,
  49% {
    opacity: 1;
  }

  50%,
  100% {
    opacity: 0.2;
  }
}
</style>