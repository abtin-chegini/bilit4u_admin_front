import { SeatState } from "../seat/seat";

export interface SeatIconProps {
	state: SeatState;
	isVertical?: boolean;
}

export const SeatIcon: React.FC<SeatIconProps> = ({ state, isVertical = false }) => {
	const colors = {
		default: {
			fill: "#F7F9FA",
			stroke: "#CCD6E1"
		},
		"reserved-male": {
			fill: "#CEDFF7",
			stroke: "#4379C4"
		},
		"reserved-female": {
			fill: "#CEF7DE",
			stroke: "#43C45F"
		},
		"selected-male": {
			fill: "#0D5890",
			stroke: "white"
		},
		"selected-female": {
			fill: "#0D5890",
			stroke: "white"
		}
	};

	const { fill, stroke } = colors[state];

	// For vertical orientation (mobile) - pointing upward
	if (isVertical) {
		return (
			<svg
				className="w-full h-full"
				viewBox="0 0 57 53"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Main seat body */}
				<rect
					x="8.5"
					y="1"
					width="39.5244"
					height="45.2151"
					rx="3.5"
					fill={fill}
					stroke={stroke}
				/>

				{/* Right arm */}
				<rect
					x="42"
					y="12"
					width="14"
					height="34"
					rx="3.5"
					fill={fill}
					stroke={stroke}
				/>

				{/* Left arm */}
				<rect
					x="1"
					y="12"
					width="14"
					height="34"
					rx="3.5"
					fill={fill}
					stroke={stroke}
				/>

				{/* Back/bottom part */}
				<rect
					x="8.5"
					y="41"
					width="39.5"
					height="11"
					rx="3.5"
					fill={fill}
					stroke={stroke}
				/>
			</svg>
		);
	}

	// For horizontal orientation (desktop)
	return (
		<svg
			className="w-full h-full"
			viewBox="0 0 53 57"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="1.00098"
				y="8.81641"
				width="45.2151"
				height="39.5244"
				rx="3.5"
				fill={fill}
				stroke={stroke}
			/>
			<rect
				x="12.0547"
				y="41.873"
				width="34.1637"
				height="13.9301"
				rx="3.5"
				fill={fill}
				stroke={stroke}
			/>
			<rect
				x="12.0547"
				y="1.35059"
				width="34.1637"
				height="13.9301"
				rx="3.5"
				fill={fill}
				stroke={stroke}
			/>
			<rect
				x="41.1904"
				y="6.67969"
				width="11.0561"
				height="41.6573"
				rx="3.5"
				fill={fill}
				stroke={stroke}
			/>
		</svg>
	);
};