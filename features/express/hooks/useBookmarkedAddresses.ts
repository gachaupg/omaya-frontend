"use client";

import { useState, useCallback } from "react";
import {
  bookmarkedAddressesApi,
  BookmarkedAddress,
  CreateBookmarkPayload,
  getBookmarkApiErrorMessage,
  isBookmarkAuthError,
  normalizeBookmarkedAddress,
} from "../services/bookmarkedAddressesApi";
import { showToast } from "@/lib/utils/toast";

const LOGIN_TO_SAVE_BOOKMARK_TOAST =
  "Please log in to save this address to bookmarks.";
const LOGIN_TO_SAVE_BOOKMARK_INLINE =
  "Log in to save this address to your bookmarks.";

function extractBookmarkListError(err: unknown): string {
  return getBookmarkApiErrorMessage(err) || "Failed to load bookmarks";
}

function extractBookmarkSaveError(err: unknown): string {
  return getBookmarkApiErrorMessage(err) || "Failed to save address to bookmarks";
}

export function useBookmarkedAddresses(asset?: string, network?: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveBookmarkError, setSaveBookmarkError] = useState<string | null>(
    null
  );

  const clearSaveBookmarkError = useCallback(() => {
    setSaveBookmarkError(null);
  }, []);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const list = await bookmarkedAddressesApi.list({ asset, network });
      setBookmarks(list);
      return list;
    } catch (err: unknown) {
      // Guest / expired session: no toast (e.g. whitelist asset dropdown uses list(); avoid "Request failed with status code 401")
      if (isBookmarkAuthError(err)) {
        setBookmarks([]);
        return [];
      }
      showToast.error(extractBookmarkListError(err));
      setBookmarks([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [asset, network]);

  const saveBookmark = useCallback(async (payload: CreateBookmarkPayload) => {
    setSaving(true);
    setSaveBookmarkError(null);
    try {
      const created = await bookmarkedAddressesApi.create(payload);
      const normalized =
        normalizeBookmarkedAddress(created, payload) ?? created;
      setBookmarks((prev) => [normalized, ...prev]);
      setSaveBookmarkError(null);
      showToast.success("Address saved to bookmarks");
      return created;
    } catch (err: unknown) {
      if (isBookmarkAuthError(err)) {
        setSaveBookmarkError(LOGIN_TO_SAVE_BOOKMARK_INLINE);
        showToast.error(LOGIN_TO_SAVE_BOOKMARK_TOAST);
      } else {
        const msg = extractBookmarkSaveError(err);
        setSaveBookmarkError(msg);
        showToast.error(msg);
      }
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteBookmark = useCallback(async (userWalletAddressId: string) => {
    try {
      await bookmarkedAddressesApi.delete(userWalletAddressId);
      setBookmarks((prev) => prev.filter((b) => b.id !== userWalletAddressId));
      showToast.success("Address removed from whitelist");
    } catch (err: unknown) {
      if (isBookmarkAuthError(err)) {
        return;
      }
      const msg =
        getBookmarkApiErrorMessage(err) || "Failed to remove bookmark";
      showToast.error(msg);
    }
  }, []);

  return {
    bookmarks,
    loading,
    saving,
    fetchBookmarks,
    saveBookmark,
    deleteBookmark,
    saveBookmarkError,
    clearSaveBookmarkError,
  };
}
