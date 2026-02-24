"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaCalendar, FaUser, FaTag } from "react-icons/fa";
import { useBlog } from "../../hooks/blog";
import { BlogPost } from "../../types";
import { imageBuilder } from "@/sanity/lib/client";
import { decodeHtml } from "@/lib/utils/html";

const SingleBlogPage = () => {
  const params = useParams();
  const router = useRouter();
  const { allPosts, loading, error } = useBlog();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (params?.id && allPosts.length > 0) {
      const post = allPosts.find((post) => {
        const postId = post.id || post._id;
        return postId.toString() === params.id;
      });
      setBlogPost(post || null);
    }
  }, [params?.id, allPosts]);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Get image URL using centralized image builder
  const getImageUrl = (post: BlogPost) => {
    return imageBuilder(post.image);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
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
      <div className="bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
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
      <div className="bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
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
    <div className="bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white min-h-screen px-4 sm:p-6 md:p-8 mt-16">
      <div className="w-full max-w-4xl min-w-0 mx-auto px-0 sm:px-4 md:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/blog")}
          className="flex items-center gap-2 text-[#1D8751] hover:text-[#166b3e] mb-6 transition-colors"
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
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: decodeHtml(blogPost.description) }}
              />
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="p-6 md:p-8 border-t border-gray-200 dark:border-[#30363D] bg-gray-100 dark:bg-[var(--bg-color)]">
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
