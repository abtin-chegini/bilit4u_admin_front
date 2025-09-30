import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import jMoment from "jalali-moment";
import { storage } from "@/lib/StoreStateKeeper";

interface TravelDateState {
	// The selected travel date as a string in jYYYYjMMjDD format
	travelDate: string | null;

	// Function to set the travel date
	setTravelDate: (date: string) => void;

	// Function to clear the travel date
	clearTravelDate: () => void;

	// Function to set travel date to today
	setToToday: () => void;

	// Function to check if the stored date is valid
	isDateValid: () => boolean;

	// Function to get the date as a jMoment object
	getTravelDateAsMoment: () => jMoment.Moment | null;

	// Time remaining before expiration (in minutes and seconds)
	getTimeRemaining: () => { hours: number, minutes: number, seconds: number };

	// Flag to track if date was manually cleared
	wasManuallyCleared: boolean;

	// Get today's date WITHOUT updating the store
	getTodayFormatted: () => string;
}

// Create the store
export const useTravelDateStore = create<TravelDateState>()(
	persist(
		(set, get) => ({
			travelDate: null,
			wasManuallyCleared: false,

			// Get today's formatted date without side effects
			getTodayFormatted: () => {
				return jMoment().locale('fa').format("jYYYYjMMjDD");
			},

			setTravelDate: (date: string) => {
				console.log("Setting travel date to:", date);
				set({
					travelDate: date,
					wasManuallyCleared: false
				});

				// Save to StoreStateKeeper with expiration
				storage.setTravelDate(date);
			},

			clearTravelDate: () => {
				console.log("Manually clearing travel date");
				set({
					travelDate: null,
					wasManuallyCleared: true
				});

				// Clear from StoreStateKeeper
				storage.removeTravelDate();
			},

			setToToday: () => {
				const today = jMoment().locale('fa');
				const formattedDate = today.format("jYYYYjMMjDD");
				console.log("Setting travel date to today:", formattedDate);
				set({
					travelDate: formattedDate,
					wasManuallyCleared: false
				});

				// Save to StoreStateKeeper with expiration
				storage.setTravelDate(formattedDate);
			},

			isDateValid: () => {
				const { travelDate, wasManuallyCleared } = get();

				// If manually cleared, it's not valid
				if (wasManuallyCleared === true) {
					console.log("Date invalid: manually cleared");
					return false;
				}

				// Check StoreStateKeeper for expiration
				const storedDate = storage.getTravelDate();
				if (!storedDate) {
					console.log("Date invalid in StoreStateKeeper: expired or not found");
					// Update zustand state to match
					if (travelDate && !wasManuallyCleared) {
						set({
							travelDate: null
						});
					}
					return false;
				}

				// Check jalali date validity
				try {
					const parsedDate = jMoment(storedDate, "jYYYYjMMjDD");
					return parsedDate.isValid();
				} catch (error) {
					console.log("Error validating date:", error);
					return false;
				}
			},

			getTravelDateAsMoment: () => {
				const { isDateValid } = get();

				// First check if date is valid (this will sync with StoreStateKeeper)
				if (!isDateValid()) {
					return null;
				}

				// Get the date from StoreStateKeeper
				const storedDate = storage.getTravelDate();
				if (!storedDate) {
					return null;
				}

				try {
					return jMoment(storedDate, "jYYYYjMMjDD").locale('fa');
				} catch (error) {
					console.error("Error parsing date:", error);
					return null;
				}
			},

			// Get remaining time - delegates to StoreStateKeeper
			getTimeRemaining: () => {
				const { travelDate, wasManuallyCleared } = get();

				// If manually cleared or no date, no time remaining
				if (!travelDate || wasManuallyCleared) {
					return { hours: 0, minutes: 0, seconds: 0 };
				}

				// Get expiration status from StoreStateKeeper
				const expirationStatus = storage.getExpirationStatus();
				if (expirationStatus.travelDate.expired) {
					return { hours: 0, minutes: 0, seconds: 0 };
				}

				// Calculate hours, minutes, seconds from remaining seconds
				const remainingSeconds = expirationStatus.travelDate.remainingSeconds;
				const hours = Math.floor(remainingSeconds / 3600);
				const minutes = Math.floor((remainingSeconds % 3600) / 60);
				const seconds = remainingSeconds % 60;

				return { hours, minutes, seconds };
			}
		}),
		{
			name: "travel-date-storage",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				travelDate: state.travelDate,
				wasManuallyCleared: state.wasManuallyCleared
			}),
			onRehydrateStorage: () => (state) => {
				if (!state) return;

				console.log("Rehydrating travel date state:", {
					travelDate: state.travelDate,
					wasManuallyCleared: state.wasManuallyCleared
				});

				// Initialize wasManuallyCleared if undefined
				if (state.wasManuallyCleared === undefined) {
					state.wasManuallyCleared = false;
				}

				// Check StoreStateKeeper first
				const storedDate = storage.getTravelDate();

				// If manually cleared, keep it null
				if (state.wasManuallyCleared === true) {
					console.log("Date was manually cleared, keeping it null");
					state.travelDate = null;
				}
				// If not in StoreStateKeeper (expired), clear it
				else if (!storedDate) {
					console.log("Date not found in StoreStateKeeper, clearing");
					state.travelDate = null;
				}
				// If in StoreStateKeeper, sync with that value
				else if (storedDate) {
					state.travelDate = storedDate;
				}
			}
		}
	)
);