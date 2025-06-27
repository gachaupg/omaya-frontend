"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useBlog } from "../hooks/blog";
import { BlogPost } from "../types";

const BlogPage = () => {
  const [activeTab, setActiveTab] = useState("News");
  const [searchTerm, setSearchTerm] = useState("");
  const { blogs, news, loading, error } = useBlog();
  const router = useRouter();

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
        post.author_name.toLowerCase().includes(searchTerm.toLowerCase())
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
  const handleReadArticle = (postId: number) => {
    router.push(`/blog/${postId}`);
  };

  if (loading) {
    return (
      <div className=" text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D8751] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=" text-white min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
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

  return (
    <div className=" text-white min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 md:mb-12 text-center md:text-left">
          <h1 className="text-2xl mt-10 sm:text-2xl md:text-5xl font-bold leading-tight">
            Enjoy Our Blog On the <span className="text-[#1D8751]">Latest</span>
            <br />
            Company Updates
          </h1>
        </header>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-2 bg-[#161B22] p-1 rounded-full border border-[#30363D]">
            <button
              onClick={() => setActiveTab("News")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                activeTab === "News"
                  ? "bg-[#1D8751] text-white"
                  : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              News
            </button>
            <button
              onClick={() => setActiveTab("Blog")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                activeTab === "Blog"
                  ? "bg-[#1D8751] text-white"
                  : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              Blog
            </button>
          </div>

          <div className="relative w-full md:w-auto">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-72 bg-[#161B22] border border-[#30363D] rounded-full py-2.5 pl-11 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D8751]"
              placeholder="Search"
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {searchTerm
                ? "No posts found matching your search."
                : `No ${activeTab.toLowerCase()} posts available.`}
            </p>
          </div>
        ) : (
          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: BlogPost) => (
              <article
                key={post.id}
                className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#1D87514f] transition-shadow duration-300 flex flex-col"
              >
                <div className="relative w-full h-56">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="rounded-t-2xl object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                    <span>{formatDate(post.created_at)}</span>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs font-semibold bg-[#30363D] text-gray-300 px-2 py-1 rounded-md">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-3 flex-grow">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 mb-4 text-sm line-clamp-3">
                    {post.description}
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    By {post.author_name}
                  </p>
                  <button
                    onClick={() => handleReadArticle(post.id)}
                    className="mt-auto w-fit text-[#1D8751] border border-[#1D8751] rounded-full px-6 py-2 text-sm font-semibold hover:bg-[#1D8751] hover:text-white transition-colors duration-300 self-start"
                  >
                    Read Article
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
