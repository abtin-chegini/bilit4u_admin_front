


import axios from 'axios';
import { UserProfile } from '@/types/ProfileApi';

const API_URL = "https://api.bilit4u.com/auth/api/v1";

// Create an axios instance with better timeout handling
const axiosInstance = axios.create({
  timeout: 30000 // 30 seconds
});

export const userService = {
  async getProfile(token: string): Promise<UserProfile> {
    try {
      const response = await axiosInstance.get(`${API_URL}/Profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      // console.error("Error in getProfile:", error);

      if (error.response?.status === 401) {
        throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
      }

      throw new Error("خطا در دریافت اطلاعات پروفایل");
    }
  },

  async updateProfile(
    userData: Record<string, any>,
    token: string,
    refreshToken: string
  ): Promise<UserProfile> {
    try {
      // Format the request body according to the API requirements
      const requestBody = {
        Token: token,
        RefreshToken: refreshToken,
        User: {
          ...userData, // Include ALL fields, not just changed ones
          Otp: "123451" // Add the required static OTP
        }
      };

      // Add request timestamp for debugging
      // console.log(`Update API called at: ${new Date().toISOString()}`);
      // console.log("Update payload:", requestBody.User);

      // Use a faster timeout for update operations
      const response = await axios.post(
        `${API_URL}/userUpdate`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );

      // console.log(`Update API responded at: ${new Date().toISOString()}`);
      // console.log("Update Profile Response:", response.data);

      return response.data;
    } catch (error: any) {
      // console.error("Error in updateProfile:", error);

      if (error.response?.status === 401) {
        throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
      }

      throw new Error("خطا در بروزرسانی اطلاعات پروفایل");
    }
  }
};