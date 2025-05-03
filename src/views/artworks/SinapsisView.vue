<template>
	<BaseCanvas>
		<TresGroup>
			<TresPoints ref="pointsRef">
				<TresBufferGeometry>
					<TresBufferAttribute
						:args="[positions, 3]"
						:attach="'attributes-position'"
					/>
					<TresBufferAttribute
						:args="[colors, 3]"
						:attach="'attributes-color'"
					/>
					<TresBufferAttribute :args="[sizes, 1]" :attach="'attributes-size'" />
				</TresBufferGeometry>
				<TresShaderMaterial
					:args="[
						{
							vertexShader: vertexShader,
							fragmentShader: fragmentShader,
							uniforms: {
								time: { value: 0 },
								audioLevel: { value: 0 },
								lowFrequency: { value: 0 },
								midFrequency: { value: 0 },
								highFrequency: { value: 0 },
								frequency: { value: 2.0 },
								amplitude: { value: 0.5 },
								offsetGain: { value: 0.1 },
								startColor: { value: new Color(0x4a90e2) },
								endColor: { value: new Color(0xff6b6b) },
							},
							transparent: true,
							blending: AdditiveBlending,
							depthWrite: false,
						},
					]"
					ref="shaderMaterial"
				/>
			</TresPoints>
		</TresGroup>
	</BaseCanvas>
</template>

<script setup lang="ts">
	import { ref, onMounted, onUnmounted } from 'vue';
	import { AdditiveBlending, Color } from 'three';
	import BaseCanvas from '@/components/BaseCanvas.vue';
	import type { Points, ShaderMaterial } from 'three';

	const pointsRef = ref<Points | null>(null);
	const shaderMaterial = ref<ShaderMaterial | null>(null);
	let animationFrameId: number | null = null;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let time = 0;

	// Particle system configuration
	const PARTICLE_COUNT = 5000;
	const positions = new Float32Array(PARTICLE_COUNT * 3);
	const colors = new Float32Array(PARTICLE_COUNT * 3);
	const sizes = new Float32Array(PARTICLE_COUNT);

	// Initialize particles
	for (let i = 0; i < PARTICLE_COUNT; i++) {
		// Position
		const i3 = i * 3;
		positions[i3] = (Math.random() - 0.5) * 10; // x
		positions[i3 + 1] = (Math.random() - 0.5) * 10; // y
		positions[i3 + 2] = (Math.random() - 0.5) * 10; // z

		// Color
		colors[i3] = Math.random() * 0.5 + 0.5; // r
		colors[i3 + 1] = Math.random() * 0.5 + 0.5; // g
		colors[i3 + 2] = Math.random() * 0.5 + 0.5; // b

		// Size
		sizes[i] = Math.random() * 2 + 1;
	}

	const vertexShader = `
		attribute float size;
		attribute vec3 color;
		varying vec3 vColor;
		varying float vDistance;
		uniform float time;
		uniform float audioLevel;
		uniform float lowFrequency;
		uniform float midFrequency;
		uniform float highFrequency;
		uniform float frequency;
		uniform float amplitude;
		uniform float offsetGain;

		// Simplex noise function
		vec3 mod289(vec3 x) {
			return x - floor(x * (1.0 / 289.0)) * 289.0;
		}

		vec4 mod289(vec4 x) {
			return x - floor(x * (1.0 / 289.0)) * 289.0;
		}

		vec4 permute(vec4 x) {
			return mod289(((x * 34.0) + 1.0) * x);
		}

		vec4 taylorInvSqrt(vec4 r) {
			return 1.79284291400159 - 0.85373472095314 * r;
		}

		float snoise(vec3 v) {
			const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
			const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

			// First corner
			vec3 i  = floor(v + dot(v, C.yyy));
			vec3 x0 = v - i + dot(i, C.xxx);

			// Other corners
			vec3 g = step(x0.yzx, x0.xyz);
			vec3 l = 1.0 - g;
			vec3 i1 = min(g.xyz, l.zxy);
			vec3 i2 = max(g.xyz, l.zxy);

			vec3 x1 = x0 - i1 + C.xxx;
			vec3 x2 = x0 - i2 + C.yyy;
			vec3 x3 = x0 - D.yyy;

			// Permutations
			i = mod289(i);
			vec4 p = permute(permute(permute(
				i.z + vec4(0.0, i1.z, i2.z, 1.0))
				+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
				+ i.x + vec4(0.0, i1.x, i2.x, 1.0));

			// Gradients: 7x7 points over a square, mapped onto an octahedron.
			float n_ = 0.142857142857; // 1.0/7.0
			vec3 ns = n_ * D.wyz - D.xzx;

			vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

			vec4 x_ = floor(j * ns.z);
			vec4 y_ = floor(j - 7.0 * x_);

			vec4 x = x_ * ns.x + ns.yyyy;
			vec4 y = y_ * ns.x + ns.yyyy;
			vec4 h = 1.0 - abs(x) - abs(y);

			vec4 b0 = vec4(x.xy, y.xy);
			vec4 b1 = vec4(x.zw, y.zw);

			vec4 s0 = floor(b0) * 2.0 + 1.0;
			vec4 s1 = floor(b1) * 2.0 + 1.0;
			vec4 sh = -step(h, vec4(0.0));

			vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
			vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

			vec3 p0 = vec3(a0.xy, h.x);
			vec3 p1 = vec3(a0.zw, h.y);
			vec3 p2 = vec3(a1.xy, h.z);
			vec3 p3 = vec3(a1.zw, h.w);

			// Normalise gradients
			vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
			p0 *= norm.x;
			p1 *= norm.y;
			p2 *= norm.z;
			p3 *= norm.w;

			// Mix final noise value
			vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
			m = m * m;
			return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
		}

		// Curl noise function
		vec3 curlNoise(vec3 p) {
			const float e = 0.1;
			vec3 dx = vec3(e, 0.0, 0.0);
			vec3 dy = vec3(0.0, e, 0.0);
			vec3 dz = vec3(0.0, 0.0, e);

			vec3 p_x0 = p - dx;
			vec3 p_x1 = p + dx;
			vec3 p_y0 = p - dy;
			vec3 p_y1 = p + dy;
			vec3 p_z0 = p - dz;
			vec3 p_z1 = p + dz;

			float x = (snoise(p_y1) - snoise(p_y0)) - (snoise(p_z1) - snoise(p_z0));
			float y = (snoise(p_z1) - snoise(p_z0)) - (snoise(p_x1) - snoise(p_x0));
			float z = (snoise(p_x1) - snoise(p_x0)) - (snoise(p_y1) - snoise(p_y0));

			return normalize(vec3(x, y, z));
		}

		void main() {
			vColor = color;
			
			// Calculate target position with curl noise
			vec3 newpos = position;
			vec3 target = position + curlNoise(newpos * frequency) * amplitude;
			
			// Add wave motion
			target.z += sin(time + position.x) * offsetGain * midFrequency;
			target.y += cos(time + position.z) * offsetGain * lowFrequency;
			target.x += sin(time + position.y) * offsetGain * highFrequency;
			
			// Smooth transition to target
			float d = length(newpos - target) / 2.0;
			newpos = mix(position, target, pow(d, 4.0));
			
			// Calculate distance for color interpolation
			vDistance = d;
			
			vec4 mvPosition = modelViewMatrix * vec4(newpos, 1.0);
			gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + audioLevel);
			gl_Position = projectionMatrix * mvPosition;
		}
	`;

	const fragmentShader = `
		varying vec3 vColor;
		varying float vDistance;
		uniform vec3 startColor;
		uniform vec3 endColor;
		
		float circle(vec2 uv, float radius) {
			return 1.0 - smoothstep(radius - 0.01, radius, length(uv - 0.5));
		}
		
		void main() {
			vec2 uv = gl_PointCoord;
			float circ = circle(uv, 0.5);
			
			// Interpolate colors based on distance
			vec3 color = mix(startColor, endColor, vDistance);
			
			// Add glow effect
			float glow = 1.0 - length(uv - 0.5) * 2.0;
			gl_FragColor = vec4(color, circ * glow * vDistance);
		}
	`;

	const setupAudio = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.8;
			source.connect(analyser);
			console.log('Audio setup successful');
		} catch (error) {
			console.error('Error setting up audio:', error);
		}
	};

	const getFrequencyData = () => {
		if (!analyser) return { low: 0, mid: 0, high: 0 };

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(dataArray);

		// Split frequency bands
		const lowStart = 0;
		const lowEnd = Math.floor(dataArray.length * 0.25);
		const midStart = lowEnd;
		const midEnd = Math.floor(dataArray.length * 0.75);
		const highStart = midEnd;
		const highEnd = dataArray.length;

		// Calculate averages for each band
		const lowAvg =
			dataArray.slice(lowStart, lowEnd).reduce((a, b) => a + b) /
			(lowEnd - lowStart);
		const midAvg =
			dataArray.slice(midStart, midEnd).reduce((a, b) => a + b) /
			(midEnd - midStart);
		const highAvg =
			dataArray.slice(highStart, highEnd).reduce((a, b) => a + b) /
			(highEnd - highStart);

		return {
			low: lowAvg / 128.0,
			mid: midAvg / 128.0,
			high: highAvg / 128.0,
		};
	};

	const animate = () => {
		if (shaderMaterial.value) {
			time += 0.01;
			shaderMaterial.value.uniforms.time.value = time;

			const freqData = getFrequencyData();
			shaderMaterial.value.uniforms.lowFrequency.value = freqData.low;
			shaderMaterial.value.uniforms.midFrequency.value = freqData.mid;
			shaderMaterial.value.uniforms.highFrequency.value = freqData.high;

			// Update amplitude based on high frequencies
			shaderMaterial.value.uniforms.amplitude.value = 0.5 + freqData.high * 0.5;

			// Update offset gain based on mid frequencies
			shaderMaterial.value.uniforms.offsetGain.value = 0.1 + freqData.mid * 0.2;
		}

		animationFrameId = requestAnimationFrame(animate);
	};

	onMounted(() => {
		setupAudio();
		animate();
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
