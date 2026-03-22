"use client";

import { useState, useCallback } from "react";
import {
  bookmarkedAddressesApi,
  BookmarkedAddress,
  CreateBookmarkPayload,
  getBookmarkApiErrorMessage,
  isBookmarkAuthError,
} from "../services/bookmarkedAddressesApi";
import { showToast } from "@/lib/utils/toast";

const LOGIN_TO_SAVE_BOOKMARK_TOAST =
  "Please log in to save this address to bookmarks.";
const LOGIN_TO_SAVE_BOOKMARK_INLINE =
  "Log in to save this address to your bookmarks.";

function extractBookmarkListError(err: unknown): string {
  const detail = getBookmarkApiErrorMessage(err);
  if (detail) return detail;
  const e = err as any;
  const data = e?.response?.data;
  if (
    typeof data?.error === "object" &&
    Array.isArray(data?.error?.__all__) &&
    typeof data.error.__all__[0] === "string"
  ) {
    return data.error.__all__[0];
  }
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message === "string") return data.message;
  if (typeof e?.message === "string") return e.message;
  return "Failed to load bookmarks";
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
      setBookmarks((prev) => [created, ...prev]);
      setSaveBookmarkError(null);
      showToast.success("Address saved to bookmarks");
      return created;
    } catch (err: unknown) {
      if (isBookmarkAuthError(err)) {
        setSaveBookmarkError(LOGIN_TO_SAVE_BOOKMARK_INLINE);
        showToast.error(LOGIN_TO_SAVE_BOOKMARK_TOAST);
      } else {
        const e = err as any;
        const data = e?.response?.data;
        const msg =
          getBookmarkApiErrorMessage(err) ||
          (typeof data?.error === "object" &&
            Array.isArray(data?.error?.__all__) &&
            data.error.__all__[0]) ||
          (typeof data?.error === "string" ? data.error : null) ||
          data?.message ||
          e?.message ||
          "Failed to save bookmark";
        showToast.error(msg);
      }
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await bookmarkedAddressesApi.delete(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      showToast.success("Bookmark removed");
    } catch (err: unknown) {
      if (isBookmarkAuthError(err)) {
        return;
      }
      const e = err as { response?: { data?: unknown }; message?: string };
      const data = e?.response?.data as Record<string, unknown> | undefined;
      const msg =
        (typeof data?.error === "object" &&
          Array.isArray((data?.error as { __all__?: string[] })?.__all__) &&
          (data?.error as { __all__: string[] }).__all__[0]) ||
        (typeof data?.error === "string" ? data.error : null) ||
        (typeof data?.message === "string" ? data.message : null) ||
        getBookmarkApiErrorMessage(err) ||
        e?.message ||
        "Failed to remove bookmark";
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
