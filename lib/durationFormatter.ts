import numberConvertor from "./numberConvertor";

/**
 * Format duration from "2:30" to "۲ ساعت و ۳۰ دقیقه"
 * @param duration - Duration string in format "H:MM" or "HH:MM"
 * @returns Formatted Persian string with hour and minute labels
 */
export const formatDurationToPersian = (duration: string | null | undefined): string => {
	if (!duration) return 'نامشخص';

	try {
		const [hours, minutes] = duration.split(':').map(Number);
		const persianHours = numberConvertor(hours.toString());
		const persianMinutes = numberConvertor(minutes.toString());

		if (hours > 0 && minutes > 0) {
			return `${persianHours} ساعت و ${persianMinutes} دقیقه`;
		} else if (hours > 0) {
			return `${persianHours} ساعت`;
		} else if (minutes > 0) {
			return `${persianMinutes} دقیقه`;
		}
		return 'نامشخص';
	} catch (error) {
		return 'نامشخص';
	}
};

