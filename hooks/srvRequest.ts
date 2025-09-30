import {srvRequest} from "@/api/http/srvrequest";
import {useMutation} from "@tanstack/react-query";

export const useSrvRequest = () => {
    return useMutation({
        mutationKey: ["srv-request"],
        mutationFn: srvRequest,
    });
};