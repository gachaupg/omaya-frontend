"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaCalendar, FaUser, FaTag } from "react-icons/fa";
import { useBlog } from "../../hooks/blog";
import { BlogPost } from "../../types";

const SingleBlogPage = () => {
  const params = useParams();
  const router = useRouter();
  const { blogs, news, loading, error } = useBlog();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (params?.id && (blogs.length > 0 || news.length > 0)) {
      const allPosts = [...blogs, ...news];
      const post = allPosts.find((post) => {
        const postId = post.id || post._id;
        return postId.toString() === params.id;
      });
      setBlogPost(post || null);
    }
  }, [params?.id, blogs, news]);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Get image URL from Sanity data structure
  const getImageUrl = (post: BlogPost) => {
    if (typeof post.image === 'string') {
      return post.image;
    }
    
    if (post.image?.asset?._ref) {
      // Convert Sanity image reference to URL
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id';
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
      const imageId = post.image.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp');
      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
    }
    
    return '/images/placeholder.jpg';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D8751] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading blog post...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#1D8751] text-white px-4 py-2 rounded-lg hover:bg-[#167a47] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Blog post not found
          </p>
          <button
            onClick={() => router.push("/blog")}
            className="bg-[#1D8751] text-white px-4 py-2 rounded-lg hover:bg-[#167a47] transition-colors"
          >
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/blog")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <FaArrowLeft className="h-4 w-4" />
          Back to Blog
        </button>

        {/* Main Card Container */}
        <div className="bg-gray-50 dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-2xl overflow-hidden">
          {/* Top Metadata */}
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-[#30363D]">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 dark:text-white">
              {blogPost.title}
            </h1>
          </div>

          {/* Featured Image */}
          <div className="relative w-full h-64 md:h-96">
            <Image
              src={getImageUrl(blogPost)}
              alt={blogPost.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
              className="object-cover"
            />
          </div>

          {/* Article Content */}
          <div className="p-6 md:p-8">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {blogPost.description}
              </p>

              {/* Placeholder for full content - you can extend this based on your API */}
              <div className="text-gray-600 dark:text-gray-400 space-y-4">
                <p>
                  This is a detailed view of the blog post. In a real
                  implementation, you would fetch the full content of the blog
                  post from your API using the blog post ID.
                </p>
                <p>
                  The current implementation shows the blog post details
                  including the title, description, author, category, and
                  creation date. You can extend this component to include the
                  full article content, comments, related posts, and other
                  features.
                </p>
                <p>
                  The blog post was created on {formatDate(blogPost.created_at || blogPost.createdAt || new Date().toISOString())}
                  and belongs to the {blogPost.category} category.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-[#30363D] bg-gray-100 dark:bg-[#0D1117]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <FaUser className="h-4 w-4" />
                  <span>By {blogPost.author_name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendar className="h-4 w-4" />
                  <span>Published {formatDate(blogPost.created_at || blogPost.createdAt || new Date().toISOString())}</span>
                </div>
              </div>

              <button
                onClick={() => router.push("/blog")}
                className="bg-[#1D8751] text-white px-6 py-2 rounded-full hover:bg-[#167a47] transition-colors"
              >
                Back to All Posts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBlogPage;
