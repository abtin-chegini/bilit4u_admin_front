import localforage from 'localforage';

// Interface for stored data structure
interface StorageData {
	value: any;
	expiresAt: number | null;
	timestamp: number;
	sessionId: string;
}

// Fallback storage service using LocalForage + localStorage
export class FallbackStorageService {
	private static instance: FallbackStorageService;
	private storage: LocalForage;
	private sessionId: string;

	constructor(sessionId: string) {
		this.sessionId = sessionId;
		this.storage = localforage.createInstance({
			driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE], // Fallback chain
			name: 'bilit4u-fallback-storage',
			storeName: `session_${sessionId}`,
			description: 'Fallback storage when Redis is unavailable'
		});
	}

	static getInstance(sessionId: string): FallbackStorageService {
		if (!FallbackStorageService.instance || FallbackStorageService.instance.sessionId !== sessionId) {
			FallbackStorageService.instance = new FallbackStorageService(sessionId);
		}
		return FallbackStorageService.instance;
	}

	// Store data with expiration
	async setData(key: string, data: any, expiresIn?: number): Promise<boolean> {
		try {
			const storageData: StorageData = {
				value: data,
				expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : null,
				timestamp: Date.now(),
				sessionId: this.sessionId
			};

			await this.storage.setItem(key, storageData);

			// Also store in localStorage for immediate access
			if (typeof window !== 'undefined') {
				localStorage.setItem(`fallback_${this.sessionId}_${key}`, JSON.stringify(storageData));
			}

			console.log(`✅ Data stored in fallback storage: ${key}`);
			return true;

		} catch (error) {
			console.error('❌ Failed to store data in fallback storage:', error);
			return false;
		}
	}

	// Retrieve data
	async getData(key: string): Promise<any> {
		try {
			// Try LocalForage first
			let storageData = await this.storage.getItem(key) as StorageData | null;

			// Fallback to localStorage if LocalForage fails
			if (!storageData && typeof window !== 'undefined') {
				const localData = localStorage.getItem(`fallback_${this.sessionId}_${key}`);
				if (localData) {
					storageData = JSON.parse(localData) as StorageData;
				}
			}

			if (!storageData) {
				return null;
			}

			// Check expiration
			if (storageData.expiresAt && Date.now() > storageData.expiresAt) {
				await this.removeData(key);
				return null;
			}

			return storageData.value;

		} catch (error) {
			console.error('❌ Failed to retrieve data from fallback storage:', error);
			return null;
		}
	}

	// Remove data
	async removeData(key: string): Promise<boolean> {
		try {
			await this.storage.removeItem(key);

			// Also remove from localStorage
			if (typeof window !== 'undefined') {
				localStorage.removeItem(`fallback_${this.sessionId}_${key}`);
			}

			console.log(`🗑️ Data removed from fallback storage: ${key}`);
			return true;

		} catch (error) {
			console.error('❌ Failed to remove data from fallback storage:', error);
			return false;
		}
	}

	// Get all keys for current session
	async getAllKeys(): Promise<string[]> {
		try {
			const keys: string[] = [];
			await this.storage.iterate((value, key) => {
				keys.push(key);
			});
			return keys;
		} catch (error) {
			console.error('❌ Failed to get all keys from fallback storage:', error);
			return [];
		}
	}

	// Clear all data for current session
	async clearAllData(): Promise<boolean> {
		try {
			await this.storage.clear();

			// Also clear from localStorage
			if (typeof window !== 'undefined') {
				const keys = Object.keys(localStorage);
				keys.forEach(key => {
					if (key.startsWith(`fallback_${this.sessionId}_`)) {
						localStorage.removeItem(key);
					}
				});
			}

			console.log(`🧹 All fallback data cleared for session: ${this.sessionId}`);
			return true;

		} catch (error) {
			console.error('❌ Failed to clear fallback storage:', error);
			return false;
		}
	}

	// Get storage info
	async getStorageInfo(): Promise<{
		keys: number;
		size: number;
		available: boolean;
	}> {
		try {
			const keys = await this.getAllKeys();
			const size = await this.storage.length();

			return {
				keys: keys.length,
				size,
				available: true
			};
		} catch (error) {
			return {
				keys: 0,
				size: 0,
				available: false
			};
		}
	}
}

// Helper function to create fallback storage instance
export function createFallbackStorage(sessionId: string): FallbackStorageService {
	return FallbackStorageService.getInstance(sessionId);
}
