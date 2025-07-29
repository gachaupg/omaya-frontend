import { NextApiRequest, NextApiResponse } from 'next';
import { client, imageBuilder } from '@/sanity/lib/client';

export interface Blog {
  _id: string;
  title: string;
  description: string;
  category: string;
  image?: any;
  author_name?: string;
  createdAt?: string;
}

export const fetchBlogs = async (): Promise<Blog[]> => {
  try {
    console.log('Fetching blogs from Sanity...');
    const data = await client.fetch(
      `*[_type == "blog"] | order(createdAt desc) {
          _id, 
          title, 
          description, 
          category,
          author_name, 
          createdAt,
          image
        }`
    );
    console.log('Fetched blogs:', data);
    return data || [];
  } catch (err) {
    console.error('Sanity fetch error:', err);
    throw new Error('Failed to load blogs from Sanity');
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const blogs = await fetchBlogs();
    res.status(200).json(blogs);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch blogs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
