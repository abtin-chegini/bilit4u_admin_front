import { useState, useCallback } from 'react';
import { captureAndUploadSeatLayout } from '@/lib/seatLayoutCapture';

interface UseSeatLayoutCaptureReturn {
	isCapturing: boolean;
	capturedImageUrl: string | null;
	capturedAssetId: string | null;
	error: string | null;
	captureSeatLayout: (seatmapToken: string, userToken: string, refreshToken: string, selectedSeats?: Array<{ id: number; seatNo: string | number, state: string }>) => Promise<{ imageUrl: string | null; assetId: string | null }>;
	resetCapture: () => void;
}

export const useSeatLayoutCapture = (): UseSeatLayoutCaptureReturn => {
	const [isCapturing, setIsCapturing] = useState(false);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
	const [capturedAssetId, setCapturedAssetId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const captureSeatLayout = useCallback(async (
		seatmapToken: string,
		userToken: string,
		refreshToken: string,
		selectedSeats?: Array<{ id: number; seatNo: string | number, state: string }>
	): Promise<{ imageUrl: string | null; assetId: string | null }> => {
		setIsCapturing(true);
		setError(null);

		try {
			console.log('Starting seat layout capture...');
			console.log('SeatmapToken:', seatmapToken);
			console.log('UserToken:', userToken);
			console.log('RefreshToken:', refreshToken);
			console.log('Selected seats:', selectedSeats);

			// Use the new captureAndUploadSeatLayout function
			const result = await captureAndUploadSeatLayout(seatmapToken, selectedSeats || [], userToken, refreshToken);

			if (result.success && result.imageUrl) {
				setCapturedImageUrl(result.imageUrl);
				setCapturedAssetId(result.assetId || null);
				return { imageUrl: result.imageUrl, assetId: result.assetId || null };
			} else {
				throw new Error(result.error || 'Failed to capture and upload seat layout');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			console.error('Error capturing seat layout:', err);
			return { imageUrl: null, assetId: null };
		} finally {
			setIsCapturing(false);
		}
	}, []);

	const resetCapture = useCallback(() => {
		setCapturedImageUrl(null);
		setCapturedAssetId(null);
		setError(null);
		setIsCapturing(false);
	}, []);

	return {
		isCapturing,
		capturedImageUrl,
		capturedAssetId,
		error,
		captureSeatLayout,
		resetCapture
	};
}; 