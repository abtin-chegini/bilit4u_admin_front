import localforage from 'localforage';

// Configure localForage with fallback
localforage.config({
	driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE], // Fallback chain
	name: 'Bilit4U',
	version: 1.0,
	storeName: 'bilit4u_storage',
	description: 'Bilit4U application storage'
});

export interface StoredSession {
	sessionId: string;
	userId: string;
	createdAt: number;
	lastUpdated: number;
	ticketData?: any;
	flowData?: any;
}

export interface FlowStepData {
	stepId: string;
	stepName: string;
	data: any;
	completed: boolean;
	timestamp: number;
}

export class LocalForageManager {
	private static instance: LocalForageManager;
	private store: LocalForage;

	private constructor() {
		this.store = localforage.createInstance({
			name: 'Bilit4U_Flow',
			storeName: 'flow_sessions'
		});
	}

	public static getInstance(): LocalForageManager {
		if (!LocalForageManager.instance) {
			LocalForageManager.instance = new LocalForageManager();
		}
		return LocalForageManager.instance;
	}

	// Generate unique session object ID
	public generateSessionObjectId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substr(2, 9);
		return `session_obj_${timestamp}_${random}`;
	}

	// Store session with object ID
	public async storeSession(sessionData: Omit<StoredSession, 'createdAt' | 'lastUpdated'>): Promise<string> {
		const sessionObjectId = this.generateSessionObjectId();
		const session: StoredSession = {
			...sessionData,
			createdAt: Date.now(),
			lastUpdated: Date.now()
		};

		try {
			await this.store.setItem(sessionData.sessionId, session);
			console.log('✅ Session stored in localForage:', { sessionId: sessionData.sessionId, sessionObjectId });
			return sessionObjectId;
		} catch (error) {
			console.error('❌ Failed to store session in localForage:', error);
			throw error;
		}
	}

	// Get session by session ID
	public async getSession(sessionId: string): Promise<StoredSession | null> {
		try {
			const session = await this.store.getItem<StoredSession>(sessionId);
			return session;
		} catch (error) {
			console.error('❌ Failed to get session from localForage:', error);
			return null;
		}
	}

	// Update session data
	public async updateSession(sessionId: string, updates: Partial<StoredSession>): Promise<boolean> {
		try {
			const existingSession = await this.getSession(sessionId);
			if (!existingSession) {
				console.warn('⚠️ Session not found for update:', sessionId);
				return false;
			}

			const updatedSession: StoredSession = {
				...existingSession,
				...updates,
				lastUpdated: Date.now()
			};

			await this.store.setItem(sessionId, updatedSession);
			console.log('✅ Session updated in localForage:', sessionId);
			return true;
		} catch (error) {
			console.error('❌ Failed to update session in localForage:', error);
			return false;
		}
	}

	// Store flow step data
	public async storeFlowStep(sessionId: string, stepData: FlowStepData): Promise<boolean> {
		try {
			const session = await this.getSession(sessionId);
			if (!session) {
				console.warn('⚠️ Session not found for flow step:', sessionId);
				return false;
			}

			// Initialize flowData if it doesn't exist
			if (!session.flowData) {
				session.flowData = {};
			}

			// Store the step data
			session.flowData[stepData.stepId] = stepData;

			// Update the session
			await this.updateSession(sessionId, { flowData: session.flowData });
			console.log('✅ Flow step stored:', { sessionId, stepId: stepData.stepId });
			return true;
		} catch (error) {
			console.error('❌ Failed to store flow step:', error);
			return false;
		}
	}

	// Get flow step data
	public async getFlowStep(sessionId: string, stepId: string): Promise<FlowStepData | null> {
		try {
			const session = await this.getSession(sessionId);
			if (!session || !session.flowData) {
				return null;
			}

			return session.flowData[stepId] || null;
		} catch (error) {
			console.error('❌ Failed to get flow step:', error);
			return null;
		}
	}

	// Get all flow steps for a session
	public async getAllFlowSteps(sessionId: string): Promise<FlowStepData[]> {
		try {
			const session = await this.getSession(sessionId);
			if (!session || !session.flowData) {
				return [];
			}

			return Object.values(session.flowData);
		} catch (error) {
			console.error('❌ Failed to get all flow steps:', error);
			return [];
		}
	}

	// Store ticket data
	public async storeTicketData(sessionId: string, ticketData: any): Promise<boolean> {
		try {
			await this.updateSession(sessionId, { ticketData });
			console.log('✅ Ticket data stored:', sessionId);
			return true;
		} catch (error) {
			console.error('❌ Failed to store ticket data:', error);
			return false;
		}
	}

	// Get ticket data
	public async getTicketData(sessionId: string): Promise<any> {
		try {
			const session = await this.getSession(sessionId);
			return session?.ticketData || null;
		} catch (error) {
			console.error('❌ Failed to get ticket data:', error);
			return null;
		}
	}

	// Get session object ID for session
	public async getSessionObjectId(sessionId: string): Promise<string | null> {
		try {
			const session = await this.getSession(sessionId);
			return session?.sessionId || null;
		} catch (error) {
			console.error('❌ Failed to get session object ID:', error);
			return null;
		}
	}

	// Clear session data
	public async clearSession(sessionId: string): Promise<boolean> {
		try {
			await this.store.removeItem(sessionId);
			console.log('✅ Session cleared from localForage:', sessionId);
			return true;
		} catch (error) {
			console.error('❌ Failed to clear session:', error);
			return false;
		}
	}

	// Get all sessions (for debugging)
	public async getAllSessions(): Promise<StoredSession[]> {
		try {
			const sessions: StoredSession[] = [];
			await this.store.iterate((value: StoredSession) => {
				sessions.push(value);
			});
			return sessions;
		} catch (error) {
			console.error('❌ Failed to get all sessions:', error);
			return [];
		}
	}

	// Clean up old sessions (older than 7 days)
	public async cleanupOldSessions(): Promise<number> {
		try {
			const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
			let cleanedCount = 0;

			await this.store.iterate((value: StoredSession, key: string) => {
				if (value.createdAt < cutoffTime) {
					this.store.removeItem(key);
					cleanedCount++;
				}
			});

			console.log(`🧹 Cleaned up ${cleanedCount} old sessions`);
			return cleanedCount;
		} catch (error) {
			console.error('❌ Failed to cleanup old sessions:', error);
			return 0;
		}
	}
}

// Export singleton instance
export const localForageManager = LocalForageManager.getInstance();
