import store from 'store2';

// Set expiration time to 23 hours for Production 
const EXPIRATION_TIME = 23 * 60 * 60 * 1000; // 23 hours
// Helper function to set item with expiration
const setWithExpiry = (key: string, value: any, expirationMs: number = EXPIRATION_TIME) => {
	const item = {
		value: value,
		expiry: Date.now() + expirationMs
	};
	store.set(key, item);
};

// Helper function to get item and check expiration
const getWithExpiry = (key: string): any => {
	const item = store.get(key);

	if (!item) {
		return null;
	}

	// Check if expired
	if (Date.now() > item.expiry) {
		store.remove(key);
		return null; // This line was missing - should return null after removing
	}

	return item.value;
};

export const storage = {
	// Store source city
	setSourceCity(cityId: string, cityName: string): void {
		setWithExpiry('sourceCityId', cityId);
		setWithExpiry('sourceCityName', cityName);
		console.log('Stored source city:', { cityId, cityName, expiresIn: '1 minute' });
	},

	// Store destination city
	setDestinationCity(cityId: string, cityName: string): void {
		setWithExpiry('destinationCityId', cityId);
		setWithExpiry('destinationCityName', cityName);
		console.log('Stored destination city:', { cityId, cityName, expiresIn: '1 minute' });
	},

	// Store travel date
	setTravelDate(date: string): void {
		setWithExpiry('TravelDate', date);
		console.log('Stored travel date:', { date, expiresIn: '1 minute' });
	},

	// Get source city
	getSourceCity(): { id: string | null; name: string | null } {
		const id = getWithExpiry('sourceCityId');
		const name = getWithExpiry('sourceCityName');
		return { id, name };
	},

	// Get destination city
	getDestinationCity(): { id: string | null; name: string | null } {
		const id = getWithExpiry('destinationCityId');
		const name = getWithExpiry('destinationCityName');
		return { id, name };
	},

	// Get travel date
	getTravelDate(): string | null {
		return getWithExpiry('TravelDate');
	},

	// Remove source city
	removeSourceCity(): void {
		store.remove('sourceCityId');
		store.remove('sourceCityName');
		console.log('Removed source city from storage');
	},

	// Remove destination city
	removeDestinationCity(): void {
		store.remove('destinationCityId');
		store.remove('destinationCityName');
		console.log('Removed destination city from storage');
	},

	// Remove travel date
	removeTravelDate(): void {
		store.remove('TravelDate');
		console.log('Removed travel date from storage');
	},

	// Clear all stored values
	clearAll(): void {
		this.removeSourceCity();
		this.removeDestinationCity();
		this.removeTravelDate();
	},

	// Clean up expired items
	cleanup(): void {
		const keys = ['sourceCityId', 'sourceCityName', 'destinationCityId', 'destinationCityName', 'TravelDate'];

		keys.forEach(key => {
			const item = store.get(key);
			if (item && item.expiry && Date.now() > item.expiry) {
				store.remove(key);
				console.log(`Cleaned up expired item: ${key}`);
			}
		});
	},

	// Check if items are expired
	checkExpiration(): {
		sourceExpired: boolean;
		destinationExpired: boolean;
		travelDateExpired: boolean;
	} {
		return {
			sourceExpired: getWithExpiry('sourceCityId') === null,
			destinationExpired: getWithExpiry('destinationCityId') === null,
			travelDateExpired: getWithExpiry('TravelDate') === null
		};
	},

	// Get expiration status with time remaining
	getExpirationStatus(): {
		source: { expired: boolean; remainingSeconds: number };
		destination: { expired: boolean; remainingSeconds: number };
		travelDate: { expired: boolean; remainingSeconds: number };
	} {
		const checkRemaining = (key: string) => {
			const item = store.get(key);
			if (!item || !item.expiry) {
				return { expired: true, remainingSeconds: 0 };
			}

			const remaining = item.expiry - Date.now();
			if (remaining <= 0) {
				return { expired: true, remainingSeconds: 0 };
			}

			return { expired: false, remainingSeconds: Math.floor(remaining / 1000) };
		};

		return {
			source: checkRemaining('sourceCityId'),
			destination: checkRemaining('destinationCityId'),
			travelDate: checkRemaining('TravelDate')
		};
	}
};