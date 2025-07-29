import { NextApiRequest, NextApiResponse } from 'next';
import { client } from '@/sanity/lib/client';

export interface FAQ {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt?: string;
}

export const fetchFAQs = async (category?: string): Promise<FAQ[]> => {
  try {
    console.log('Fetching FAQs from Sanity...');
    const query = `*[_type == "faq" ${category ? `&& category == "${category}"` : ''}] | order(createdAt desc) {
      _id,
      title,
      content,
      category,
      createdAt
    }`;

    const data = await client.fetch(query);
    console.log('Fetched FAQs:', data);
    return data || [];
  } catch (err) {
    console.error('Sanity fetch error:', err);
    throw new Error('Failed to load FAQs from Sanity');
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
    const { category } = req.query;
    console.log('FAQ API endpoint called with category:', category);
    
    const faqs = await fetchFAQs(category as string);
    console.log('Returning FAQs:', faqs.length);
    
    res.status(200).json(faqs);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch FAQs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}