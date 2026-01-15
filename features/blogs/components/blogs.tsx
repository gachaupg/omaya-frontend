"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useBlog } from "../hooks/blog";
import { BlogPost } from "../types";
import { useBlogsI18n } from "@/lib/useBlogsI18n";
import { imageBuilder } from "@/sanity/lib/client";
import { decodeHtml } from "@/lib/utils/html";

import { logger } from '@/lib/utils/logger';

const ITEMS_PER_PAGE = 12;

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { allPosts: allPostsFromHook, loading, error } = useBlog();
  const router = useRouter();
  const { t } = useBlogsI18n();

  // Use all posts from hook (includes all categories) and sort by date (newest first)
  const allPosts = useMemo(() => {
    if (!allPostsFromHook || allPostsFromHook.length === 0) {
      return [];
    }
    return [...allPostsFromHook].sort((a: BlogPost, b: BlogPost) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA; // Newest first
    });
  }, [allPostsFromHook]);

  // Filter posts based on search term
  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) {
      return allPosts;
    }

    const searchLower = searchTerm.toLowerCase();
    return allPosts.filter(
      (post: BlogPost) =>
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower) ||
        (post.author_name &&
          post.author_name.toLowerCase().includes(searchLower))
    );
  }, [allPosts, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(indexOfFirstItem, indexOfLastItem);

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
      <div className="bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
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
      <div className="bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
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
    <div className="bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white min-h-screen p-0 sm:p-6 md:p-8 mt-20">
      <div className="w-full px-0 sm:px-4 md:px-6 lg:px-8">
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
                  </span>
                    {afterLatest.trim()}
                </>
              );
            })()}
          </h1>
        </header>

        <div className="flex flex-col md:flex-row justify-end items-center mb-8 gap-4">
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
                    "No blog posts available."
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
          <>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedPosts.map((post: BlogPost) => (
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
                  {/* <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-3">
                    {post.description.length > 300
                      ? post.description.substring(0, 300).trim() + "..."
                      : post.description}
                  </p> */}
                  <div
                    className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: decodeHtml(post.description) }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
                    {t("blogs.byAuthor", "By {{author}}", {
                      author: post.author_name || "Anonymous",
                    })}
                  </p>
                  <button
                    onClick={() => handleReadArticle(getPostId(post))}
                    className="mt-auto w-fit text-[#1D8751] border border-[#1D8751] rounded-full px-6 py-2.5 text-base font-semibold hover:bg-[#1D8751] hover:text-white transition-colors duration-300 self-start"
                  >
                    {t("blogs.readArticle", "Read Article")}
                  </button>
                </div>
              </article>
              ))}
            </main>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-[#30363D]">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("blogs.pagination.showing", "Showing")} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPosts.length)} {t("blogs.pagination.of", "of")} {filteredPosts.length} {t("blogs.pagination.posts", "posts")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#161B22] text-gray-400 dark:text-gray-500"
                        : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]"
                    }`}
                  >
                    <FaChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const prevPage = array[index - 1];
                        const showEllipsisBefore = prevPage && page - prevPage > 1;
                        
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                currentPage === page
                                  ? "bg-[#1D8751] text-white border-[#1D8751]"
                                  : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]"
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-[#35353E] bg-gray-100 dark:bg-[#161B22] text-gray-400 dark:text-gray-500"
                        : "border-gray-300 dark:border-[#35353E] bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]"
                    }`}
                  >
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
