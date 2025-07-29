/**
 * api.ts – auto‑generated placeholder
 */

import { BlogPost } from "./types";

export const blogApi = {
  async fetchAllPosts(): Promise<BlogPost[]> {
    try {
      const response = await fetch('/api/blogs/read');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blogs = await response.json();
      
      // Transform Sanity data to match UI expectations
      return blogs.map((blog: BlogPost, index: number) => ({
        ...blog,
        id: index + 1, // Generate numeric ID for UI compatibility
        created_at: blog.createdAt || blog.created_at || new Date().toISOString(),
        updated_at: blog.createdAt || blog.created_at || new Date().toISOString(),
        image: this.getImageUrl(blog.image), 
        author_name: blog.author_name || 'Anonymous',
      }));
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }
  },

  getImageUrl(image: any): string {
    if (!image) return '/images/placeholder.jpg';
    
    if (typeof image === 'string') {
      return image;
    }
    
    if (image.asset?._ref) {
      // Convert Sanity image reference to URL
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id';
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
      const imageId = image.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp');
      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
    }
    
    return '/images/placeholder.jpg';
  },

  async fetchBlogs(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      // Filter for blog category
      return allPosts.filter((blog: BlogPost) => blog.category === 'blog');
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw new Error('Failed to fetch blogs');
    }
  },

  async fetchNews(): Promise<BlogPost[]> {
    try {
      const allPosts = await this.fetchAllPosts();
      // Filter for news category
      return allPosts.filter((blog: BlogPost) => blog.category === 'news');
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Failed to fetch news');
    }
  },
};
