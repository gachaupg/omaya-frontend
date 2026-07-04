"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import {
  useChangeNowAssets,
  type ChangeNowMappedAsset,
} from "@/features/express/home/hooks/useChangeNowAssets";

export type ChangeNowAssetsContextValue = {
  assets: ChangeNowMappedAsset[];
  loading: boolean;
  error: string | null;
};

const ChangeNowAssetsContext = createContext<ChangeNowAssetsContextValue | null>(
  null
);

const IDLE: ChangeNowAssetsContextValue = {
  assets: [],
  loading: false,
  error: null,
};

export function ChangeNowAssetsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const state = useChangeNowAssets(enabled, {
    feature: "exchange",
    source: "public",
  });

  const value: ChangeNowAssetsContextValue = enabled ? state : IDLE;

  return (
    <ChangeNowAssetsContext.Provider value={value}>
      {children}
    </ChangeNowAssetsContext.Provider>
  );
}

/** Shared ChangeNOW asset list for home express deposit/withdraw (single fetch + state). */
export function useChangeNowAssetsContext(): ChangeNowAssetsContextValue {
  const ctx = useContext(ChangeNowAssetsContext);
  return ctx ?? IDLE;
}
