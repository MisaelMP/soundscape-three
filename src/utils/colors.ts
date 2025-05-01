export const generatePastelColor = (): string => {
	const hue = Math.floor(Math.random() * 360);
	return `hsl(${hue}, 70%, 85%)`;
};
