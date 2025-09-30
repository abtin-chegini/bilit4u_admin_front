import supportSearch from "@/app/api/http/supportSearch";
import { useMutation } from "@tanstack/react-query";

export const useSupportSearch = () => {
	return useMutation({
		mutationKey: ["support-search"],
		mutationFn: supportSearch,
	});
};
