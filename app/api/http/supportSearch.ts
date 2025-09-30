import { SrvRequestRes, SrvRequestBody } from '@/constants/interfaces';
import axios from '@/app/api/http/axiosInstance';

const supportSearch = async (data: SrvRequestBody): Promise<SrvRequestRes> => {
	try {
		const { data: response } = await axios.post('/srvrequest', data);
		return JSON.parse(response.response);
	} catch (error) {
		console.error('Support search API error:', error);
		throw error;
	}
};

export default supportSearch;
