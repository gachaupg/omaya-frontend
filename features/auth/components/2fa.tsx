"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store";
import { loginWith2FA, close2FAModal } from "../slices/authSlice";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { tokens } from "../../../styles/tokens";

  const TwoFAModal: React.FC = () => {
    const dispatch = useDispatch();
    const { twoFAModalOpen, twoFAEmail, twoFAPassword, loading, error, isAuthenticated } = useSelector(
      (state: RootState) => state.auth
    );

  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  // Reset local state when modal opens/closes
  useEffect(() => {
    if (twoFAModalOpen) {
      setCode("");
      setLocalError("");
    }
  }, [twoFAModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!code.trim()) {
      setLocalError("Please enter the 2FA code");
      return;
    }

    if (code.length < 6) {
      setLocalError("2FA code must be at least 6 digits");
      return;
    }

    try {
      await dispatch(
        loginWith2FA({
          email: twoFAEmail,
          password: twoFAPassword,
          code: code.trim(),
        }) as any
      );
    } catch (err) {
      // Error is handled by the slice
    }
  };

  const handleClose = () => {
    dispatch(close2FAModal());
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    setCode(value);
    if (localError) setLocalError("");
  };

  if (!twoFAModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md mx-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-400 text-sm">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="2fa-code"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                2FA Code
              </label>
              <input
                id="2fa-code"
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#404040] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1D8751] focus:border-transparent"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            {(localError || error) && (
              <div className="text-red-500 text-sm text-center">
                {localError || error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={loading || !code.trim()}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Don't have access to your authenticator? Contact support for assistance.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TwoFAModal;
