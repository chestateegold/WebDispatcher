<script setup>
import { useCmriStore } from './stores/cmri'
import TrackBlock from './components/TrackBlock.vue'
import Crossover from './components/Crossover.vue'
import DoubleTrackBlock from './components/DoubleTrackBlock.vue'
import Turnout from './components/Turnout.vue'

const cmriStore = useCmriStore()

const showGridLines = false

//TODO: this is temporary and will come from signalr soon
cmriStore.setFrame([0b00010110, 0b0000000, 0b00000000])

const blockOneMapping = {
  occupied: { byte: 0, bit: 0 },
}
const blockOneSize = 2
const blockTwoMapping = {
  occupied: { byte: 0, bit: 1 },
}
const blockTwoSize = 3
const crossover1Mapping = {
  mainOccupied: { byte: 0, bit: 2 },
  crossingOccupied: { byte: 0, bit: 3 },
}
const crossoverSize = 3
const blockThreeMapping = {
  occupied: { byte: 0, bit: 4 },
}
const blockThreeSize = 3
//switch 1
const turnoutOneMapping = {
  occupied: { byte: 1, bit: 0 },
  switchPosition: { byte: 1, bit: 1 },
}
const turnoutOneSize = 3
const doubleTrackOneMapping = {
  trackOneOccupied: { byte: 2, bit: 0 },
  trackTwoOccupied: { byte: 2, bit: 1 },
}
const doubleTrackOneSize = 3
//switch 2
const turnoutTwoMapping = {
  occupied: { byte: 1, bit: 2 },
  switchPosition: { byte: 1, bit: 3 },
}
const turnoutTwoSize = 3
const blockFourMapping = {
  occupied: { byte: 0, bit: 0 },
}
const blockFourSize = 2
</script>

<template>
  <div class="container">
    <div :class="['panel', { 'panel-grid-lines': showGridLines }]">
      <TrackBlock :size="blockOneSize" :mapping="blockOneMapping" />
      <TrackBlock :size="blockTwoSize" :mapping="blockTwoMapping" />
      <Crossover :size="crossoverSize" orientation="left" :mapping="crossover1Mapping" />
      <TrackBlock :size="blockThreeSize" :mapping="blockThreeMapping" />
      <Turnout :size="turnoutOneSize" direction="right" orientation="down" :mapping="turnoutOneMapping" />
      <DoubleTrackBlock :size="doubleTrackOneSize" orientation="down" :mapping="doubleTrackOneMapping" />
      <Turnout :size="turnoutTwoSize" direction="left" orientation="down" :mapping="turnoutTwoMapping" />
      <TrackBlock :size="blockFourSize" :mapping="blockFourMapping" />
    </div>
  </div>
</template>

<style>
:root {
  --ui-scale: 1.65;
  --grid-unit: 20px;
  --panel-row-height: 60px;
}

/* Page */
body {
  margin: 0;
  background: #111;
  color: #ddd;
  font-family: system-ui, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  touch-action: manipulation;
}

/* Outer container sizes to content, not screen */
.container {
  padding: 12px;
  border-radius: 10px;
  width: fit-content;
  transform: scale(var(--ui-scale));
  transform-origin: center;
}

.panel {
  position: relative;
  display: grid;
  grid-template-columns: repeat(22, var(--grid-unit));
  grid-auto-rows: var(--panel-row-height);
  gap: 0;
  margin-bottom: 12px;
  width: fit-content;
}

.panel-grid-lines {
  /* single-pixel lines on the left/top (0) and right/bottom (cell-1px) edges */
  --grid-line-color: rgba(255, 255, 255, 0.95);
  background-image:
    /* vertical: left edge */
    linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
    /* vertical: right edge */
    linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
    /* horizontal: top edge */
    linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px),
    /* horizontal: bottom edge */
    linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px);
  /* tile to the grid cell size */
  background-size: var(--grid-unit) var(--panel-row-height);
  /* position each background so one appears at the 0px edge and the other at cell-1px */
  background-position: 0 0,
                       calc(var(--grid-unit) - 1px) 0,
                       0 0,
                       0 calc(var(--panel-row-height) - 1px);
  background-repeat: repeat;
}

</style>
