// src/hooks/useMediaQuery.ts
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
	// Default to false for SSR
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		// Set up initial match
		const media = window.matchMedia(query);
		setMatches(media.matches);

		// Set up listener for changes
		const listener = (e: MediaQueryListEvent) => {
			setMatches(e.matches);
		};

		// Use addEventListener for modern browsers
		if (media.addEventListener) {
			media.addEventListener("change", listener);
			return () => media.removeEventListener("change", listener);
		}
		// Fallback to deprecated addListener for older browsers
		else {
			media.addListener(listener);
			return () => media.removeListener(listener);
		}
	}, [query]);

	return matches;
}