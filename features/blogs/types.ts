/**
 * types.ts – auto‑generated placeholder
 */

export interface BlogPost {
  _id: string;
  title: string;
  description: string;
  category: string;
  image?:
    | {
        asset: {
          _ref?: string;
          url?: string;
          metadata?: {
            dimensions?: {
              width: number;
              height: number;
            };
          };
        };
      }
    | string;
  author_name?: string;
  createdAt?: string;
  status?: string;
  statusChangedAt?: string;
  requestedReviewAt?: string;
  publishedAt?: string;
  // Legacy fields for UI compatibility
  id?: number;
  created_at?: string;
  updated_at?: string;
  content?: string;
  slug?: string;
  tags?: string[];
}

export interface BlogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BlogPost[];
}

export interface BlogState {
  blogs: BlogPost[];
  news: BlogPost[];
  loading: boolean;
  error: string | null;
  // Add flags to track if data has been fetched
  blogsFetched: boolean;
  newsFetched: boolean;
  // Add flags to prevent multiple simultaneous requests
  blogsLoading: boolean;
  newsLoading: boolean;
}
