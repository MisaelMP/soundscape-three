<template>
  <TresCanvas>
    <TresPerspectiveCamera :position="[0, 0, 5]" />
    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight :position="[10, 10, 10]" :intensity="1" />
    
    <TresMesh v-for="(point, index) in wavePoints" :key="index" :position="[point.x, point.y, point.z]">
      <TresSphereGeometry :args="[0.05]" />
      <TresMeshStandardMaterial :color="point.color" />
    </TresMesh>
  </TresCanvas>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSoundInput } from '../composables/useSoundInput'
import { useMotionInput } from '../composables/useMotionInput'

const { soundData } = useSoundInput()
const { motionData } = useMotionInput()

interface WavePoint {
  x: number
  y: number
  z: number
  color: string
}

const wavePoints = ref<WavePoint[]>([])
const numPoints = 100

// Initialize wave points
for (let i = 0; i < numPoints; i++) {
  wavePoints.value.push({
    x: (i - numPoints / 2) * 0.1,
    y: 0,
    z: 0,
    color: '#00ff00'
  })
}

// Update wave points based on sound and motion
watch([soundData, motionData], ([sound, motion]) => {
  const amplitude = sound.amplitude
  const frequency = sound.frequency
  
  wavePoints.value.forEach((point, index) => {
    // Create wave effect
    point.y = Math.sin(index * 0.1 + Date.now() * 0.001) * amplitude * 2
    
    // Add motion influence
    point.x += motion.acceleration.x * 0.01
    point.z += motion.acceleration.z * 0.01
    
    // Update color based on frequency
    const hue = (frequency / 1000) * 360
    point.color = `hsl(${hue}, 100%, 50%)`
  })
}, { deep: true })
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100vh;
}
</style> 