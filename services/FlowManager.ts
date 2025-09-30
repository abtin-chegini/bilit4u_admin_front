import { secureSessionManager } from './SecureSessionManager';

// Types for flow management
export interface FlowStep {
	id: string;
	name: string;
	description?: string;
	isRequired: boolean;
	isCompleted: boolean;
	isSynced: boolean;
	data: any;
	validation?: (data: any) => boolean | string;
	dependencies?: string[];
	metadata?: {
		estimatedTime?: number; // minutes
		category?: string;
		priority?: 'low' | 'medium' | 'high';
		tags?: string[];
	};
}

export interface FlowConfig {
	id: string;
	name: string;
	description?: string;
	steps: FlowStep[];
	currentStepIndex: number;
	isCompleted: boolean;
	metadata?: {
		version: string;
		createdAt: number;
		lastModified: number;
		totalEstimatedTime?: number;
	};
}

export interface FlowProgress {
	totalSteps: number;
	completedSteps: number;
	currentStep: string;
	progressPercentage: number;
	estimatedTimeRemaining: number; // minutes
	canProceed: boolean;
	nextStep?: string;
	previousStep?: string;
}

export class FlowManager {
	private static instance: FlowManager;
	private currentFlow: FlowConfig | null = null;
	private flowHistory: FlowConfig[] = [];

	private constructor() { }

	public static getInstance(): FlowManager {
		if (!FlowManager.instance) {
			FlowManager.instance = new FlowManager();
		}
		return FlowManager.instance;
	}

	// Initialize a new flow
	async initializeFlow(
		flowId: string,
		flowName: string,
		steps: Omit<FlowStep, 'isCompleted' | 'isSynced'>[],
		description?: string
	): Promise<FlowConfig> {
		const now = Date.now();

		const flowConfig: FlowConfig = {
			id: flowId,
			name: flowName,
			description,
			steps: steps.map(step => ({
				...step,
				isCompleted: false,
				isSynced: false,
				data: step.data || {}
			})),
			currentStepIndex: 0,
			isCompleted: false,
			metadata: {
				version: '1.0',
				createdAt: now,
				lastModified: now,
				totalEstimatedTime: steps.reduce((total, step) =>
					total + (step.metadata?.estimatedTime || 0), 0
				)
			}
		};

		this.currentFlow = flowConfig;
		this.flowHistory.push(flowConfig);

		console.log('🚀 Flow initialized:', flowId, flowName);
		return flowConfig;
	}

	// Load existing flow from local storage
	async loadFlowFromStorage(flowId: string): Promise<FlowConfig | null> {
		try {
			// Try to load from flow history first
			const existingFlow = this.flowHistory.find(flow => flow.id === flowId);
			if (existingFlow) {
				this.currentFlow = existingFlow;
				console.log('📥 Flow loaded from history:', flowId);
				return this.currentFlow;
			}

			// Try to load from localStorage
			const storedFlow = localStorage.getItem(`flow_${flowId}`);
			if (storedFlow) {
				const flowData = JSON.parse(storedFlow);
				this.currentFlow = flowData;
				this.flowHistory.push(flowData);
				console.log('📥 Flow loaded from localStorage:', flowId);
				return this.currentFlow;
			}

			return null;
		} catch (error) {
			console.error('❌ Failed to load flow from storage:', error);
			return null;
		}
	}

	// Save current flow to localStorage
	async saveFlowToStorage(): Promise<boolean> {
		if (!this.currentFlow) {
			console.error('❌ No current flow to save');
			return false;
		}

		try {
			// Update metadata
			this.currentFlow.metadata!.lastModified = Date.now();

			// Save to localStorage
			localStorage.setItem(`flow_${this.currentFlow.id}`, JSON.stringify(this.currentFlow));

			console.log('💾 Flow saved to localStorage:', this.currentFlow.id);
			return true;
		} catch (error) {
			console.error('❌ Failed to save flow to localStorage:', error);
			return false;
		}
	}

	// Get current flow
	getCurrentFlow(): FlowConfig | null {
		return this.currentFlow;
	}

	// Get current step
	getCurrentStep(): FlowStep | null {
		if (!this.currentFlow || this.currentFlow.currentStepIndex >= this.currentFlow.steps.length) {
			return null;
		}
		return this.currentFlow.steps[this.currentFlow.currentStepIndex];
	}

	// Update current step data
	async updateCurrentStepData(data: any): Promise<boolean> {
		if (!this.currentFlow) {
			console.error('❌ No current flow');
			return false;
		}

		const currentStep = this.getCurrentStep();
		if (!currentStep) {
			console.error('❌ No current step');
			return false;
		}

		try {
			// Update step data
			currentStep.data = { ...currentStep.data, ...data };
			this.currentFlow.metadata!.lastModified = Date.now();

			// Save to localStorage
			await this.saveFlowToStorage();

			console.log('📝 Current step data updated:', currentStep.id);
			return true;
		} catch (error) {
			console.error('❌ Failed to update current step data:', error);
			return false;
		}
	}

	// Complete current step
	async completeCurrentStep(): Promise<boolean> {
		if (!this.currentFlow) {
			console.error('❌ No current flow');
			return false;
		}

		const currentStep = this.getCurrentStep();
		if (!currentStep) {
			console.error('❌ No current step');
			return false;
		}

		try {
			// Validate step data if validation function exists
			if (currentStep.validation) {
				const validationResult = currentStep.validation(currentStep.data);
				if (validationResult !== true) {
					console.error('❌ Step validation failed:', validationResult);
					return false;
				}
			}

			// Mark step as completed
			currentStep.isCompleted = true;
			this.currentFlow.metadata!.lastModified = Date.now();

			// Save to localStorage
			await this.saveFlowToStorage();

			console.log('✅ Current step completed:', currentStep.id);
			return true;
		} catch (error) {
			console.error('❌ Failed to complete current step:', error);
			return false;
		}
	}

	// Move to next step
	async moveToNextStep(): Promise<boolean> {
		if (!this.currentFlow) {
			console.error('❌ No current flow');
			return false;
		}

		// Check if current step is completed
		const currentStep = this.getCurrentStep();
		if (currentStep && !currentStep.isCompleted) {
			console.error('❌ Current step must be completed before moving to next');
			return false;
		}

		// Check dependencies
		const nextStepIndex = this.currentFlow.currentStepIndex + 1;
		if (nextStepIndex >= this.currentFlow.steps.length) {
			// Flow completed
			this.currentFlow.isCompleted = true;
			await this.saveFlowToStorage();
			console.log('🎉 Flow completed!');
			return true;
		}

		const nextStep = this.currentFlow.steps[nextStepIndex];

		// Check if dependencies are met
		if (nextStep.dependencies) {
			for (const depId of nextStep.dependencies) {
				const depStep = this.currentFlow.steps.find(s => s.id === depId);
				if (!depStep || !depStep.isCompleted) {
					console.error('❌ Dependencies not met for next step:', depId);
					return false;
				}
			}
		}

		// Move to next step
		this.currentFlow.currentStepIndex = nextStepIndex;
		this.currentFlow.metadata!.lastModified = Date.now();

		// Save to localStorage
		await this.saveFlowToStorage();

		console.log('➡️ Moved to next step:', nextStep.id);
		return true;
	}


	// Move to previous step
	async moveToPreviousStep(): Promise<boolean> {
		if (!this.currentFlow || this.currentFlow.currentStepIndex <= 0) {
			console.error('❌ Cannot move to previous step');
			return false;
		}

		this.currentFlow.currentStepIndex--;
		this.currentFlow.metadata!.lastModified = Date.now();

		// Save to localStorage
		await this.saveFlowToStorage();

		const currentStep = this.getCurrentStep();
		console.log('⬅️ Moved to previous step:', currentStep?.id);
		return true;
	}

	// Jump to specific step
	async jumpToStep(stepId: string): Promise<boolean> {
		if (!this.currentFlow) {
			console.error('❌ No current flow');
			return false;
		}

		const stepIndex = this.currentFlow.steps.findIndex(s => s.id === stepId);
		if (stepIndex === -1) {
			console.error('❌ Step not found:', stepId);
			return false;
		}

		// Check if all previous required steps are completed
		for (let i = 0; i < stepIndex; i++) {
			const step = this.currentFlow.steps[i];
			if (step.isRequired && !step.isCompleted) {
				console.error('❌ Cannot jump to step, previous required steps not completed');
				return false;
			}
		}

		this.currentFlow.currentStepIndex = stepIndex;
		this.currentFlow.metadata!.lastModified = Date.now();

		// Save to localStorage
		await this.saveFlowToStorage();

		console.log('🎯 Jumped to step:', stepId);
		return true;
	}

	// Get flow progress
	getFlowProgress(): FlowProgress {
		if (!this.currentFlow) {
			return {
				totalSteps: 0,
				completedSteps: 0,
				currentStep: '',
				progressPercentage: 0,
				estimatedTimeRemaining: 0,
				canProceed: false
			};
		}

		const completedSteps = this.currentFlow.steps.filter(s => s.isCompleted).length;
		const currentStep = this.getCurrentStep();
		const progressPercentage = Math.round((completedSteps / this.currentFlow.steps.length) * 100);

		// Calculate estimated time remaining
		const remainingSteps = this.currentFlow.steps.slice(this.currentFlow.currentStepIndex);
		const estimatedTimeRemaining = remainingSteps.reduce((total, step) =>
			total + (step.metadata?.estimatedTime || 0), 0
		);

		// Check if can proceed
		const canProceed = currentStep ?
			(currentStep.isCompleted || !currentStep.isRequired) : false;

		return {
			totalSteps: this.currentFlow.steps.length,
			completedSteps,
			currentStep: currentStep?.id || '',
			progressPercentage,
			estimatedTimeRemaining,
			canProceed,
			nextStep: this.currentFlow.steps[this.currentFlow.currentStepIndex + 1]?.id,
			previousStep: this.currentFlow.steps[this.currentFlow.currentStepIndex - 1]?.id
		};
	}

	// Get step by ID
	getStepById(stepId: string): FlowStep | null {
		if (!this.currentFlow) return null;
		return this.currentFlow.steps.find(s => s.id === stepId) || null;
	}

	// Get completed steps
	getCompletedSteps(): FlowStep[] {
		if (!this.currentFlow) return [];
		return this.currentFlow.steps.filter(s => s.isCompleted);
	}

	// Get remaining steps
	getRemainingSteps(): FlowStep[] {
		if (!this.currentFlow) return [];
		return this.currentFlow.steps.filter(s => !s.isCompleted);
	}

	// Reset flow
	async resetFlow(): Promise<boolean> {
		if (!this.currentFlow) {
			console.error('❌ No current flow to reset');
			return false;
		}

		try {
			// Reset all steps
			this.currentFlow.steps.forEach(step => {
				step.isCompleted = false;
				step.isSynced = false;
				step.data = {};
			});

			this.currentFlow.currentStepIndex = 0;
			this.currentFlow.isCompleted = false;
			this.currentFlow.metadata!.lastModified = Date.now();

			// Clear localStorage
			localStorage.removeItem(`flow_${this.currentFlow.id}`);

			// Save reset flow
			await this.saveFlowToStorage();

			console.log('🔄 Flow reset:', this.currentFlow.id);
			return true;
		} catch (error) {
			console.error('❌ Failed to reset flow:', error);
			return false;
		}
	}

	// Get flow history
	getFlowHistory(): FlowConfig[] {
		return [...this.flowHistory];
	}
}

// Create singleton instance
export const flowManager = FlowManager.getInstance();

// React hook for flow management
export function useFlowManager() {
	const initializeFlow = async (
		flowId: string,
		flowName: string,
		steps: Omit<FlowStep, 'isCompleted' | 'isSynced'>[],
		description?: string
	) => {
		return await flowManager.initializeFlow(flowId, flowName, steps, description);
	};

	const loadFlowFromStorage = async (flowId: string) => {
		return await flowManager.loadFlowFromStorage(flowId);
	};

	const saveFlowToStorage = async () => {
		return await flowManager.saveFlowToStorage();
	};

	const updateCurrentStepData = async (data: any) => {
		return await flowManager.updateCurrentStepData(data);
	};

	const completeCurrentStep = async () => {
		return await flowManager.completeCurrentStep();
	};

	const moveToNextStep = async () => {
		return await flowManager.moveToNextStep();
	};

	const moveToPreviousStep = async () => {
		return await flowManager.moveToPreviousStep();
	};

	const jumpToStep = async (stepId: string) => {
		return await flowManager.jumpToStep(stepId);
	};

	const resetFlow = async () => {
		return await flowManager.resetFlow();
	};

	return {
		currentFlow: flowManager.getCurrentFlow(),
		currentStep: flowManager.getCurrentStep(),
		flowProgress: flowManager.getFlowProgress(),
		initializeFlow,
		loadFlowFromStorage,
		saveFlowToStorage,
		updateCurrentStepData,
		completeCurrentStep,
		moveToNextStep,
		moveToPreviousStep,
		jumpToStep,
		resetFlow,
		getStepById: flowManager.getStepById.bind(flowManager),
		getCompletedSteps: flowManager.getCompletedSteps.bind(flowManager),
		getRemainingSteps: flowManager.getRemainingSteps.bind(flowManager),
		getFlowHistory: flowManager.getFlowHistory.bind(flowManager)
	};
}
