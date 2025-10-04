import { create } from 'zustand';
import { localForageManager, StoredSession, FlowStepData } from '@/services/LocalForageManager';

export interface FlowSessionState {
	// Current session data
	currentSession: StoredSession | null;
	sessionId: string | null;

	// Flow state
	currentStep: string | null;
	flowSteps: Record<string, FlowStepData>;
	isFlowActive: boolean;

	// Loading states
	isLoading: boolean;
	error: string | null;

	// Actions
	initializeSession: (sessionId?: string) => Promise<void>;
	startFlow: (flowName: string, steps: string[]) => Promise<void>;
	updateStepData: (stepId: string, data: any) => Promise<void>;
	completeStep: (stepId: string) => Promise<void>;
	nextStep: () => Promise<void>;
	previousStep: () => Promise<void>;
	clearSession: () => Promise<void>;

	// Additional functions needed by useFlowSession
	setCurrentStep: (stepId: string) => void;
	updateFlowStep: (stepId: string, stepName: string, data: any, completed?: boolean) => Promise<void>;
	completeFlowStep: (stepId: string) => Promise<void>;
	clearFlowStep: (stepId: string) => Promise<void>;
	getFlowStep: (stepId: string) => FlowStepData | null;
	getAllFlowSteps: () => FlowStepData[];
	updateSession: (sessionData: Partial<StoredSession>) => Promise<void>;
	loadSession: (sessionId: string) => Promise<void>;
	setError: (error: string | null) => void;

	// Initialize flow with ticket data
	initializeFlowWithTicket: (ticketData: any) => Promise<string>;

	// Get current flow session ID
	getFlowSession: () => string | null;
}

export const useFlowSessionStore = create<FlowSessionState>()((set, get) => ({
	// Initial state
	currentSession: null,
	sessionId: null,
	currentStep: null,
	flowSteps: {},
	isFlowActive: false,
	isLoading: false,
	error: null,

	// Initialize session
	initializeSession: async (sessionId?: string) => {
		const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		set({
			sessionId: newSessionId,
			isLoading: true
		});

		try {
			// Create new session
			const newSession: StoredSession = {
				sessionId: newSessionId,
				userId: '',
				createdAt: Date.now(),
				lastUpdated: Date.now()
			};

			set({
				currentSession: newSession,
				isLoading: false
			});

			console.log('✅ Created new session:', newSessionId);
		} catch (error) {
			console.error('❌ Error initializing session:', error);
			set({ isLoading: false });
		}
	},

	// Start flow
	startFlow: async (flowName: string, steps: string[]) => {
		const { currentSession, sessionId } = get();

		if (!currentSession || !sessionId) {
			console.error('❌ No active session');
			return;
		}

		const updatedSession: StoredSession = {
			...currentSession,
			flowData: {
				flowName,
				steps
			},
			lastUpdated: Date.now()
		};

		// Initialize flow steps
		const flowSteps: Record<string, FlowStepData> = {};
		steps.forEach(stepId => {
			flowSteps[stepId] = {
				stepId,
				stepName: stepId,
				data: {},
				completed: false,
				timestamp: Date.now()
			};
		});

		set({
			currentSession: updatedSession,
			flowSteps,
			isFlowActive: true,
			currentStep: steps[0] || null
		});

		console.log('✅ Flow started:', flowName, steps);
	},

	// Update step data
	updateStepData: async (stepId: string, data: any) => {
		const { flowSteps } = get();

		if (!flowSteps[stepId]) {
			console.error('❌ Step not found:', stepId);
			return;
		}

		const updatedStep: FlowStepData = {
			...flowSteps[stepId],
			data,
			timestamp: Date.now()
		};

		set({
			flowSteps: {
				...flowSteps,
				[stepId]: updatedStep
			}
		});

		console.log('📝 Step data updated:', stepId);
	},

	// Complete step
	completeStep: async (stepId: string) => {
		const { flowSteps } = get();

		if (!flowSteps[stepId]) {
			console.error('❌ Step not found:', stepId);
			return;
		}

		const updatedStep: FlowStepData = {
			...flowSteps[stepId],
			completed: true,
			timestamp: Date.now()
		};

		set({
			flowSteps: {
				...flowSteps,
				[stepId]: updatedStep
			}
		});

		console.log('✅ Step completed:', stepId);
	},

	// Next step
	nextStep: async () => {
		const { currentStep, currentSession } = get();

		if (!currentStep || !currentSession || !currentSession.flowData) {
			console.error('❌ No active step or session');
			return;
		}

		const currentIndex = currentSession.flowData.steps.indexOf(currentStep);
		const nextStep = currentSession.flowData.steps[currentIndex + 1];

		if (nextStep) {
			set({ currentStep: nextStep });
			console.log('➡️ Moved to next step:', nextStep);
		} else {
			console.log('🏁 Flow completed');
		}
	},

	// Previous step
	previousStep: async () => {
		const { currentStep, currentSession } = get();

		if (!currentStep || !currentSession || !currentSession.flowData) {
			console.error('❌ No active step or session');
			return;
		}

		const currentIndex = currentSession.flowData.steps.indexOf(currentStep);
		const previousStep = currentSession.flowData.steps[currentIndex - 1];

		if (previousStep) {
			set({ currentStep: previousStep });
			console.log('⬅️ Moved to previous step:', previousStep);
		}
	},

	// Clear session
	clearSession: async () => {
		try {
			// Clear local state
			set({
				currentSession: null,
				sessionId: null,
				currentStep: null,
				flowSteps: {},
				isFlowActive: false,
				isLoading: false,
				error: null
			});

			console.log('🧹 Session cleared');
		} catch (error) {
			console.error('❌ Error clearing session:', error);
		}
	},

	// Set current step
	setCurrentStep: (stepId: string) => {
		set({ currentStep: stepId });
		console.log('✅ Current step set to:', stepId);
	},

	// Update flow step
	updateFlowStep: async (stepId: string, stepName: string, data: any, completed: boolean = false) => {
		try {
			const stepData: FlowStepData = {
				stepId,
				stepName,
				data,
				completed,
				timestamp: Date.now()
			};

			// Update local state
			set(state => ({
				flowSteps: {
					...state.flowSteps,
					[stepId]: stepData
				}
			}));

			console.log('✅ Flow step updated:', stepId);
		} catch (error) {
			console.error('❌ Error updating flow step:', error);
			set({ error: 'Failed to update flow step' });
		}
	},

	// Complete flow step
	completeFlowStep: async (stepId: string) => {
		try {
			const currentSteps = get().flowSteps;
			const step = currentSteps[stepId];

			if (step) {
				const updatedStep = { ...step, completed: true, timestamp: Date.now() };

				set(state => ({
					flowSteps: {
						...state.flowSteps,
						[stepId]: updatedStep
					}
				}));

				console.log('✅ Flow step completed:', stepId);
			}
		} catch (error) {
			console.error('❌ Error completing flow step:', error);
			set({ error: 'Failed to complete flow step' });
		}
	},

	// Clear flow step
	clearFlowStep: async (stepId: string) => {
		try {
			// Remove from local state
			set(state => {
				const updated = { ...state.flowSteps } as Record<string, FlowStepData>;
				delete updated[stepId];
				return { flowSteps: updated } as any;
			});

			console.log('🗑️ Flow step cleared:', stepId);
		} catch (error) {
			console.error('❌ Error clearing flow step:', error);
			set({ error: 'Failed to clear flow step' });
		}
	},

	// Get flow step
	getFlowStep: (stepId: string) => {
		return get().flowSteps[stepId] || null;
	},

	// Get all flow steps
	getAllFlowSteps: () => {
		return Object.values(get().flowSteps);
	},

	// Update session
	updateSession: async (sessionData: Partial<StoredSession>) => {
		try {
			const currentSession = get().currentSession;
			if (currentSession) {
				const updatedSession = { ...currentSession, ...sessionData };

				set({ currentSession: updatedSession });

				console.log('✅ Session updated');
			}
		} catch (error) {
			console.error('❌ Error updating session:', error);
			set({ error: 'Failed to update session' });
		}
	},

	// Load session
	loadSession: async (sessionId: string) => {
		try {
			set({ isLoading: true });

			// Load from LocalForage
			const session = await localForageManager.getSession(sessionId);
			if (session) {
				set({
					currentSession: session,
					sessionId: sessionId,
					isFlowActive: true,
					isLoading: false
				});

				console.log('✅ Session loaded:', sessionId);
			} else {
				set({ error: 'Session not found', isLoading: false });
			}
		} catch (error) {
			console.error('❌ Error loading session:', error);
			set({ error: 'Failed to load session', isLoading: false });
		}
	},


	// Set error
	setError: (error: string | null) => {
		set({ error });
	},

	// Initialize flow with ticket data
	initializeFlowWithTicket: async (ticketData: any) => {
		const sessionId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		set({
			sessionId,
			isLoading: true,
			error: null
		});

		try {
			// Create new session with ticket data
			const newSession: StoredSession = {
				sessionId,
				userId: '',
				createdAt: Date.now(),
				lastUpdated: Date.now(),
				data: {
					ticketData,
					flowType: 'ticket_purchase'
				}
			};

			// Initialize flow steps for ticket purchase
			const flowSteps: Record<string, FlowStepData> = {
				'seat-selection': {
					stepId: 'seat-selection',
					stepName: 'انتخاب صندلی',
					data: null,
					completed: false,
					timestamp: Date.now()
				},
				'passenger-details': {
					stepId: 'passenger-details',
					stepName: 'مشخصات مسافران',
					data: null,
					completed: false,
					timestamp: Date.now()
				},
				'confirmation': {
					stepId: 'confirmation',
					stepName: 'تأیید اطلاعات',
					data: null,
					completed: false,
					timestamp: Date.now()
				},
				'payment': {
					stepId: 'payment',
					stepName: 'پرداخت',
					data: null,
					completed: false,
					timestamp: Date.now()
				},
				'ticket-issue': {
					stepId: 'ticket-issue',
					stepName: 'صدور بلیط',
					data: null,
					completed: false,
					timestamp: Date.now()
				}
			};

			set({
				currentSession: newSession,
				currentStep: 'seat-selection',
				flowSteps,
				isFlowActive: true,
				isLoading: false
			});

			console.log('✅ Flow initialized with ticket data:', sessionId);
			return sessionId;

		} catch (error) {
			console.error('❌ Error initializing flow with ticket:', error);
			set({
				error: 'Failed to initialize ticket flow',
				isLoading: false
			});
			throw error;
		}
	},

	// Get current flow session ID
	getFlowSession: () => {
		const state = get();
		return state.sessionId;
	}
}));