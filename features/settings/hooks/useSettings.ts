import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchProfile,
  updateProfile,
  updateProfilePhoto,
  changePassword,
  fetchTheme,
  updateTheme,
  fetchSecuritySettings,
  updateSecuritySettings,
  toggleTwoFactor,
  fetchPrivacySettings,
  updatePrivacySettings,
  fetchActiveSessions,
  terminateSession,
  terminateAllSessions,
  clearError,
  clearSuccess,
} from "../slices/settingsSlice";
import {
  ProfileUpdateRequest,
  PasswordChangeRequest,
  ThemeSettings,
  SecuritySettings,
  PrivacySettings,
} from "../types";

export const useSettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // ✅ Data fetching moved to SettingsDataProvider (parent component)
  // This eliminates duplicate API calls and improves performance
  // The data is now fetched once at the Account/Settings page level
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     dispatch(fetchProfile());
  //     dispatch(fetchTheme());
  //     dispatch(fetchSecuritySettings());
  //     dispatch(fetchPrivacySettings());
  //   }
  // }, [dispatch, isAuthenticated]);

  const profileActions = {
    fetch: () => dispatch(fetchProfile()),
    update: (data: ProfileUpdateRequest) => dispatch(updateProfile(data)),
    updatePhoto: (photo: File) => dispatch(updateProfilePhoto(photo)),
  };

  const passwordActions = {
    change: (data: PasswordChangeRequest) => dispatch(changePassword(data)),
  };

  const themeActions = {
    fetch: () => dispatch(fetchTheme()),
    update: (theme: ThemeSettings) => dispatch(updateTheme(theme)),
  };

  const securityActions = {
    fetch: () => dispatch(fetchSecuritySettings()),
    update: (settings: SecuritySettings) =>
      dispatch(updateSecuritySettings(settings)),
    toggleTwoFactor: (payload: { enabled: boolean; code?: string }) => dispatch(toggleTwoFactor(payload)),
  };

  const privacyActions = {
    fetch: () => dispatch(fetchPrivacySettings()),
    update: (settings: PrivacySettings) =>
      dispatch(updatePrivacySettings(settings)),
  };

  const sessionActions = {
    fetch: () => dispatch(fetchActiveSessions()),
    terminate: (sessionId: string) => dispatch(terminateSession(sessionId)),
    terminateAll: () => dispatch(terminateAllSessions()),
  };

  const utilityActions = {
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
  };

  return {
    // State
    ...settings,

    // Actions
    profile: profileActions,
    password: passwordActions,
    theme: themeActions,
    security: securityActions,
    privacy: privacyActions,
    sessions: sessionActions,
    utils: utilityActions,

    // Computed values
    isAuthenticated,
    hasProfile: !!settings.profile,
    isProfileComplete:
      settings.profile &&
      settings.profile.first_name &&
      settings.profile.last_name &&
      settings.profile.email,
  };
};
