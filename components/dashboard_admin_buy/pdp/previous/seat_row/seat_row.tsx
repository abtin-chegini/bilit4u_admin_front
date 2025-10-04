import { Seat, SeatState } from '../seat/seat';
import { useTicketStore } from '@/store/TicketStore';

interface SeatData {
	id: number;
	seatNo: string | number;
	state: SeatState;
	isAvailable: boolean;
	invisible?: boolean;
}

interface SeatRowProps {
	seats: SeatData[];
	layout?: "rtl" | "vertical";
	emptyIndices?: number[];
	maxSelectable?: number;
	readOnly?: boolean;
	forceReadOnly?: boolean;
}

export const SeatRow: React.FC<SeatRowProps> = ({
	seats,
	layout = "rtl",
	emptyIndices = [],
	maxSelectable = 4,
	readOnly = false,
	forceReadOnly = false
}) => {
	const selectedSeats = useTicketStore(state => state.selectedSeats);
	const isMaxSeatsSelected = selectedSeats.length >= maxSelectable;

	// Check if this row contains only seats with seatNo = 0
	const isZeroOnlyRow = seats.length > 0 && seats.every(seat =>
		seat.seatNo === 0 || seat.seatNo === "0" || seat.invisible
	);

	// Add empty slots at specified indices
	const seatsWithSpaces = [...seats];

	// Insert empty spaces from highest index to lowest to avoid index shifting
	[...emptyIndices].sort((a, b) => b - a).forEach((index, emptySlotIndex) => {
		if (index >= 0 && index <= seatsWithSpaces.length) {
			seatsWithSpaces.splice(index, 0, {
				id: -(emptySlotIndex + 1000), // Generate unique negative IDs for empty spaces
				seatNo: '',
				state: 'default',
				isAvailable: false,
				invisible: true
			});
		}
	});

	// Vertical Layout Section
	if (layout === "vertical") {
		return (
			<div className="flex flex-col gap-2 ">
				{seatsWithSpaces.map((seat, index) => (
					<div key={seat.id < 0 ? `empty-${Math.abs(seat.id)}-${index}` : `seat-${seat.id}`}>
						{seat.invisible ? (
							<div className={`${isZeroOnlyRow ? 'w-10 h-6 xs:w-12 xs:h-6 sm:w-12 sm:h-6 md:w-11 md:h-6' : 'w-10 h-10 xs:w-12 xs:h-12 sm:w-12 sm:h-12 md:w-11 md:h-11'}`}></div>
						) : (
							<Seat
								id={seat.id}
								seatNo={seat.seatNo}
								state={seat.state}
								isAvailable={seat.isAvailable}
								disabled={isMaxSeatsSelected && !selectedSeats.some(s => s.id === seat.id)}
								maxSelectable={maxSelectable}
								layout={layout}
								readOnly={readOnly || forceReadOnly}
							/>
						)}
					</div>
				))}
			</div>
		);
	}

	// Horizontal Layout Section (RTL)
	return (
		<div className="flex flex-row gap-2">
			{seatsWithSpaces.map((seat, index) => (
				<div key={seat.id < 0 ? `empty-${Math.abs(seat.id)}-${index}` : `seat-${seat.id}`}>
					{seat.invisible ? (
						<div className={`${isZeroOnlyRow ? 'w-10 h-6 xs:w-12 xs:h-6 sm:w-12 sm:h-6 md:w-11 md:h-6' : 'w-10 h-10 xs:w-12 xs:h-12 sm:w-12 sm:h-12 md:w-11 md:h-11'}`}></div>
					) : (
						<Seat
							id={seat.id}
							seatNo={seat.seatNo}
							state={seat.state}
							isAvailable={seat.isAvailable}
							disabled={isMaxSeatsSelected && !selectedSeats.some(s => s.id === seat.id)}
							maxSelectable={maxSelectable}
							layout={layout}
							readOnly={readOnly || forceReadOnly}
						/>
					)}
				</div>
			))}
		</div>
	);
};