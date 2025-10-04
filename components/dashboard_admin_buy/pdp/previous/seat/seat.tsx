import { SeatIcon } from '@/components/dashboard_admin_buy/pdp/previous/seat_Icon/seat_icon';
import { useTicketStore } from '@/store/TicketStore';
import { useScreenSize } from '@/hooks/useScreenSize';

export function toPersianDigits(input: string | number): string {
	const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	return input.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit, 10)]);
}

export type SeatState =
	| "default"
	| "reserved-male"
	| "reserved-female"
	| "selected-male"
	| "selected-female";

interface SeatProps {
	id: number;
	seatNo: string | number;
	state: SeatState;
	isAvailable: boolean;
	disabled?: boolean;
	maxSelectable?: number;
	layout?: "rtl" | "vertical";
	readOnly?: boolean;
	forceReadOnly?: boolean;
	isHighlighted?: boolean;
}

export const Seat: React.FC<SeatProps> = ({
	id,
	seatNo,
	state,
	isAvailable,
	disabled = false,
	maxSelectable = 4,
	layout = "rtl",
	readOnly = false,
	forceReadOnly = false,
	isHighlighted = false
}) => {
	// Get the handleSeatClick function directly from the store
	const handleSeatClick = useTicketStore(state => state.handleSeatClick);
	const screenSize = useScreenSize();
	const isMobile = screenSize === 'xs' || screenSize === 'sm';

	// Determine if seat is in complete readonly mode
	const isReadOnly = readOnly || forceReadOnly;

	const getLabel = () => {
		// Show text based on seat state
		switch (state) {
			case 'selected-female':
			case 'reserved-female':
				return 'خانم';
			case 'selected-male':
			case 'reserved-male':
				return 'آقا';
			default:
				// Convert the seat number to Persian digits
				return toPersianDigits(seatNo);
		}
	};


	// Simplified click handler that uses the store's handleSeatClick
	const onClick = () => {
		// Don't do anything if in readonly mode
		if (isReadOnly) {
			return;
		}

		// Otherwise check standard availability
		if (!isAvailable || disabled) {
			return;
		}

		// Use the centralized handler that returns the new state
		handleSeatClick(id, state, seatNo, maxSelectable);
	};

	// Determine rotation based on layout
	const rotationClass = layout === "vertical" ? "rotate-0" : "";

	// Make seat bigger on mobile
	const sizeClass = isMobile ? "w-12 h-12 md:w-12 md:h-12" : "xs:w-14 xs:h-14 sm:w-14 sm:h-14 md:w-12 md:h-12";

	return (
		<button
			onClick={onClick}
			className={`
                relative
                ${sizeClass}
                flex items-center justify-center
                rounded transition
                
                ${isReadOnly ? 'cursor-default' : !isAvailable || disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-105'}
                ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}
            `}
			disabled={isReadOnly || disabled || !isAvailable}
			aria-label={`صندلی شماره ${seatNo}`}
			tabIndex={isReadOnly ? -1 : 0}
			type={isReadOnly ? "button" : "button"}
			aria-readonly={isReadOnly}
		>
			<SeatIcon
				state={state}
				isVertical={layout === "vertical"}
			/>
			<span
				className={`seat-label ${isMobile ? 'mobile' : 'desktop'} ${state}`}
			>
				{getLabel()}
			</span>
		</button>
	);
}