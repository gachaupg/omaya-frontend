"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useBlog } from "../hooks/blog";
import { BlogPost } from "../types";
import { useBlogsI18n } from "@/lib/useBlogsI18n";
import { imageBuilder } from "@/sanity/lib/client";

import { logger } from '@/lib/utils/logger';

const BlogPage = () => {
  const [activeTab, setActiveTab] = useState("News");
  const [searchTerm, setSearchTerm] = useState("");
  const { blogs, news, loading, error } = useBlog();
  const router = useRouter();
  const { t } = useBlogsI18n();

  // Filter posts based on active tab and search term
  const getFilteredPosts = () => {
    const posts = activeTab === "News" ? news : blogs;

    if (!searchTerm.trim()) {
      return posts;
    }

    return posts.filter(
      (post: BlogPost) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.author_name &&
          post.author_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredPosts = getFilteredPosts();

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Handle read article click
  const handleReadArticle = (postId: string | number) => {
    router.push(`/blog/${postId}`);
  };

  // Get image URL using centralized image builder
  const getImageUrl = (post: BlogPost) => {
    try {
      return imageBuilder(post.image);
    } catch (error) {
      logger.error('general', 'Error getting image URL for post:', post.title, error);
      return '/images/alert-circle.svg';
    }
  };

  // Get post ID for routing
  const getPostId = (post: BlogPost) => {
    return post.id || post._id;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D8751] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("blogs.loading", "Loading blog posts...")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            {t("blogs.error.title", "Error:")} {error}
          </p>
          <p className="text-gray-400 mb-4 text-sm">
            {t(
              "blogs.error.hint",
              "Please check your Sanity configuration and try again."
            )}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#1D8751] text-white px-4 py-2 rounded-lg hover:bg-[#167a47] transition-colors"
          >
            {t("blogs.error.retry", "Try Again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8  mt-20">
      <div className="container mx-auto">
        <header className="mb-4 md:mb-6 text-center md:text-left">
          <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold leading-tight">
            {(() => {
              const title = t("blogs.title", "Enjoy Our Blog the Latest Company Updates");
              // Find positions of "Blog" and "Latest"
              const blogIndex = title.indexOf("Blog");
              const latestIndex = title.indexOf("Latest");
              
              if (blogIndex === -1 || latestIndex === -1) {
                // Fallback if keywords not found
                return title;
              }
              
              // Split the title into parts
              const beforeBlog = title.substring(0, blogIndex);
              const afterBlog = title.substring(blogIndex + 4, latestIndex);
              const afterLatest = title.substring(latestIndex + 6);
              
              return (
                <>
                  {beforeBlog}
                  <span className="text-[#1D8751]">Blog</span>
                  {afterBlog}
                  <span className="text-[#1D8751]">
                    Latest
                    <br />
                    {afterLatest.trim()}
                  </span>
                </>
              );
            })()}
          </h1>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-[#161B22] rounded-full border border-gray-300 dark:border-[#30363D]">
            <button
              onClick={() => setActiveTab("News")}
              className={`px-6 py-2 rounded-full text-sm font-medium flex 2xl:text-lg items-center gap-2 transition-colors ${
                activeTab === "News"
                  ? "bg-[#1D8751] text-white"
                  : "text-[#788099]"
              }`}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-full border-2 ${
                  activeTab === "News" ? "border-white" : "border-gray-400"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full ${
                    activeTab === "News" ? "bg-white" : "bg-transparent"
                  }`}
                ></span>
              </span>
              {t("blogs.tab.news", "News")}
            </button>
            <button
              onClick={() => setActiveTab("Blog")}
              className={`px-6 py-2 rounded-full text-sm 2xl:text-lg font-medium flex items-center gap-2 transition-colors ${
                activeTab === "Blog"
                  ? "bg-[#1D8751] text-white"
                  : "text-[#788099]"
              }`}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-full border-2 ${
                  activeTab === "Blog" ? "border-white" : "border-gray-400"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full ${
                    activeTab === "Blog" ? "bg-white" : "bg-transparent"
                  }`}
                ></span>
              </span>
              {t("blogs.tab.blog", "Blog")}
            </button>
          </div>

          <div className="relative w-full md:w-auto">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <FaSearch className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-72 bg-gray-50 dark:bg-[#161B22] border border-gray-300 dark:border-[#30363D] rounded-full py-2.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
              placeholder={t("blogs.search", "Search")}
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {searchTerm
                ? t(
                    "blogs.empty.search",
                    "No posts found matching your search."
                  )
                : t(
                    "blogs.empty.none",
                    `No ${activeTab.toLowerCase()} posts available.`,
                    { tab: activeTab.toLowerCase() }
                  )}
            </p>
            {!searchTerm && (
              <p className="text-gray-500 text-sm mt-2">
                {t(
                  "blogs.empty.hint",
                  "Please add some blog posts to your Sanity CMS."
                )}
              </p>
            )}
          </div>
        ) : (
          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: BlogPost) => (
              <article
                key={getPostId(post)}
                className="bg-gray-50 dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#1D87514f] transition-shadow duration-300 flex flex-col"
              >
                <div className="relative w-full h-56">
                  <Image
                    src={getImageUrl(post)}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="rounded-t-2xl object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span>
                      {formatDate(
                        post.created_at ||
                          post.createdAt ||
                          new Date().toISOString()
                      )}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-semibold bg-gray-200 dark:bg-[#30363D] text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-3 flex-grow text-gray-900 dark:text-white">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-3">
                    {post.description.length > 300
                      ? post.description.substring(0, 300).trim() + "..."
                      : post.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
                    {t("blogs.byAuthor", "By {{author}}", {
                      author: post.author_name || "Anonymous",
                    })}
                  </p>
                  <button
                    onClick={() => handleReadArticle(getPostId(post))}
                    className="mt-auto w-fit text-[#1D8751] border border-[#1D8751] rounded-full px-2.5 py-2.5 text-sm font-semibold hover:bg-[#1D8751] hover:text-white transition-colors duration-300 self-start"
                  >
                    {t("blogs.readArticle", "Read Article")}
                  </button>
                </div>
              </article>
            ))}
          </main>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
