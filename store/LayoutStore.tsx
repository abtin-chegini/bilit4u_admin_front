import { create } from 'zustand';

interface LayoutState {
	hideNavbar: boolean;
	setHideNavbar: (hide: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
	hideNavbar: false,
	setHideNavbar: (hide) => set({ hideNavbar: hide }),
}));