import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types/ProfileApi';

export const useProfile = () => {
  const { user, session, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Simple check for valid profile data
  const isValidProfileData = useCallback((data: any): boolean => {
    return data && data.user && typeof data.user.userID === 'number' && data.user.userID > 0;
  }, []);

  // Fetch profile function
  const fetchProfile = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await userService.getProfile(session.access_token);
      console.log("Fetched profile data:", data);

      if (isValidProfileData(data)) {
        setProfile(data);
        setError(null);
      } else {
        // If we get invalid profile data, it likely means the token is expired
        console.error("Invalid profile data received - session likely expired:", data);
        setError("نشست شما منقضی شده است. لطفاً دوباره وارد شوید.");

        // Log out the user automatically with a small delay
        setTimeout(() => signOut({ callbackUrl: '/' }), 1500);

        setProfile(null);
      }
    } catch (err: any) {
      // console.error("Error fetching profile:", err);
      setError(err.message || "خطا در بارگذاری اطلاعات پروفایل");

      if (err.response?.status === 401) {
        setTimeout(() => signOut({ callbackUrl: '/' }), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [session, isValidProfileData]);

  // Run fetchProfile on session change
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Optimistic update function - updates UI immediately
  // Update the updateProfile function to ensure we're sending complete user data:
  const updateProfile = useCallback(async (data: Record<string, any>) => {
    if (!session?.access_token || !profile) {
      throw new Error('خطا در احراز هویت');
    }

    // Make sure we include all user fields by starting with the current profile
    const completeUserData = {
      ...profile.user,  // Start with all existing user fields
      ...data           // Override with the updated fields
    };

    // Optimistically update the UI immediately
    const optimisticProfile = {
      ...profile,
      user: completeUserData
    };

    // Update local state right away
    setProfile(optimisticProfile);

    try {
      // Send the API request in background with complete user data
      const token = session.access_token;

      const serverProfile = await userService.updateProfile(
        completeUserData,  // Send complete user data
        token
      );

      // If API response is valid, update with server data
      if (isValidProfileData(serverProfile)) {
        setProfile(serverProfile);
      }

      return optimisticProfile;
    } catch (error: any) {
      // console.error('Error in updateProfile:', error);

      // Don't revert the UI - keep the optimistic update
      if (error.response?.status === 401) {
        setError("نشست شما منقضی شده است. لطفاً دوباره وارد شوید.");
        setTimeout(() => signOut({ callbackUrl: '/login' }), 2000);
      }

      throw error;
    }
  }, [session, profile, isValidProfileData]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile
  };
};