export interface UserProfile {
	user: {
		userID: number | null;
		name: string | null;
		familyName?: string | null;
		email: string | null;
		phoneNumber: string | null;
		nationalCode?: string | null;
		[key: string]: any;
	};
	[key: string]: any;
}