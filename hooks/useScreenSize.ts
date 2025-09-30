"use client";

import { useState, useEffect } from 'react';

type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null;

export function useScreenSize(): ScreenSize {
	// Start with null (not determined yet)
	const [screenSize, setScreenSize] = useState<ScreenSize>(null);

	useEffect(() => {
		// Function to determine screen size
		const handleResize = () => {
			if (window.innerWidth >= 1280) {
				setScreenSize("xl");
			} else if (window.innerWidth >= 1024) {
				setScreenSize("lg");
			} else if (window.innerWidth >= 768) {
				setScreenSize("md");
			} else if (window.innerWidth >= 640) {
				setScreenSize("sm");
			} else {
				setScreenSize("xs");
			}
		};

		// Initial size check
		handleResize();

		// Debounced resize handler for better performance
		let resizeTimer: NodeJS.Timeout;
		const debouncedResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(handleResize, 100);
		};

		window.addEventListener("resize", debouncedResize);

		return () => {
			window.removeEventListener("resize", debouncedResize);
			clearTimeout(resizeTimer);
		};
	}, []);

	return screenSize;
}