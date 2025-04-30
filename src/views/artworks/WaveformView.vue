<template>
	<BaseCanvas>
		<TresMesh>
			<TresPlaneGeometry :args="[10, 10, 128, 1]" />
			<TresShaderMaterial
				:args="[
					{
						vertexShader: vertexShader,
						fragmentShader: fragmentShader,
						uniforms: {
							time: { value: 0 },
							soundLevel: { value: 0 },
							frequencyData: { value: initialFrequencyData },
						},
					},
				]"
				ref="shaderMaterial"
			/>
		</TresMesh>
	</BaseCanvas>
</template>

<script setup lang="ts">
	import { ref, onMounted, onUnmounted } from 'vue';
	import BaseCanvas from '@/components/BaseCanvas.vue';
	import type { ShaderMaterial } from 'three';

	const initialFrequencyData = new Float32Array(128);
	const shaderMaterial = ref<ShaderMaterial | null>(null);

	const vertexShader = `
  uniform float time;
  uniform float soundLevel;
  uniform float frequencyData[128];
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    float frequencyIndex = floor(uv.x * 128.0);
    float amplitude = frequencyData[int(frequencyIndex)] * soundLevel;
    
    vec3 newPosition = position;
    newPosition.y += amplitude * 2.0;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

	const fragmentShader = `
  uniform float time;
  varying vec2 vUv;
  
  void main() {
    vec3 color = vec3(
      0.5 + 0.5 * sin(vUv.x * 10.0 + time),
      0.5 + 0.5 * sin(vUv.y * 5.0 + time * 0.5),
      0.5 + 0.5 * sin(vUv.x * vUv.y * 3.0 + time * 0.2)
    );
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

	let audioContext: AudioContext;
	let analyser: AnalyserNode;
	let dataArray: Uint8Array;
	let animationFrameId: number;

	const setupAudio = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);

			dataArray = new Uint8Array(analyser.frequencyBinCount);
			animate();
		} catch (error) {
			console.error('Error accessing microphone:', error);
		}
	};

	const animate = () => {
		if (analyser && shaderMaterial.value) {
			analyser.getByteFrequencyData(dataArray);
			shaderMaterial.value.uniforms.time.value += 0.01;
			shaderMaterial.value.uniforms.frequencyData.value = new Float32Array(
				dataArray
			);
			shaderMaterial.value.uniforms.soundLevel.value =
				dataArray.reduce((a, b) => a + b) / dataArray.length / 128.0;
		}

		animationFrameId = requestAnimationFrame(animate);
	};

	onMounted(() => {
		setupAudio();
	});

	onUnmounted(() => {
		if (audioContext) {
			audioContext.close();
		}
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
	});
</script>
