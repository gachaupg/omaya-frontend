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
      showToast.error(err?.message || "Failed to load bookmarks");
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
      showToast.error(err?.response?.data?.message || err?.message || "Failed to save bookmark");
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
      showToast.error(err?.message || "Failed to remove bookmark");
    }
  }, []);

  return { bookmarks, loading, saving, fetchBookmarks, saveBookmark, deleteBookmark };
}
