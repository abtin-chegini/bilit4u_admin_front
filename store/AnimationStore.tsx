import { create } from 'zustand';

// Define animation types
export type AnimationType = 'bus' | 'airplane' | 'hotel' | 'house' | 'tour' | 'train';

// Map SearchBox categories to animation types
export const categoryToAnimationMap = {
	primary: 'bus',
	airplane: 'airplane',
	train: 'train',
	hotel: 'hotel',
	house: 'house',
	tour: 'tour'
} as const;

// Store interface
interface AnimationState {
	currentAnimation: AnimationType;
	setAnimation: (animation: AnimationType) => void;
	setAnimationFromCategory: (category: string) => void;
}

// Create the store
export const useAnimationStore = create<AnimationState>((set) => ({
	// Default animation is 'bus'
	currentAnimation: 'bus',

	// Set animation directly
	setAnimation: (animation: AnimationType) => set({ currentAnimation: animation }),

	// Set animation from category name
	setAnimationFromCategory: (category: string) => {
		const animationType = categoryToAnimationMap[category as keyof typeof categoryToAnimationMap];
		if (animationType) {
			set({ currentAnimation: animationType });
		}
	}
}));