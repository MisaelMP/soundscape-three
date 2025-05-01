import { ref, onMounted, onUnmounted } from 'vue';
import type { SoundData } from '../types';

export function useSoundInput() {
	const audioContext = ref<AudioContext | null>(null);
	const analyser = ref<AnalyserNode | null>(null);
	const soundData = ref<SoundData>({
		frequency: 0,
		amplitude: 0,
		waveform: new Float32Array(),
	});

	const initAudio = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioContext.value = new AudioContext();
			const source = audioContext.value.createMediaStreamSource(stream);
			analyser.value = audioContext.value.createAnalyser();
			analyser.value.fftSize = 2048;
			source.connect(analyser.value);

			const bufferLength = analyser.value.frequencyBinCount;
			const dataArray = new Float32Array(bufferLength);

			const updateSoundData = () => {
				if (!analyser.value) return;

				analyser.value.getFloatTimeDomainData(dataArray);
				const amplitude =
					dataArray.reduce((acc, val) => acc + Math.abs(val), 0) / bufferLength;
				const frequency = getDominantFrequency(
					dataArray,
					audioContext.value?.sampleRate || 44100
				);

				soundData.value = {
					frequency,
					amplitude,
					waveform: new Float32Array(dataArray),
				};

				requestAnimationFrame(updateSoundData);
			};

			updateSoundData();
		} catch (error) {
			console.error('Error accessing microphone:', error);
		}
	};

	const getDominantFrequency = (
		data: Float32Array,
		sampleRate: number
	): number => {
		// Simple zero-crossing detection for frequency estimation
		let zeroCrossings = 0;
		for (let i = 1; i < data.length; i++) {
			if (data[i - 1] < 0 && data[i] >= 0) {
				zeroCrossings++;
			}
		}
		return (zeroCrossings * sampleRate) / (2 * data.length);
	};

	onMounted(() => {
		initAudio();
	});

	onUnmounted(() => {
		if (audioContext.value) {
			audioContext.value.close();
		}
	});

	return {
		soundData,
	};
}
