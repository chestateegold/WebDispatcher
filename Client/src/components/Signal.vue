<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  label: {
    type: String,
    default: 'Signal',
  },
  aspect: {
    type: String,
    default: 'red',
    validator: (value) => ['red', 'green'].includes(value),
  },
  facing: {
    type: String,
    default: 'right',
    validator: (value) => ['left', 'right', 'up', 'down'].includes(value),
  },
  interactive: {
    type: Boolean,
    default: true,
  },
  hitWidth: {
    type: Number,
    default: 16,
  },
  hitHeight: {
    type: Number,
    default: 16,
  },
})

const emit = defineEmits(['activate'])

function activate() {
  if (!props.interactive) {
    return
  }

  emit('activate', props.id)
}

function onKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  activate()
}

const lampClass = computed(() => `signal-lamp-${props.aspect}`)

const facingTransform = computed(() => {
  switch (props.facing) {
    case 'left':
      return 'scale(-1,1)'
    case 'up':
      return 'rotate(-90)'
    case 'down':
      return 'rotate(90)'
    default:
      return undefined
  }
})
</script>

<template>
  <g
    :transform="`translate(${props.x}, ${props.y})`"
    :class="['signal', `signal-${props.aspect}`, { 'signal-interactive': props.interactive }]"
    :aria-label="props.label"
    :tabindex="props.interactive ? 0 : undefined"
    role="button"
    @click.stop="activate"
    @keydown="onKeydown"
  >
    <rect
      :x="-props.hitWidth / 2"
      :y="-props.hitHeight / 2"
      :width="props.hitWidth"
      :height="props.hitHeight"
      class="signal-hitbox"
      rx="2"
      ry="2"
    />
    <g :transform="facingTransform">
      <polygon points="0,-4 4,0 0,4" class="signal-mast" />
      <circle cx="9" cy="0" r="5" class="signal-head" />
      <circle cx="9" cy="0" r="3" :class="['signal-lamp', lampClass]" />
    </g>
  </g>
</template>

<style scoped>
.signal {
  color: #d33;
}

.signal-interactive {
  cursor: pointer;
}

.signal-red {
  color: #d33;
}

.signal-green {
  color: #2fbf71;
}

.signal-hitbox {
  fill: transparent;
  stroke: none;
}

.signal-head {
  fill: #101010;
  stroke: none;
}
.signal-mast {
  fill: #ffffff;
  stroke: none;
}
.signal-lamp {
  transition: fill 0.2s ease, opacity 0.2s ease;
}

.signal-lamp-red {
  fill: #d33;
}

.signal-lamp-green {
  fill: #2fbf71;
}

.signal:focus-visible .signal-hitbox {
  stroke: rgba(255, 255, 255, 0.65);
  stroke-width: 1;
}
</style>