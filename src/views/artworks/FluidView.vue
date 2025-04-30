<template>
	<BaseCanvas>
		<TresGroup>
			<!-- Glass sphere with waves -->
			<TresMesh
				:position="[0, -0.5, 0]"
				:scale="1.2"
				cast-shadow
				receive-shadow
				ref="sphereRef"
			>
				<TresSphereGeometry :args="[1, 64, 64]" />
				<TresShaderMaterial
					:args="[
						{
							vertexShader: vertexShader,
							fragmentShader: fragmentShader,
							uniforms: {
								time: { value: 0 },
								audioLevel: { value: 0 },
							},
							side: DoubleSide,
							transparent: true,
							opacity: 0.9,
						},
					]"
					ref="shaderMaterial"
				/>
			</TresMesh>

			<!-- Inner glow sphere -->
			<TresMesh :position="[0, -0.5, 0]" :scale="1.0">
				<TresSphereGeometry :args="[1, 32, 32]" />
				<TresMeshBasicMaterial
					:color="sphereGlowColor"
					:transparent="true"
					:opacity="0.08"
				/>
			</TresMesh>
		</TresGroup>
	</BaseCanvas>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted } from 'vue';
	import { DoubleSide, Color } from 'three';
	import BaseCanvas from '@/components/BaseCanvas.vue';
	import type { ShaderMaterial, Object3D } from 'three';

	const shaderMaterial = ref<ShaderMaterial | null>(null);
	const sphereRef = ref<Object3D | null>(null);
	let animationFrameId: number | null = null;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;

	// Dynamic glow color
	const glowHue = ref(0.55); // Start with blue
	const sphereGlowColor = computed(() => {
		const color = new Color();
		color.setHSL(glowHue.value, 0.8, 0.5);
		return color;
	});

	const vertexShader = `
		uniform float time;
		uniform float audioLevel;
		varying vec3 vPosition;
		varying vec3 vNormal;
		varying vec3 vViewPosition;

		// Perlin noise functions
		vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
		vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
		vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
		vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

		float snoise(vec3 v) {
			const vec2 C = vec2(1.0/6.0, 1.0/3.0);
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

			// Gradients
			float n_ = 0.142857142857;
			vec3 ns = n_ * D.wyz - D.xzx;

			vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

			vec4 x_ = floor(j * ns.z);
			vec4 y_ = floor(j - 7.0 * x_);

			vec4 x = x_ *ns.x + ns.yyyy;
			vec4 y = y_ *ns.x + ns.yyyy;
			vec4 h = 1.0 - abs(x) - abs(y);

			vec4 b0 = vec4(x.xy, y.xy);
			vec4 b1 = vec4(x.zw, y.zw);

			vec4 s0 = floor(b0)*2.0 + 1.0;
			vec4 s1 = floor(b1)*2.0 + 1.0;
			vec4 sh = -step(h, vec4(0.0));

			vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
			vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

			vec3 p0 = vec3(a0.xy, h.x);
			vec3 p1 = vec3(a0.zw, h.y);
			vec3 p2 = vec3(a1.xy, h.z);
			vec3 p3 = vec3(a1.zw, h.w);

			// Normalise gradients
			vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
			p0 *= norm.x;
			p1 *= norm.y;
			p2 *= norm.z;
			p3 *= norm.w;

			// Mix final noise value
			vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
			m = m * m;
			return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
		}

		// Smooth minimum function for liquid effect
		float smin(float a, float b, float k) {
			float h = max(k - abs(a - b), 0.0) / k;
			return min(a, b) - h * h * k * 0.25;
		}

		void main() {
			vPosition = position;
			vNormal = normal;
			
			// Create more dynamic terrain-like features
			float terrain = sin(length(position) * 4.0 + time * 1.5) * 0.15;
			terrain += sin(dot(normalize(position), vec3(1.0, 0.0, 0.0)) * 8.0 - time * 0.8) * 0.1;
			terrain += cos(dot(normalize(position), vec3(0.0, 1.0, 0.0)) * 6.0 + time * 1.2) * 0.1;
			
			// Add multiple layers of Perlin noise for more complex distortion
			vec3 noisePos1 = position * 4.0 + time * 0.3;
			vec3 noisePos2 = position * 2.0 - time * 0.2;
			float noise1 = snoise(noisePos1) * audioLevel * 0.3;
			float noise2 = snoise(noisePos2) * audioLevel * 0.2;
			
			// Combine noise layers with smooth minimum
			float combinedNoise = smin(noise1, noise2, 0.4);
			
			// Scale noise based on distance from center with more pronounced effect
			float centerFactor = 1.0 - length(position) * 0.7;
			combinedNoise *= centerFactor;
			
			// Add more pronounced audio-based distortion
			float distortion = audioLevel * 3.0;
			vec3 distortedNormal = normal * (1.0 + distortion * 0.3);
			
			// Apply terrain, noise and distortion with smooth minimum
			vec3 newPosition = position + normal * smin(terrain, combinedNoise, 0.5);
			newPosition += distortedNormal * audioLevel * 0.15;
			
			// Add some swirling motion
			float swirl = sin(dot(position, vec3(0.0, 1.0, 0.0)) * 4.0 + time) * 0.1;
			newPosition += normal * swirl * audioLevel;
			
			// Calculate view position for lighting
			vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
			vViewPosition = -mvPosition.xyz;
			
			gl_Position = projectionMatrix * mvPosition;
		}
	`;

	const fragmentShader = `
		varying vec3 vPosition;
		varying vec3 vNormal;
		varying vec3 vViewPosition;

		void main() {
			// Calculate lighting
			vec3 normal = normalize(vNormal);
			vec3 viewDir = normalize(vViewPosition);
			
			// Ambient light with subtle warm tint
			vec3 ambient = vec3(0.22, 0.21, 0.18);
			
			// Diffuse light
			vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
			float diff = max(dot(normal, lightDir), 0.0);
			vec3 diffuse = vec3(0.5, 0.48, 0.45) * diff;
			
			// Specular light with subtle yellow tint
			vec3 reflectDir = reflect(-lightDir, normal);
			float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
			vec3 specular = vec3(0.35, 0.32, 0.25) * spec;
			
			// Create dynamic base color with subtle pastel tones
			vec3 baseColor = vec3(
				0.4 + 0.2 * sin(vPosition.x * 3.0 + vPosition.y * 2.0),
				0.5 + 0.2 * cos(vPosition.y * 2.0 + vPosition.z * 3.0),
				0.6 + 0.2 * sin(vPosition.z * 2.0 + vPosition.x * 3.0)
			);
			
			// Add subtle warm color variation based on normal
			vec3 normalColor = vec3(
				0.12 * (normal.x + 1.0),
				0.1 * (normal.y + 1.0),
				0.08 * (normal.z + 1.0)
			);
			
			// Add subtle pastel yellow variation based on position
			vec3 positionColor = vec3(
				0.15 * sin(vPosition.x * 4.0),
				0.18 * cos(vPosition.y * 4.0),
				0.12 * sin(vPosition.z * 4.0)
			);
			
			// Add subtle yellow pastel highlight
			vec3 pastelYellow = vec3(0.98, 0.91, 0.71) * 0.15;
			float highlight = pow(max(dot(normal, lightDir), 0.0), 4.0);
			
			// Combine all color variations
			vec3 finalColor = baseColor + normalColor + positionColor;
			finalColor = mix(finalColor, pastelYellow, highlight * 0.3);
			
			// Apply lighting
			vec3 color = finalColor * (ambient + diffuse) + specular;
			
			// Add some depth-based darkening
			float depth = length(vViewPosition);
			color *= 1.0 - depth * 0.1;
			
			// Calculate fresnel effect for edges with subtle warm color
			float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
			vec3 fresnelColor = vec3(0.98, 0.91, 0.71) * fresnel * 0.3;
			color += fresnelColor;
			
			gl_FragColor = vec4(color, 0.9);
		}
	`;

	const setupAudio = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.8; // Add smoothing
			source.connect(analyser);
			console.log('Audio setup successful');
		} catch (error) {
			console.error('Error setting up audio:', error);
		}
	};

	const animate = () => {
		if (shaderMaterial.value) {
			shaderMaterial.value.uniforms.time.value += 0.015;

			// Update audio level
			if (analyser) {
				const dataArray = new Uint8Array(analyser.frequencyBinCount);
				analyser.getByteFrequencyData(dataArray);
				const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
				const normalizedLevel = (average / 128.0) * 4.0;
				shaderMaterial.value.uniforms.audioLevel.value = normalizedLevel;
			}
		}
		if (sphereRef.value?.rotation) {
			// Increase base rotation speed
			sphereRef.value.rotation.y += 0.02;

			// Add dynamic rotation based on audio
			if (analyser) {
				const dataArray = new Uint8Array(analyser.frequencyBinCount);
				analyser.getByteFrequencyData(dataArray);
				const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
				const rotationSpeed = (average / 128.0) * 0.1; // Scale the audio level for rotation

				// Apply rotation to multiple axes for more dynamic movement
				sphereRef.value.rotation.y += rotationSpeed;
				sphereRef.value.rotation.x += rotationSpeed * 0.5;
				sphereRef.value.rotation.z += rotationSpeed * 0.3;
			}
		}
		// Slowly cycle glow color
		glowHue.value = (glowHue.value + 0.001) % 1;

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
