"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useBlogsPaginated } from "../hooks/useBlogsPaginated";
import { BlogPost } from "../types";
import { useBlogsI18n } from "@/lib/useBlogsI18n";
import { imageBuilder } from "@/sanity/lib/client";
import { decodeHtml, stripAllImagesFromHtml } from "@/lib/utils/html";

import { logger } from '@/lib/utils/logger';

const ITEMS_PER_PAGE = 12;

// Category colors mapping - same as homepage (lowercase with underscores)
const categoryColors: { [key: string]: string } = {
  trading: "bg-gradient-to-r from-yellow-400 to-orange-500",
  security: "bg-gradient-to-r from-red-500 to-orange-500",
  defi: "bg-gradient-to-r from-green-400 to-green-600",
  market_analysis: "bg-gradient-to-r from-blue-500 to-purple-500",
  technology: "bg-gradient-to-r from-cyan-500 to-blue-500",
  regulation: "bg-gradient-to-r from-amber-500 to-orange-500",
  blog: "bg-gradient-to-r from-purple-500 to-pink-500",
  news: "bg-gradient-to-r from-blue-500 to-indigo-500",
  test: "bg-gradient-to-r from-green-400 to-green-600",
  Trading: "bg-gradient-to-r from-yellow-400 to-orange-500",
  Security: "bg-gradient-to-r from-red-500 to-orange-500",
  DeFi: "bg-gradient-to-r from-green-400 to-green-600",
  "Market Analysis": "bg-gradient-to-r from-blue-500 to-purple-500",
  Technology: "bg-gradient-to-r from-cyan-500 to-blue-500",
  Regulation: "bg-gradient-to-r from-amber-500 to-orange-500",
  Blog: "bg-gradient-to-r from-purple-500 to-pink-500",
  News: "bg-gradient-to-r from-blue-500 to-indigo-500",
};
const DEFAULT_CATEGORY_COLOR = "bg-gradient-to-r from-[#1D8751] to-green-600";

const formatCategoryLabel = (category: string): string => {
  if (!category) return "News";
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const getCategoryColor = (category: string): string => {
  if (!category) return DEFAULT_CATEGORY_COLOR;
  const key = category.toLowerCase().replace(/\s+/g, "_");
  return categoryColors[key] || categoryColors[category] || DEFAULT_CATEGORY_COLOR;
};

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { posts, totalCount, loading, error } = useBlogsPaginated({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });
  const router = useRouter();
  const { t } = useBlogsI18n();

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const displayedPosts = useMemo(() => {
    if (!normalizedSearchTerm) return posts;
    return posts.filter((post) =>
      (post.title || "").toLowerCase().includes(normalizedSearchTerm)
    );
  }, [posts, normalizedSearchTerm]);

  const handlePageChange = (newPage: number | ((prev: number) => number)) => {
    setCurrentPage(newPage);
    // Scroll to top of page when changing pages - use setTimeout to ensure content renders first
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 10);
  };

  // Pagination (server-side: posts are already the current page)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const indexOfFirstItem = (currentPage - 1) * ITEMS_PER_PAGE;
  const indexOfLastItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

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

  // Get post ID for routing - prefer _id for stable, shareable URLs
  const getPostId = (post: BlogPost): string | number => {
    return (post._id || post.id) ?? "";
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
    <div className="bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white min-h-screen p-0 pb-14 sm:p-6 md:p-8 mt-14 sm:mt-16">
      <div className="w-full px-4 md:px-6 lg:px-8">
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

        <div className="flex flex-col md:flex-row justify-end items-center mb-6 sm:mb-7 gap-4">
          <div className="relative w-full md:w-auto">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <FaSearch className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-72 bg-gray-50 dark:bg-[#161B22] border border-gray-300 dark:border-[#30363D] rounded-full py-2.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
              placeholder={t("blogs.search", "Search")}
            />
          </div>
        </div>

        {!loading && displayedPosts.length === 0 ? (
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
              {displayedPosts.map((post: BlogPost) => (
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
                    <span
                      className={`absolute left-3 top-3 ${getCategoryColor(
                        post.category || ""
                      )} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg`}
                    >
                      {formatCategoryLabel(post.category || "news")}
                    </span>
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
                      className="blog-content text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: decodeHtml(stripAllImagesFromHtml(post.description)) }}
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
            {!searchTerm.trim() && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 mb-10 sm:mb-0 border-t border-gray-200 dark:border-[#30363D]">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("blogs.pagination.showing", "Showing")} {indexOfFirstItem + 1}-{indexOfLastItem} {t("blogs.pagination.of", "of")} {totalCount} {t("blogs.pagination.posts", "posts")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${currentPage === 1
                      ? "opacity-50 cursor-not-allowed border-gray-300 dark:border-accent bg-gray-100 dark:bg-[#161B22] text-gray-400 dark:text-gray-500"
                      : "border-gray-300 dark:border-accent bg-white dark:bg-[#161B22] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1F2937]"
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
                              onClick={() => handlePageChange(page)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${currentPage === page
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
                    onClick={() => handlePageChange(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${currentPage === totalPages
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
