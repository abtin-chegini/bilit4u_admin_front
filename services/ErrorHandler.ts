export function parseApiError(e: any): string {
	if (typeof e === 'string') return e;
	if (e?.message) return e.message;
	try {
		return JSON.stringify(e);
	} catch {
		return 'Unknown error';
	}
}

import { useToast } from '@/hooks/use-toast';

// Types for error handling
export interface ErrorInfo {
	id: string;
	type: 'network' | 'validation' | 'authentication' | 'authorization' | 'server' | 'client' | 'unknown';
	severity: 'low' | 'medium' | 'high' | 'critical';
	message: string;
	details?: any;
	timestamp: number;
	context?: {
		component?: string;
		action?: string;
		userId?: string;
		sessionId?: string;
		flowId?: string;
		stepId?: string;
	};
	retryable: boolean;
	retryCount: number;
	maxRetries: number;
}

export interface RetryConfig {
	maxRetries: number;
	baseDelay: number; // milliseconds
	maxDelay: number; // milliseconds
	backoffMultiplier: number;
	retryableErrors: string[];
}

export interface ErrorHandlerConfig {
	enableToast: boolean;
	enableConsoleLog: boolean;
	enableErrorReporting: boolean;
	retryConfig: RetryConfig;
	autoRetry: boolean;
}

export class ErrorHandler {
	private static instance: ErrorHandler;
	private errors: Map<string, ErrorInfo> = new Map();
	private retryQueue: Map<string, () => Promise<any>> = new Map();
	private config: ErrorHandlerConfig;
	private toast: any = null;

	private constructor() {
		this.config = {
			enableToast: true,
			enableConsoleLog: true,
			enableErrorReporting: true,
			autoRetry: true,
			retryConfig: {
				maxRetries: 3,
				baseDelay: 1000,
				maxDelay: 10000,
				backoffMultiplier: 2,
				retryableErrors: [
					'NETWORK_ERROR',
					'TIMEOUT',
					'SERVER_ERROR',
					'RATE_LIMIT',
					'TEMPORARY_FAILURE'
				]
			}
		};

		// Initialize toast if available
		this.initializeToast();
	}

	public static getInstance(): ErrorHandler {
		if (!ErrorHandler.instance) {
			ErrorHandler.instance = new ErrorHandler();
		}
		return ErrorHandler.instance;
	}

	// Initialize toast hook
	private initializeToast() {
		try {
			// This will be set by the component that uses the error handler
			// For now, we'll handle it gracefully
		} catch (error) {
			console.warn('Toast not available in current context');
		}
	}

	// Set toast instance
	setToast(toastInstance: any) {
		this.toast = toastInstance;
	}

	// Handle error with automatic retry
	async handleError(
		error: Error | any,
		context?: {
			component?: string;
			action?: string;
			userId?: string;
			sessionId?: string;
			flowId?: string;
			stepId?: string;
		},
		retryFunction?: () => Promise<any>
	): Promise<ErrorInfo> {
		const errorInfo = this.createErrorInfo(error, context, retryFunction);

		// Store error
		this.errors.set(errorInfo.id, errorInfo);

		// Log error
		if (this.config.enableConsoleLog) {
			this.logError(errorInfo);
		}

		// Show toast notification
		if (this.config.enableToast && this.toast) {
			this.showErrorToast(errorInfo);
		}

		// Report error
		if (this.config.enableErrorReporting) {
			this.reportError(errorInfo);
		}

		// Auto retry if applicable
		if (this.config.autoRetry && errorInfo.retryable && retryFunction) {
			await this.scheduleRetry(errorInfo, retryFunction);
		}

		return errorInfo;
	}

	// Create error info from error object
	private createErrorInfo(
		error: Error | any,
		context?: any,
		retryFunction?: () => Promise<any>
	): ErrorInfo {
		const id = this.generateErrorId();
		const timestamp = Date.now();

		// Determine error type and severity
		const { type, severity, retryable } = this.analyzeError(error);

		return {
			id,
			type,
			severity,
			message: error.message || 'Unknown error occurred',
			details: error,
			timestamp,
			context,
			retryable,
			retryCount: 0,
			maxRetries: this.config.retryConfig.maxRetries
		};
	}

	// Analyze error to determine type, severity, and retryability
	private analyzeError(error: any): {
		type: ErrorInfo['type'];
		severity: ErrorInfo['severity'];
		retryable: boolean;
	} {
		const message = error.message?.toLowerCase() || '';
		const code = error.code || error.status || '';

		// Network errors
		if (message.includes('network') || message.includes('fetch') || code === 'NETWORK_ERROR') {
			return { type: 'network', severity: 'medium', retryable: true };
		}

		// Timeout errors
		if (message.includes('timeout') || code === 'TIMEOUT') {
			return { type: 'network', severity: 'medium', retryable: true };
		}

		// Authentication errors
		if (message.includes('unauthorized') || code === 401 || code === 'UNAUTHORIZED') {
			return { type: 'authentication', severity: 'high', retryable: false };
		}

		// Authorization errors
		if (message.includes('forbidden') || code === 403 || code === 'FORBIDDEN') {
			return { type: 'authorization', severity: 'high', retryable: false };
		}

		// Server errors
		if (code >= 500 || code === 'SERVER_ERROR') {
			return { type: 'server', severity: 'high', retryable: true };
		}

		// Rate limiting
		if (code === 429 || message.includes('rate limit')) {
			return { type: 'server', severity: 'medium', retryable: true };
		}

		// Validation errors
		if (code === 400 || message.includes('validation') || message.includes('invalid')) {
			return { type: 'validation', severity: 'medium', retryable: false };
		}

		// Client errors
		if (code >= 400 && code < 500) {
			return { type: 'client', severity: 'medium', retryable: false };
		}

		// Default
		return { type: 'unknown', severity: 'low', retryable: false };
	}

	// Generate unique error ID
	private generateErrorId(): string {
		return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Log error to console
	private logError(errorInfo: ErrorInfo) {
		const logLevel = this.getLogLevel(errorInfo.severity);
		const logMessage = `[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`;
		const logData = {
			id: errorInfo.id,
			context: errorInfo.context,
			details: errorInfo.details,
			retryable: errorInfo.retryable,
			retryCount: errorInfo.retryCount
		};

		switch (logLevel) {
			case 'error':
				console.error(logMessage, logData);
				break;
			case 'warn':
				console.warn(logMessage, logData);
				break;
			case 'info':
				console.info(logMessage, logData);
				break;
			default:
				console.log(logMessage, logData);
		}
	}

	// Get log level based on severity
	private getLogLevel(severity: ErrorInfo['severity']): 'error' | 'warn' | 'info' | 'log' {
		switch (severity) {
			case 'critical':
			case 'high':
				return 'error';
			case 'medium':
				return 'warn';
			case 'low':
				return 'info';
			default:
				return 'log';
		}
	}

	// Show error toast
	private showErrorToast(errorInfo: ErrorInfo) {
		if (!this.toast) return;

		const title = this.getErrorTitle(errorInfo);
		const description = this.getErrorDescription(errorInfo);

		this.toast({
			title,
			description,
			variant: errorInfo.severity === 'critical' || errorInfo.severity === 'high' ? 'destructive' : 'default'
		});
	}

	// Get error title for toast
	private getErrorTitle(errorInfo: ErrorInfo): string {
		switch (errorInfo.type) {
			case 'network':
				return 'خطا در اتصال';
			case 'authentication':
				return 'خطا در احراز هویت';
			case 'authorization':
				return 'خطا در دسترسی';
			case 'server':
				return 'خطا در سرور';
			case 'validation':
				return 'خطا در اعتبارسنجی';
			case 'client':
				return 'خطا در درخواست';
			default:
				return 'خطا';
		}
	}

	// Get error description for toast
	private getErrorDescription(errorInfo: ErrorInfo): string {
		if (errorInfo.retryable && errorInfo.retryCount < errorInfo.maxRetries) {
			return `${errorInfo.message} (تلاش مجدد: ${errorInfo.retryCount + 1}/${errorInfo.maxRetries})`;
		}
		return errorInfo.message;
	}

	// Report error to external service
	private reportError(errorInfo: ErrorInfo) {
		// Here you can integrate with error reporting services like Sentry, LogRocket, etc.
		console.log('📊 Error reported:', errorInfo.id, errorInfo.type, errorInfo.severity);
	}

	// Schedule retry for retryable errors
	private async scheduleRetry(errorInfo: ErrorInfo, retryFunction: () => Promise<any>) {
		if (errorInfo.retryCount >= errorInfo.maxRetries) {
			console.log('❌ Max retries reached for error:', errorInfo.id);
			return;
		}

		const delay = this.calculateRetryDelay(errorInfo.retryCount);

		console.log(`🔄 Scheduling retry for error ${errorInfo.id} in ${delay}ms`);

		setTimeout(async () => {
			try {
				errorInfo.retryCount++;
				this.errors.set(errorInfo.id, errorInfo);

				console.log(`🔄 Retrying error ${errorInfo.id} (attempt ${errorInfo.retryCount})`);

				await retryFunction();

				// Success - remove from retry queue
				this.retryQueue.delete(errorInfo.id);
				this.errors.delete(errorInfo.id);

				console.log(`✅ Retry successful for error ${errorInfo.id}`);
			} catch (retryError) {
				console.error(`❌ Retry failed for error ${errorInfo.id}:`, retryError);

				// Schedule another retry if not at max
				if (errorInfo.retryCount < errorInfo.maxRetries) {
					await this.scheduleRetry(errorInfo, retryFunction);
				} else {
					// Max retries reached
					this.retryQueue.delete(errorInfo.id);
					console.error(`❌ Max retries reached for error ${errorInfo.id}`);
				}
			}
		}, delay);
	}

	// Calculate retry delay with exponential backoff
	private calculateRetryDelay(retryCount: number): number {
		const { baseDelay, maxDelay, backoffMultiplier } = this.config.retryConfig;
		const delay = baseDelay * Math.pow(backoffMultiplier, retryCount);
		return Math.min(delay, maxDelay);
	}

	// Manual retry for specific error
	async retryError(errorId: string): Promise<boolean> {
		const errorInfo = this.errors.get(errorId);
		const retryFunction = this.retryQueue.get(errorId);

		if (!errorInfo || !retryFunction) {
			console.error('❌ Error or retry function not found:', errorId);
			return false;
		}

		if (errorInfo.retryCount >= errorInfo.maxRetries) {
			console.error('❌ Max retries already reached for error:', errorId);
			return false;
		}

		try {
			errorInfo.retryCount++;
			this.errors.set(errorId, errorInfo);

			console.log(`🔄 Manual retry for error ${errorId} (attempt ${errorInfo.retryCount})`);

			await retryFunction();

			// Success
			this.retryQueue.delete(errorId);
			this.errors.delete(errorId);

			console.log(`✅ Manual retry successful for error ${errorId}`);
			return true;
		} catch (retryError) {
			console.error(`❌ Manual retry failed for error ${errorId}:`, retryError);
			return false;
		}
	}

	// Get all errors
	getAllErrors(): ErrorInfo[] {
		return Array.from(this.errors.values());
	}

	// Get errors by type
	getErrorsByType(type: ErrorInfo['type']): ErrorInfo[] {
		return this.getAllErrors().filter(error => error.type === type);
	}

	// Get errors by severity
	getErrorsBySeverity(severity: ErrorInfo['severity']): ErrorInfo[] {
		return this.getAllErrors().filter(error => error.severity === severity);
	}

	// Clear specific error
	clearError(errorId: string): boolean {
		const deleted = this.errors.delete(errorId);
		this.retryQueue.delete(errorId);
		return deleted;
	}

	// Clear all errors
	clearAllErrors(): void {
		this.errors.clear();
		this.retryQueue.clear();
	}

	// Update configuration
	updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
		this.config = { ...this.config, ...newConfig };
		console.log('🔧 Error handler configuration updated:', this.config);
	}

	// Get current configuration
	getConfig(): ErrorHandlerConfig {
		return { ...this.config };
	}

	// Health check
	getHealthStatus(): {
		totalErrors: number;
		retryableErrors: number;
		criticalErrors: number;
		retryQueueSize: number;
	} {
		const allErrors = this.getAllErrors();

		return {
			totalErrors: allErrors.length,
			retryableErrors: allErrors.filter(e => e.retryable).length,
			criticalErrors: allErrors.filter(e => e.severity === 'critical').length,
			retryQueueSize: this.retryQueue.size
		};
	}
}

// Create singleton instance
export const errorHandler = ErrorHandler.getInstance();

// React hook for error handling
export function useErrorHandler() {
	const { toast } = useToast();

	// Set toast instance
	errorHandler.setToast(toast);

	const handleError = async (
		error: Error | any,
		context?: {
			component?: string;
			action?: string;
			userId?: string;
			sessionId?: string;
			flowId?: string;
			stepId?: string;
		},
		retryFunction?: () => Promise<any>
	) => {
		return await errorHandler.handleError(error, context, retryFunction);
	};

	const retryError = async (errorId: string) => {
		return await errorHandler.retryError(errorId);
	};

	const getAllErrors = () => {
		return errorHandler.getAllErrors();
	};

	const clearError = (errorId: string) => {
		return errorHandler.clearError(errorId);
	};

	const clearAllErrors = () => {
		errorHandler.clearAllErrors();
	};

	const getHealthStatus = () => {
		return errorHandler.getHealthStatus();
	};

	return {
		handleError,
		retryError,
		getAllErrors,
		clearError,
		clearAllErrors,
		getHealthStatus
	};
}
