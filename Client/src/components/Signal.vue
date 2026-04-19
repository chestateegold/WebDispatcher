<script setup lang="ts">
type SignalAspect = 'red' | 'green'
type SignalFacing = 'left' | 'right' | 'up' | 'down'

interface Props {
  id: string
  x: number
  y: number
  label?: string
  aspect?: SignalAspect
  facing?: SignalFacing
  interactive?: boolean
  hitWidth?: number
  hitHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Signal',
  aspect: 'red',
  facing: 'right',
  interactive: true,
  hitWidth: 16,
  hitHeight: 16,
})

const emit = defineEmits<{ activate: [id: string] }>()

function activate() {
  if (!props.interactive) {
    return
  }

  emit('activate', props.id)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  activate()
}

const lampClass = computed(() => `signal-lamp-${props.aspect}`)

const facingTransform = computed<string | undefined>(() => {
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