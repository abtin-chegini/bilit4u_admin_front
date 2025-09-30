import { SrvRequestBody, SrvRequestRes } from "@/constants/interfaces";
import axios from "@/app/api/http/axiosInstance";

export const srvRequest = async (
  userBody: SrvRequestBody,
): Promise<SrvRequestRes> => {
  const { data } = await axios.post(`/srvrequest`, userBody);
  return JSON.parse(data.response);
};
