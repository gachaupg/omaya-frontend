import React, { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/rootReducer";
import { fetchProfile } from "@/features/settings/slices/settingsSlice";
import ClientIdSection from "./sections/ClientIdSection";
import PasswordSection from "./sections/PasswordSection";
import BasicInfoSection from "./sections/BasicInfoSection";
import SystemThemeSection from "./sections/SystemThemeSection";
import NotificationPreferencesSection from "./sections/NotificationPreferencesSection";
import AccountDeletionSection from "./sections/AccountDeletionSection";

const ProfileSettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user: authUser, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const profileFromApi = useSelector((state: RootState) => state.settings.profile);

  // Ensure profile is loaded so Basic Info shows data from /api/profile/ (not auth cache)
  useEffect(() => {
    if (isAuthenticated && !profileFromApi) {
      dispatch(fetchProfile());
    }
  }, [isAuthenticated, profileFromApi, dispatch]);

  // Basic Info must display exactly what /api/profile/ returns (user object)
  // API returns { user, profile, require_2fa }; state may store that or UserProfile
  const user = useMemo(() => {
    const p = profileFromApi as { data?: { user?: any }; user?: any; email?: string; phone_number?: string; first_name?: string; last_name?: string } | null;
    const profileUser =
      p?.data?.user ??
      p?.user ??
      (p?.email || p?.phone_number ? p : null);
    // When profile API has user, use it as source of truth for Basic Info (first_name, last_name, email, phone_number)
    if (profileUser) {
      return {
        ...authUser,
        first_name: profileUser.first_name ?? authUser?.first_name,
        last_name: profileUser.last_name ?? authUser?.last_name,
        email: profileUser.email ?? authUser?.email,
        phone_number: profileUser.phone_number ?? authUser?.phone_number,
      };
    }
    return authUser ?? {};
  }, [authUser, profileFromApi]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        <ClientIdSection user={user} />
        <BasicInfoSection user={user} />
        <PasswordSection />
        <SystemThemeSection />
        <NotificationPreferencesSection />
        <AccountDeletionSection />
      </div>
    </div>
  );
};

export default ProfileSettings;
