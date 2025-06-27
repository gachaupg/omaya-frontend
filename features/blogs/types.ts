/**
 * types.ts – auto‑generated placeholder
 */

export interface BlogPost {
  id: number;
  category: string;
  title: string;
  description: string;
  image: string;
  created_at: string;
  updated_at: string;
  author_name: string;
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
