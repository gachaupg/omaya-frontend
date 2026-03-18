"use client";

import { useState, useCallback } from "react";
import { bookmarkedAddressesApi, BookmarkedAddress, CreateBookmarkPayload } from "../services/bookmarkedAddressesApi";
import { showToast } from "@/lib/utils/toast";

export function useBookmarkedAddresses(asset?: string, network?: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const list = await bookmarkedAddressesApi.list({ asset, network });
      setBookmarks(list);
      return list;
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        (typeof data?.error === "object" && Array.isArray(data?.error?.__all__) && data.error.__all__[0]) ||
        (typeof data?.error === "string" ? data.error : null) ||
        data?.message ||
        err?.message ||
        "Failed to load bookmarks";
      showToast.error(msg);
      setBookmarks([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [asset, network]);

  const saveBookmark = useCallback(async (payload: CreateBookmarkPayload) => {
    setSaving(true);
    try {
      const created = await bookmarkedAddressesApi.create(payload);
      setBookmarks((prev) => [created, ...prev]);
      showToast.success("Address saved to bookmarks");
      return created;
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        (typeof data?.error === "object" && Array.isArray(data?.error?.__all__) && data.error.__all__[0]) ||
        (typeof data?.error === "string" ? data.error : null) ||
        data?.message ||
        err?.message ||
        "Failed to save bookmark";
      showToast.error(msg);
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
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        (typeof data?.error === "object" && Array.isArray(data?.error?.__all__) && data.error.__all__[0]) ||
        (typeof data?.error === "string" ? data.error : null) ||
        data?.message ||
        err?.message ||
        "Failed to remove bookmark";
      showToast.error(msg);
    }
  }, []);

  return { bookmarks, loading, saving, fetchBookmarks, saveBookmark, deleteBookmark };
}
