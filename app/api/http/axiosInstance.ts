import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://api.bilit4u.com/srv/api/v1",
  withCredentials: false,
});

export default axiosInstance;
