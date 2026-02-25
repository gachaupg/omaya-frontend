import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'blog',
  title: 'Blog',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      validation: (Rule) => Rule.required().min(10),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Market Analysis', value: 'market_analysis' },
          { title: 'DeFi', value: 'defi' },
          { title: 'Security', value: 'security' },
          { title: 'Trading', value: 'trading' },
          { title: 'Technology', value: 'technology' },
          { title: 'Regulation', value: 'regulation' },
          { title: 'Blog', value: 'blog' },
          { title: 'News', value: 'news' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'author_name',
      title: 'Author Name',
      type: 'string',
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Pending Review', value: 'pending_review' },
          { title: 'Published', value: 'published' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'draft',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'statusChangedAt',
      title: 'Status Changed At',
      type: 'datetime',
      description: 'When the status was last changed',
    }),
    defineField({
      name: 'requestedReviewAt',
      title: 'Requested Review At',
      type: 'datetime',
      description: 'When "Request Review" was clicked',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      description: 'When the blog was published',
    }),
  ],
});
