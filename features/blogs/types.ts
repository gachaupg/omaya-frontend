/**
 * types.ts – auto‑generated placeholder
 */

export interface BlogPost {
  _id: string;
  title: string;
  description: string;
  category: string;
  image?: {
    asset: {
      _ref: string;
    };
  } | string;
  author_name?: string;
  createdAt?: string;
  // Legacy fields for UI compatibility
  id?: number;
  created_at?: string;
  updated_at?: string;
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
}
