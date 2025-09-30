import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFlowSessionStore } from '@/store/FlowSessionStore';
import { useToast } from '@/hooks/use-toast';

export interface UseFlowSessionOptions {
	autoInitialize?: boolean;
}

export function useFlowSession(options: UseFlowSessionOptions = {}) {
	const {
		autoInitialize = true
	} = options;

	const { user, session } = useAuth();
	const { toast } = useToast();

	// Helper function to check if user is authenticated
	const isUserAuthenticated = useCallback(() => {
		return !!(user && session?.access_token);
	}, [user, session]);

	// Helper function to get user ID
	const getUserId = useCallback(() => {
		return user?.id || user?.email || 'anonymous';
	}, [user]);

	const {
		// State
		currentSession,
		sessionId,
		currentStep,
		flowSteps,
		isFlowActive,
		isLoading,
		error,

		// Actions
		initializeSession,
		loadSession,
		updateSession,
		clearSession,
		setCurrentStep,
		updateFlowStep,
		completeFlowStep,
		clearFlowStep,
		getFlowStep,
		getAllFlowSteps,
		setError
	} = useFlowSessionStore();

	// Auto-initialize session when user is authenticated
	useEffect(() => {
		if (autoInitialize && isUserAuthenticated() && !isFlowActive) {
			const userId = getUserId();
			initializeSession(userId).catch((error) => {
				console.error('Failed to auto-initialize session:', error);
				toast({
					title: 'خطا در راه‌اندازی جلسه',
					description: 'مشکلی در راه‌اندازی جلسه کاری رخ داد',
					variant: 'destructive'
				});
			});
		}
	}, [autoInitialize, isUserAuthenticated, getUserId, isFlowActive, initializeSession, toast]);


	// Handle errors
	useEffect(() => {
		if (error) {
			toast({
				title: 'خطا در جلسه کاری',
				description: error,
				variant: 'destructive'
			});
			setError(null); // Clear error after showing toast
		}
	}, [error, toast, setError]);

	// Initialize flow with ticket data
	const initializeFlowWithTicket = useCallback(async (ticketData: any) => {
		if (!isUserAuthenticated()) {
			throw new Error('User not authenticated');
		}

		const userId = getUserId();

		// Initialize session
		const newSessionId = await initializeSession(userId);

		// Set initial step
		setCurrentStep('ticket_selection');

		// Store ticket data locally
		await updateFlowStep('ticket_selection', 'انتخاب بلیط', ticketData, true);

		return newSessionId;
	}, [isUserAuthenticated, getUserId, initializeSession, setCurrentStep, updateFlowStep]);

	// Navigate to next step
	const goToNextStep = useCallback(async (stepId: string, stepName: string, data: any) => {
		// Complete current step if exists
		if (currentStep) {
			await completeFlowStep(currentStep);
		}

		// Set new step
		setCurrentStep(stepId);

		// Update flow step
		await updateFlowStep(stepId, stepName, data);
	}, [currentStep, completeFlowStep, setCurrentStep, updateFlowStep]);

	// Return to seat selection: clear passenger-related step before setting step 1
	const returnToSeatSelection = useCallback(async () => {
		// Clear passenger details step data
		await clearFlowStep('passenger_details');
		await clearFlowStep('passenger_selected_seats');
		// Set current step back to seat selection
		setCurrentStep('seat_selection');
	}, [clearFlowStep, setCurrentStep]);

	// Navigate to previous step
	const goToPreviousStep = useCallback(async (stepId: string) => {
		setCurrentStep(stepId);
	}, [setCurrentStep]);

	// Get current step data
	const getCurrentStepData = useCallback(() => {
		if (!currentStep) return null;
		return getFlowStep(currentStep);
	}, [currentStep, getFlowStep]);

	// Check if step is completed
	const isStepCompleted = useCallback((stepId: string) => {
		const step = getFlowStep(stepId);
		return step?.completed || false;
	}, [getFlowStep]);

	// Get flow progress
	const getFlowProgress = useCallback(() => {
		const allSteps = getAllFlowSteps();
		const completedSteps = allSteps.filter(step => step.completed);
		return {
			total: allSteps.length,
			completed: completedSteps.length,
			percentage: allSteps.length > 0 ? (completedSteps.length / allSteps.length) * 100 : 0
		};
	}, [getAllFlowSteps]);


	// Clean up session on unmount
	useEffect(() => {
		return () => {
			// Optional: Clear session on unmount
			// clearSession();
		};
	}, [clearSession]);

	return {
		// State
		currentSession,
		sessionId,
		currentStep,
		flowSteps,
		isFlowActive,
		isLoading,
		error,

		// Authentication helpers
		isUserAuthenticated,
		getUserId,

		// Flow management
		initializeFlowWithTicket,
		goToNextStep,
		goToPreviousStep,
		returnToSeatSelection,
		getCurrentStepData,
		isStepCompleted,
		getFlowProgress,

		// Data management
		updateFlowStep,
		completeFlowStep,
		getFlowStep,
		getAllFlowSteps,
		updateSession,

		// Session management
		clearSession,
		loadSession,

		// Utility
		setError
	};
}
