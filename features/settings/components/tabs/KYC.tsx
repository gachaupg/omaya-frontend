import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import Image from "next/image";
import { getP2PProfileThunk } from "@/features/p2p/slices/orderSlice";
import { AppDispatch } from "@/store";

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23e5e7eb'/%3E%3Cg fill='%239ca3af'%3E%3Ccircle cx='28' cy='22' r='8'/%3E%3Cpath d='M28 32c-8 0-14 4-14 8v6c0 2 1 3 3 3h22c2 0 3-1 3-3v-6c0-4-6-8-14-8z'/%3E%3C/g%3E%3C/svg%3E";

const KYC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      dispatch(getP2PProfileThunk())
        .unwrap()
        .then((response) => {
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch profile:", error);
        });
    }
  }, [dispatch, user]);

  const handleImageClick = () => fileInputRef.current?.click();
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target?.result as string);
      reader.readAsDataURL(file);
      // Optionally, dispatch upload action here
    }
  };

  return (
    <div className="p-3 text-white flex flex-col gap-2">
      <p className="text-base font-semibold">KYC Verification</p>
      <div className="flex flex-col border bg-[#18181D] border-[#35353E] rounded-xl p-3 gap-3">
        {/* Avatar, Name, and Status */}
        {/* KYC Info */}
        <p className="text-sm text-[#808080]">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam
          impedit, velit nemo doloremque, quae harum voluptatum cum eligendi
          saepe unde excepturi repellat pariatur officiis culpa, fuga id quaerat
          molestiae et! Magnam harum iste, consequuntur consequatur quasi saepe
          sequi, illo eligendi laboriosam similique beatae quod quo, obcaecati
          fugiat ea quia voluptas.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image
              src={profileImage}
              alt="User avatar"
              width={48}
              height={48}
              className="object-cover rounded-full"
              unoptimized={true}
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = DEFAULT_AVATAR;
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <div className="text-base font-semibold">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="flex items-center gap-2 text-[#1D8751] text-sm">
              Verified Profile
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#1D8751"
                  strokeWidth="2"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="#1D8751"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYC;
