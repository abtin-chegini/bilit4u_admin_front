import { useState, useEffect } from 'react';
import routesData from '@/components/dashboard_admin_buy/plp/previous/PLP/path_data/routes_ultra_compact.json';

interface RouteData {
	sourceCityId: string;
	destinationCityId: string;
	distance: number;
	duration: string;
}

// Convert the array format to a more usable object
const createRouteMap = () => {
	const routeMap = new Map<string, RouteData>();

	routesData.forEach(([sourceCityId, destinationCityId, distance, duration]) => {
		const key = `${sourceCityId}-${destinationCityId}`;
		routeMap.set(key, {
			sourceCityId: String(sourceCityId),
			destinationCityId: String(destinationCityId),
			distance: Number(distance),
			duration: String(duration)
		});
	});

	return routeMap;
};

const routeMap = createRouteMap();

// Convert English digits to Persian
const toPersianDigits = (input: string | number): string => {
	const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	return input.toString().replace(/\d/g, (match) => persianDigits[parseInt(match)]);
};

// Format distance (convert to Persian and add units)
export const formatDistance = (distance: number): string => {
	return `${toPersianDigits(Math.round(distance))} کیلومتر`;
};

// Format duration (already in H:MM format, convert to Persian)
export const formatDuration = (duration: string): string => {
	return toPersianDigits(duration);
};

// Main function to get route information
export const getRouteInfo = (sourceCityId: string | null, destinationCityId: string | null) => {
	if (!sourceCityId || !destinationCityId) {
		return {
			distance: null,
			duration: null,
			formattedDistance: 'نامشخص',
			formattedDuration: 'نامشخص'
		};
	}

	const key = `${sourceCityId}-${destinationCityId}`;
	const route = routeMap.get(key);

	if (!route) {
		return {
			distance: null,
			duration: null,
			formattedDistance: 'مسیر یافت نشد',
			formattedDuration: 'نامشخص'
		};
	}

	return {
		distance: route.distance,
		duration: route.duration,
		formattedDistance: formatDistance(route.distance),
		formattedDuration: formatDuration(route.duration)
	};
};

// Hook to get route info from localStorage
export const useRouteInfo = () => {
	const [routeInfo, setRouteInfo] = useState({
		distance: null as number | null,
		duration: null as string | null,
		formattedDistance: 'نامشخص',
		formattedDuration: 'نامشخص'
	});

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const sourceCityId = localStorage.getItem("sourceCityId");
			const destinationCityId = localStorage.getItem("destinationCityId");

			const info = getRouteInfo(sourceCityId, destinationCityId);
			setRouteInfo(info);
		}
	}, []);

	return routeInfo;
};

// Hook that accepts city IDs as parameters (for when data comes from props, not localStorage)
export const useRouteInfoWithIds = (sourceCityId?: string | null, destinationCityId?: string | null) => {
	const [routeInfo, setRouteInfo] = useState({
		distance: null as number | null,
		duration: null as string | null,
		formattedDistance: 'نامشخص',
		formattedDuration: 'نامشخص'
	});

	useEffect(() => {
		console.log("useRouteInfoWithIds called with:", sourceCityId, destinationCityId);

		const info = getRouteInfo(sourceCityId || null, destinationCityId || null);
		console.log("Route Info:", info);
		setRouteInfo(info);
	}, [sourceCityId, destinationCityId]);

	return routeInfo;
};

// Static function for immediate access (non-hook)
export const getRouteInfoStatic = (sourceCityId: string | null, destinationCityId: string | null) => {
	return getRouteInfo(sourceCityId, destinationCityId);
};