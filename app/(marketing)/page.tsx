"use client";
import React, { useState, useMemo } from "react";
import { useMarketingI18n } from "@/lib/useMarketingI18n";
import Image from "next/image";
import Link from "next/link";
import { tokens } from "@/styles/tokens";
import { Play, MessageCircle, Plus, BarChart, Globe, Lock, DollarSign, Users, TrendingUp, Shield, Zap, Gift, UserPlus, ArrowRight, Building2, Calendar, Clock, MapPin, Phone, Mail, Send, ChevronDown, ChevronUp, ArrowLeftRight } from "lucide-react";
import ExchangeForm from "@/components/ExchangeForm";
import { useBlog } from "@/features/blogs/hooks/blog";
import { BlogPost } from "@/features/blogs/types";
import { useFAQ } from "@/features/faq/hooks/useFAQ";
import { ContactForm } from "@/features/contact/components";
import { useHighlightStatistics } from "@/features/contact/hooks/useHighlightStatistics";
import { useSimpleMarkets } from "@/features/markets/hooks/useSimpleMarkets";

const steps = [
  {
    icon: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/create_account_gzbijn.png",
    title: "marketing.steps.create.title",
    description: "marketing.steps.create.desc",
  },
  {
    icon: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/verify_i9k3dd.png",
    title: "marketing.steps.verify.title",
    description: "marketing.steps.verify.desc",
  },
  {
    icon: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/Transfermoney_hnssjb.png",
    title: "marketing.steps.transfer.title",
    description: "marketing.steps.transfer.desc",
  },
  {
    icon: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/exchange_gmhyus.png",
    title: "marketing.steps.start.title",
    description: "marketing.steps.start.desc",
  },
];

// Static fallback achievements (used while loading or on error)
const fallbackAchievements = [
  {
    value: "50M+",
    label: "USD Total Transactions",
  },
  {
    value: "5500+",
    label: "Satisfied Clients",
  },
  {
    value: "50,000+",
    label: "Successful Transactions",
  },
  {
    value: "5+",
    label: "Years Of Experience",
  },
];

const features = [
  "Low Transaction Fee",
  "Secure Payment Service",
  "Fast Transactions",
  "We Work 24/7",
];

const fallbackSupportedAssets = [
  {
    id: "fxprimus",
    name: "FXPRIMUS",
    symbol: "FXP",
    image:
      "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793801/FXPRIMUS-logo_2_k8ikwb.png",
    current_price: 0,
    price_change_percentage_24h: 0,
  },
  {
    id: "perfect-money",
    name: "Perfect Money",
    symbol: "PM",
    image:
      "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793801/Perfect_Money_Logo_2_niaa2j.png",
    current_price: 0,
    price_change_percentage_24h: 0,
  },
  {
    id: "usdt-erc20",
    name: "USDT Tether (ERC20)",
    symbol: "USDT",
    image:
      "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Group_164023_bluiv9.png",
    current_price: 1.0,
    price_change_percentage_24h: 0.01,
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    image:
      "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Bitcoin-1_b6ku56.png",
    current_price: 42580,
    price_change_percentage_24h: 2.4,
  },
  {
    id: "usdt-trc20",
    name: "USDT Tether (TRC20)",
    symbol: "USDT",
    image:
      "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Tether_ttkeym.png",
    current_price: 1.0,
    price_change_percentage_24h: 0.01,
  },
  {
    id: "icm-capital",
    name: "ICM Capital",
    symbol: "ICM",
    image:
      "https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/ICMCapital_1_qte6tt.png",
    current_price: 0,
    price_change_percentage_24h: 0,
  },
];

type Category = "News" | "Blog";

interface ArticleTag {
  id: number;
  name: string;
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  category: Category;
  tags: ArticleTag[];
  slug: string;
  createdAt?: string;
}

export default function MarketingPage() {
  const { t } = useMarketingI18n();
  const [activeCategory, setActiveCategory] = useState<Category>("News");
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [showContactSuccess, setShowContactSuccess] = useState(false);
  const [showContactError, setShowContactError] = useState(false);
  const [contactErrorMessage, setContactErrorMessage] = useState("");
  const [showAllFAQs, setShowAllFAQs] = useState(false);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const { blogs, news, loading, error } = useBlog();
  const { faqs: faqItems, loading: faqLoading, error: faqError } = useFAQ();
  const { statistics, loading: statsLoading, error: statsError } = useHighlightStatistics();
  const {
    markets: marketAssets,
    loading: marketsLoading,
    error: marketsError,
  } = useSimpleMarkets(50);

  const transformedMarketAssets = useMemo(
    () =>
      (marketAssets || []).map((asset) => ({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol?.toUpperCase() ?? "",
        image: asset.image ?? "/images/alert-circle.svg",
        current_price: asset.current_price ?? 0,
        price_change_percentage_24h: asset.price_change_percentage_24h ?? 0,
      })),
    [marketAssets]
  );

  const assetsSource = transformedMarketAssets.length
    ? transformedMarketAssets
    : fallbackSupportedAssets;

  const maxPreviewAssets = 8;

  const displayedAssets = useMemo(
    () =>
      showAllAssets
        ? assetsSource
        : assetsSource.slice(0, maxPreviewAssets),
    [assetsSource, showAllAssets]
  );

  const shouldRenderToggle = assetsSource.length > maxPreviewAssets;

  const toggleLabel = showAllAssets
    ? t("marketing.assets.toggleLess", "Show Less")
    : t(
        "marketing.assets.toggleMore",
        `Show All (${assetsSource.length})`
      );

  // Transform API statistics to achievements format
  const achievements = statistics ? [
    {
      value: statistics.total_transactions_usdt,
      label: "USD Total Transactions",
    },
    {
      value: statistics.satisfied_clients,
      label: "Satisfied Clients",
    },
    {
      value: statistics.successful_transactions,
      label: "Successful Transactions",
    },
    {
      value: statistics.years_of_experience,
      label: "Years Of Experience",
    },
  ] : fallbackAchievements;

  const tags = [
    { id: 1, name: "Crypto" },
    { id: 2, name: "Investment" },
    { id: 3, name: "NFTs" },
    { id: 4, name: "Trading" },
    { id: 5, name: "Finance" },
    { id: 6, name: "Technology" },
  ];

  // Transform Sanity blog data to match the Article interface
  const transformBlogToArticle = (blog: BlogPost, index: number): Article => {
    // Get image URL from Sanity data
    const getImageUrl = (post: BlogPost) => {
      if (typeof post.image === "string") {
        return post.image;
      }

      // Handle Sanity image with asset.url (from the updated query)
      if (post.image?.asset && 'url' in post.image.asset) {
        return (post.image.asset as any).url || "/images/placeholder.jpg";
      }

      // Handle Sanity image with asset._ref (legacy format)
      if (post.image?.asset?._ref) {
        const projectId =
          process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "your-project-id";
        const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
        const imageId = post.image.asset._ref
          .replace("image-", "")
          .replace("-jpg", ".jpg")
          .replace("-png", ".png")
          .replace("-webp", ".webp");
        return `https://cdn.sanity.io/images/${projectId}/${dataset}/${imageId}`;
      }

      return "/images/alert-circle.svg";
    };

    // Format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Create slug from title
    const createSlug = (title: string) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    };

    // Truncate description to 300 characters with ellipses
    const truncateDescription = (description: string) => {
      if (description.length <= 300) {
        return description;
      }
      return description.substring(0, 300).trim() + "...";
    };

    return {
      id: index + 1,
      title: blog.title,
      excerpt: truncateDescription(blog.description),
      image: getImageUrl(blog),
      category: blog.category === "news" ? "News" : ("Blog" as Category),
      tags: [tags[0], tags[1]], // Default tags
      slug: createSlug(blog.title),
      createdAt: formatDate(
        blog.created_at || blog.createdAt || new Date().toISOString()
      ),
    };
  };

  // Get all articles (both News and Blog)
  const getArticles = (): Article[] => {
    const allPosts = [...news, ...blogs];
    return allPosts
      .slice(0, 6)
      .map((post, index) => transformBlogToArticle(post, index));
  };

  const articles = getArticles();
  const filteredArticles = articles;

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  const handleContactSuccess = () => {
    setShowContactSuccess(true);
    setShowContactError(false);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowContactSuccess(false);
    }, 3000);
  };

  const handleContactError = (error: string) => {
    setContactErrorMessage(error);
    setShowContactError(true);
    setShowContactSuccess(false);

    // Hide error message after 5 seconds
    setTimeout(() => {
      setShowContactError(false);
    }, 5000);
  };

  return (
    <div>
      <section
        className="relative min-h-screen pt-18 pb-16 mx-auto overflow-visible bg-[#0A0A0A] dark:bg-[#0A0A0A] bg-white"
      >
        {/* Green glowing particles background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Glowing particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#1D8751] rounded-full opacity-60 blur-sm animate-pulse"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-[#1D8751] rounded-full opacity-40 blur-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-[#1D8751] rounded-full opacity-50 blur-sm animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-[#1D8751] rounded-full opacity-45 blur-sm animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-[#1D8751] rounded-full opacity-35 blur-md animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-[#1D8751] rounded-full opacity-55 blur-sm animate-pulse" style={{ animationDelay: '2.5s' }}></div>
          
          {/* Subtle gradient overlays for depth */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, ${tokens.colors.brand.lightGreen}15 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, ${tokens.colors.brand.lightGreen}10 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, ${tokens.colors.brand.hero}08 0%, transparent 60%)
              `,
            }}
          ></div>
        </div>
        
        {/* Heptagonal Patterns */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Bottom right heptagon */}
          <div
            className="absolute bottom-[80px] right-[20px] w-[100px] h-[100px] sm:bottom-[120px] sm:right-[30px] sm:w-[130px] sm:h-[130px] md:bottom-[160px] md:right-[40px] md:w-[170px] md:h-[170px] 2xl:bottom-[220px] 2xl:right-[130px] opacity-20 bg-[#1D8751] hidden sm:block"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>

          {/* Top left heptagon */}
          <div
            className="absolute top-[-20px] left-[20px] w-[70px] h-[70px] sm:left-[30px] sm:w-[90px] sm:h-[90px] 2xl:left-[60px] opacity-20 bg-[#1D8751] hidden sm:block"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>

          {/* Bottom left heptagon */}
          <div
            className="absolute bottom-[-40px] left-[150px] w-[120px] h-[120px] sm:left-[200px] sm:w-[150px] sm:h-[150px] md:left-[300px] md:w-[180px] md:h-[180px] opacity-20 bg-[#1D8751] hidden sm:block"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>

          {/* Top right heptagon */}
          <div
            className="absolute top-[40px] left-[50%] translate-x-[-50%] w-[120px] h-[120px] sm:top-[60px] sm:left-[60%] sm:w-[150px] sm:h-[150px] md:top-[70px] md:left-[720px] md:w-[180px] md:h-[180px] 2xl:left-[1250px] opacity-20 bg-[#1D8751] hidden md:block"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>
        </div>

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 items-start gap-y-5 md:gap-y-4 md:gap-x-6 lg:gap-x-8 xl:gap-x-10">
            <div className="space-y-2 md:space-y-3 pl-0 md:pl-4 lg:pl-5 text-center md:text-left">
              {/* Green pill banner */}
              <div className="inline-flex items-center justify-center md:justify-start">
                <span className="bg-[#1D8751]/10 border border-[#1D8751] text-[#1D8751] px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  Somalia's #1 Crypto Exchange.
                </span>
              </div>

              {/* Main heading */}
              <h1 className="text-[1.5rem] sm:text-[1.75rem] md:text-[2.5rem] lg:text-[3rem] xl:text-[3.5rem] font-bold text-gray-900 dark:text-white tracking-tight leading-tight sm:leading-tight md:leading-tight lg:leading-tight">
                <span className="block">Trade Crypto</span>
                <span className="block text-[#1D8751]">Instantly</span>
                <span className="block">
                  With <span className="text-[#1D8751]">OMAYA</span>
                </span>
              </h1>

              {/* Description text */}
              <p className="text-gray-700 dark:text-white/90 leading-relaxed max-w-full sm:max-w-2xl md:max-w-3xl mx-auto lg:mx-0 px-4 sm:px-0 text-xs sm:text-sm md:text-sm lg:text-base">
                Experience lightning-fast trades, ultra-low fees, and bank-grade security.{" "}
                <span className="text-[#1D8751]">Join 500,000+ traders worldwide.</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start w-full sm:w-auto">
                <a
                  href="#contact"
                  className="rounded-lg px-5 sm:px-6 py-2.5 sm:py-2.5 text-white bg-[#1D8751] text-sm sm:text-base font-medium hover:bg-[#167a47] transition-colors min-h-[44px] flex items-center justify-center gap-2"
                >
                  Start Trading Now
                  <span className="text-lg">→</span>
                </a>
                <button className="rounded-lg px-5 sm:px-6 py-2.5 sm:py-2.5 text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1D1D23] border border-gray-300 dark:border-[#35353E] text-sm sm:text-base font-medium hover:bg-gray-200 dark:hover:bg-[#23232B] transition-colors min-h-[44px] flex items-center justify-center gap-2">
                  Watch Demo
                  <Play size={16} className="text-[#1D8751]" />
                </button>
              </div>

              {/* Three stat cards */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start pt-1 md:pt-2">
                {/* Trading Volume Card */}
                <div className="bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-lg px-5 py-3 flex flex-col items-center gap-2 min-w-[160px]">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold text-center">$50M+</p>
                  <p className="text-gray-700 dark:text-white text-xs font-medium text-center">Trading Volume</p>
                </div>

                {/* Countries Card */}
                <div className="bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-lg px-5 py-3 flex flex-col items-center gap-2 min-w-[160px]">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold text-center">50+</p>
                  <p className="text-gray-700 dark:text-white text-xs font-medium text-center">Countries</p>
                </div>

                {/* Uptime Card */}
                <div className="bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-lg px-5 py-3 flex flex-col items-center gap-2 min-w-[160px]">
                  <div className="w-10 h-10 rounded-lg bg-[#1D8751]/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#1D8751]" />
                  </div>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold text-center">99.9%</p>
                  <p className="text-gray-700 dark:text-white text-xs font-medium text-center">Uptime</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center md:justify-end lg:justify-end w-full">
              <div className="w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
                <ExchangeForm isHomePage={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-4 sm:pt-6 md:pt-8 pb-12 sm:pb-16 md:pb-20 px-4 md:px-[100px] bg-white dark:bg-[#0A0A0A]">
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl">
          {/* Green pill banner */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <span className="bg-[#1D8751]/10 border border-[#1D8751] text-[#1D8751] px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              Trusted by Thousands
            </span>
          </div>

          {/* Section Title */}
          <h2 className="text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold mb-3 sm:mb-4">
            <span className="text-gray-900 dark:text-white">
              {t(
                "marketing.achievements.title.leading",
                "Celebrating Success:"
              )}
            </span>{" "}
            <span className="text-[#1D8751]">
              {t(
                "marketing.achievements.title.highlight",
                "Key Achievements"
              )}
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-center text-gray-700 dark:text-white text-sm sm:text-base md:text-lg mb-8 sm:mb-10 md:mb-12 px-4">
            Join the fastest-growing crypto exchange platform in Somalia.
          </p>

          {/* First Row - Achievement Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 md:mb-10">
            {achievements.map((achievement, index) => {
              const icons = [
                <DollarSign key="dollar" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />,
                <Users key="users" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />,
                <TrendingUp key="trending" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />,
                <Shield key="shield" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />,
              ];
              
              const titles = [
                "USD Fiat Transactions",
                "Satisfied Users",
                "Successful Transactions",
                "Years Of Experience",
              ];
              
              const descriptions = [
                "Total trading volume.",
                "Active traders worldwide.",
                "Completed daily trades.",
                "Industry leadership.",
              ];

              return (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 flex flex-col relative overflow-hidden border border-gray-200 dark:border-[#2A2A2A]"
                >
                  {/* Dark mode gradient background */}
                  <div 
                    className="hidden dark:block absolute inset-0 rounded-lg sm:rounded-xl"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(29, 29, 35, 0.95), rgba(29, 29, 35, 1))'
                    }}
                  ></div>
                  
                  {/* Greenish gradient overlay - lighter in light mode */}
                  <div 
                    className="absolute top-0 right-0 bottom-0 w-3/4 opacity-30 dark:opacity-60 rounded-lg sm:rounded-xl"
                    style={{
                      background: 'linear-gradient(to left, rgba(29, 135, 81, 0.15) 0%, rgba(29, 135, 81, 0.08) 40%, transparent 100%)'
                    }}
                  ></div>
                  
                  {/* Content wrapper */}
                  <div className="relative z-10 flex flex-col">
                  
                  {/* Icon Container - Vibrant green rounded square */}
                  <div className="relative mb-3 sm:mb-4 self-start">
                    <div 
                      className="bg-[#1D8751] rounded-lg p-2 sm:p-2.5 md:p-3 flex items-center justify-center shadow-md"
                      style={{
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      {icons[index]}
                    </div>
                  </div>
                  
                  {/* Number */}
                  <div className="text-[#1D8751] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
                    {achievement.value}
                  </div>
                  
                  {/* Title */}
                  <div className="text-gray-900 dark:text-white text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2">
                    {titles[index]}
                  </div>
                  
                  {/* Description */}
                  <div className="text-gray-700 dark:text-white text-xs sm:text-sm">
                    {descriptions[index]}
                  </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Second Row - Feature Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {/* 0.1% Trading Fee */}
            <div 
              className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors shadow-lg"
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#FF9500] mb-2 sm:mb-3" />
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base text-center font-medium">
                0.1% Trading Fee
              </p>
            </div>

            {/* Bank-Grade Security */}
            <div 
              className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors shadow-lg"
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#3B82F6] mb-2 sm:mb-3" />
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base text-center font-medium">
                Bank-Grade Security
              </p>
            </div>

            {/* 24/7 Support */}
            <div 
              className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors shadow-lg"
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Globe className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#8B5CF6] mb-2 sm:mb-3" />
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base text-center font-medium">
                24/7 Support
              </p>
            </div>

            {/* Real-Time Charts */}
            <div 
              className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors shadow-lg"
              style={{
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
              }}
            >
              <BarChart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#1D8751] mb-2 sm:mb-3" />
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base text-center font-medium">
                Real-Time Charts
              </p>
            </div>
          </div>
        </div>

        </div>


      {/* Supported Assets Section*/}
      <div
        id="supported-assets"
        className="w-full bg-white dark:bg-[#0A0A0A] pt-4 md:pt-6 pb-16 px-4 md:px-[100px] relative overflow-hidden"
      >
        {/* Subtle green glowing dots background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#13B562] rounded-full opacity-60 blur-sm animate-pulse"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-[#13B562] rounded-full opacity-40 blur-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-[#1D8751] rounded-full opacity-50 blur-sm animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl relative z-10">
          {/* Section Title */}
          <h2 className="text-center text-2xl md:text-3xl 2xl:text-4xl font-bold mb-3">
            <span className="text-gray-900 dark:text-white">Trade Your Favorite</span>{" "}
            <span className="text-[#1D8751]">Cryptocurrencies</span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-center text-gray-700 dark:text-white text-sm sm:text-base md:text-lg mb-12 px-4">
            Access 500+ cryptocurrencies with industry-leading security, competitive fees and lightning-fast transactions.
          </p>

          {/* Cryptocurrency Cards Grid - 2 rows of 4 */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-8">
            {marketsLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`asset-skeleton-${index}`}
                    className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 border border-gray-200 dark:border-[#2A2A2A] animate-pulse relative overflow-hidden"
                  >
                    {/* Dark mode gradient background */}
                    <div 
                      className="hidden dark:block absolute inset-0 rounded-lg"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(29, 29, 35, 0.95), rgba(29, 29, 35, 1))',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                      }}
                    ></div>
                    <div className="relative z-10">
                      <div className="w-10 h-10 mb-3 bg-gray-200 dark:bg-[#23232B] rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-[#23232B] rounded mb-2 w-20"></div>
                      <div className="h-3 bg-gray-200 dark:bg-[#23232B] rounded mb-2 w-12"></div>
                      <div className="h-5 bg-gray-200 dark:bg-[#23232B] rounded mb-1 w-24"></div>
                      <div className="h-3 bg-gray-200 dark:bg-[#23232B] rounded w-16"></div>
                    </div>
                  </div>
                ))
              : (
                  <>
                    {displayedAssets.slice(0, 8).map((asset) => {
                      const price = asset.current_price || 0;
                      const change = asset.price_change_percentage_24h || 0;
                      const formattedPrice = price >= 1 
                        ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : price.toFixed(4);
                      
                      // Get icon container color based on symbol
                      const getIconColor = (symbol: string, name: string) => {
                        const symbolUpper = symbol.toUpperCase();
                        const nameUpper = name.toUpperCase();
                        const colorMap: { [key: string]: string } = {
                          'BTC': 'bg-orange-500', // Bitcoin - orange circle
                          'BITCOIN': 'bg-orange-500',
                          'ETH': 'bg-indigo-600', // Ethereum - indigo/purple
                          'ETHEREUM': 'bg-indigo-600',
                          'USDT': 'bg-green-500', // Tether - green circle
                          'TETHER': 'bg-green-500',
                          'BNB': 'bg-yellow-500', // BNB - yellow
                          'ADA': 'bg-blue-700', // Cardano - dark blue
                          'CARDANO': 'bg-blue-700',
                          'XRP': 'bg-red-500', // Ripple - red circle
                          'RIPPLE': 'bg-red-500',
                          'SOL': 'bg-purple-600', // Solana - purple square
                          'SOLANA': 'bg-purple-600',
                          'DOT': 'bg-pink-500', // Polkadot - pink square
                          'POLKADOT': 'bg-pink-500',
                          'FXP': 'bg-blue-700', // FXPRIMUS - dark blue
                          'FXPRIMUS': 'bg-blue-700',
                          'PM': 'bg-red-500', // Perfect Money - red circle
                          'PERFECT MONEY': 'bg-red-500',
                          'ICM': 'bg-blue-500', // ICM Capital - blue
                          'ICM CAPITAL': 'bg-blue-500',
                        };
                        return colorMap[symbolUpper] || colorMap[nameUpper] || 'bg-gray-500'; // Default gray
                      };
                      
                      const iconBgColor = getIconColor(asset.symbol, asset.name);
                      
                      return (
                        <div
                          key={asset.id}
                          className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors relative overflow-visible"
                        >
                          {/* Dark mode gradient background */}
                          <div 
                            className="hidden dark:block absolute inset-0 rounded-lg"
                            style={{
                              background: 'linear-gradient(to bottom, rgba(29, 29, 35, 0.95), rgba(29, 29, 35, 1))',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                            }}
                          ></div>
                          
                          {/* Greenish radial gradient from top-right corner - lighter in light mode */}
                          <div 
                            className="absolute top-0 right-0 w-3/4 h-3/4 opacity-20 dark:opacity-30 pointer-events-none rounded-lg"
                            style={{
                              background: 'radial-gradient(circle at top right, rgba(29, 135, 81, 0.15) 0%, transparent 70%)'
                            }}
                          ></div>
                          
                          {/* Content wrapper with relative positioning */}
                          <div className="relative z-10">
                          {/* Icon header with colored bar cutting across */}
                          <div className="relative mb-3 w-full -mx-4">
                            {/* Colored horizontal bar cutting across - faded, edge to edge, no padding, full right coverage */}
                            <div 
                              className={`absolute top-1/2 left-0 h-12 ${iconBgColor} transform -translate-y-1/2 opacity-30`}
                              style={{
                                right: '-1rem',
                                width: 'calc(100% + 2rem)'
                              }}
                            ></div>
                            {/* Centered asset image */}
                            <div className="relative z-10 flex items-center justify-center">
                              <div className="w-10 h-10 bg-white dark:bg-[#1D1D23] rounded-full flex items-center justify-center border border-gray-200 dark:border-transparent">
                                <Image
                                  src={asset.image}
                                  alt={asset.name}
                                  width={32}
                                  height={32}
                                  className="object-contain w-full h-full"
                                  unoptimized
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Cryptocurrency Name - Left aligned */}
                          <div className="text-gray-900 dark:text-white font-bold text-sm sm:text-base mb-1">
                            {asset.name}
                          </div>
                          
                          {/* Ticker Symbol - Left aligned */}
                          <div className="text-gray-700 dark:text-white text-xs sm:text-sm mb-3 opacity-80">
                            {asset.symbol}
                          </div>
                          
                          {/* Price and Percentage Change - Left aligned */}
                          <div className="flex items-baseline gap-2 mb-2">
                            <div className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">
                              ${formattedPrice}
                            </div>
                            <div className={`text-xs sm:text-sm font-medium ${change >= 0 ? 'text-[#13B562]' : 'text-red-500'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </div>
                          </div>
                          
                          {/* Mini Line Chart */}
                          <div className="h-8 w-full mt-2">
                            <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none" className="overflow-visible">
                              <polyline
                                points="0,25 10,22 20,20 30,18 40,15 50,12 60,10 70,8 80,6 90,4 100,2"
                                fill="none"
                                stroke="#1D8751"
                                strokeWidth="2"
                                strokeDasharray="2,2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
          </div>

          {/* Feature/Achievement Cards - Bottom Row */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {/* 500+ Total Assets */}
            <div 
              className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors flex flex-col items-center relative overflow-hidden"
            >
              {/* Dark mode gradient background */}
              <div 
                className="hidden dark:block absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(to bottom, rgba(29, 29, 35, 0.95), rgba(29, 29, 35, 1))',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}
              ></div>
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-3 flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-gray-900 dark:text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">500+</div>
                <div className="text-gray-700 dark:text-white text-xs sm:text-sm md:text-base text-center">Total Assets</div>
              </div>
            </div>

            {/* 1000+ Trading Pairs */}
            <div 
              className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors flex flex-col items-center relative overflow-hidden"
            >
              {/* Dark mode gradient background */}
              <div 
                className="hidden dark:block absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(to bottom, rgba(29, 29, 35, 0.95), rgba(29, 29, 35, 1))',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}
              ></div>
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-3 flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" className="text-pink-400">
                    <path d="M3 21L12 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-gray-900 dark:text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">1000+</div>
                <div className="text-gray-700 dark:text-white text-xs sm:text-sm md:text-base text-center">Trading Pairs</div>
              </div>
            </div>

            {/* $2B+ Daily Volume */}
            <div 
              className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors flex flex-col items-center relative overflow-hidden"
            >
              {/* Dark mode gradient background */}
              <div 
                className="hidden dark:block absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(to bottom, rgba(29, 29, 35, 0.95), rgba(29, 29, 35, 1))',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}
              ></div>
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-3 flex items-center justify-center">
                  <DollarSign className="w-full h-full text-[#13B562]" />
                </div>
                <div className="text-gray-900 dark:text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">$2B+</div>
                <div className="text-gray-700 dark:text-white text-xs sm:text-sm md:text-base text-center">Daily Volume</div>
              </div>
            </div>

            {/* Spot & P2P Markets */}
            <div 
              className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors flex flex-col items-center relative overflow-hidden"
            >
              {/* Dark mode gradient background */}
              <div 
                className="hidden dark:block absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(to bottom, rgba(29, 29, 35, 0.95), rgba(29, 29, 35, 1))',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}
              ></div>
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-3 flex items-center justify-center">
                  <BarChart className="w-full h-full text-orange-400" />
                </div>
                <div className="text-gray-900 dark:text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">Spot & P2P</div>
                <div className="text-gray-700 dark:text-white text-xs sm:text-sm md:text-base text-center">Markets</div>
              </div>
            </div>
          </div>

          {marketsError && (
            <p className="text-center text-sm text-red-400 mt-6">
              {t(
                "marketing.assets.error",
                "Unable to load live assets right now. Showing defaults."
              )}
            </p>
          )}
        </div>
      </div>

      {/* Safe & Reliable Section */}
      <div className="w-full bg-white dark:bg-[#0A0A0A] pt-8 pb-16">
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Section - Image */}
            <div className="relative">
              <div className="relative w-full overflow-hidden rounded-t-[1.5rem] md:rounded-t-[2rem] rounded-b-lg">
                <Image
                  src="https://res.cloudinary.com/pitz/image/upload/v1765268255/Container_17_n6i2xm.png"
                  alt="Safe & Reliable Cryptocurrency Exchange Platform"
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain"
                  unoptimized
                />
                
                {/* Badge - Since 2015 */}
                <div className="absolute top-4 right-4 bg-[#1D8751] rounded-full px-4 py-1.5 z-20">
                  <span className="text-white text-xs font-medium">Since 2015</span>
                </div>
                
                {/* Badge - 100K+ Users */}
                <div className="absolute bottom-4 left-4 bg-[#1D8751] rounded-full px-4 py-1.5 z-20">
                  <span className="text-white text-xs font-medium">100K+ Users</span>
                </div>
              </div>
            </div>

            {/* Right Section - Text and Feature Cards */}
            <div className="space-y-6">
              {/* ABOUT OMAYA Header */}
              <div className="bg-[#1D8751]/10 dark:bg-[#1D8751]/20 border border-[#1D8751] rounded-3xl px-4 py-2 inline-block">
                <div className="text-[#1D8751] text-sm font-medium uppercase tracking-wide">
                  ABOUT OMAYA
                </div>
              </div>
                  
              {/* Title */}
              <h2 className="text-3xl md:text-4xl 2xl:text-5xl font-bold text-gray-900 dark:text-white">
                <span className="text-[#1D8751]">Safe & Reliable</span>{" "}
                <span className="text-gray-900 dark:text-white">Cryptocurrency Exchange Platform</span>
              </h2>
              
              {/* Descriptive Text */}
              <p className="text-gray-700 dark:text-white/80 text-sm md:text-base leading-relaxed">
                Established in 2015, OMAYA Exchange is Somalia's leading cryptocurrency exchange, 
                licensed by the{" "}
                <span className="text-[#1D8751] font-semibold">Central Bank of Somalia</span>.
                With a team rooted in East Africa, we specialize in localized transactions, 
                supporting the region's unique demands to meet your financial needs. At OMAYA Exchange, 
                our focus extends beyond mere transactions. We are committed to empowering you by 
                offering expert insights and resources that support informed financial decision-making. 
                Leveraging deep knowledge of East African markets, we provide secure and responsive 
                solutions tailored to local requirements.
              </p>
              
              {/* Feature Boxes - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {/* Bank-Grade Security */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-gray-900 dark:text-white font-bold text-sm mb-1">Bank-Grade Security</div>
                  <div className="text-gray-700 dark:text-white/70 text-xs">Advanced encryption & multi-layer protection</div>
                </div>

                {/* Licensed & Regulated */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="w-10 h-10 bg-pink-400/20 rounded-lg flex items-center justify-center mb-3">
                    <Lock className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="text-gray-900 dark:text-white font-bold text-sm mb-1">Licensed & Regulated</div>
                  <div className="text-gray-700 dark:text-white/70 text-xs">Approved by Central Bank of Somalia</div>
                </div>

                {/* 100K+ Active Users */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-gray-900 dark:text-white font-bold text-sm mb-1">100K+ Active Users</div>
                  <div className="text-gray-700 dark:text-white/70 text-xs">Trusted by traders across East Africa</div>
                </div>

                {/* 99.9% Uptime */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-lg p-4 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="w-10 h-10 bg-orange-400/20 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-gray-900 dark:text-white font-bold text-sm mb-1">99.9% Uptime</div>
                  <div className="text-gray-700 dark:text-white/70 text-xs">Reliable trading 24/7/365</div>
                </div>
              </div>
              
              {/* Bottom Tags/Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="border border-[#1D8751] rounded-full px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-transparent">
                  <Lock className="w-4 h-4 text-[#1D8751]" />
                  <span className="text-gray-900 dark:text-white text-xs font-medium">Licensed Exchange</span>
                </div>
                <div className="border border-[#1D8751] rounded-full px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-transparent">
                  <Globe className="w-4 h-4 text-[#1D8751]" />
                  <span className="text-gray-900 dark:text-white text-xs font-medium">Global Reach</span>
                </div>
                <div className="border border-[#1D8751] rounded-full px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-transparent">
                  <Zap className="w-4 h-4 text-[#1D8751]" />
                  <span className="text-gray-900 dark:text-white text-xs font-medium">Fast Execution</span>
                </div>
                <div className="border border-[#1D8751] rounded-full px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-transparent">
                  <Shield className="w-4 h-4 text-[#1D8751]" />
                  <span className="text-gray-900 dark:text-white text-xs font-medium">Verified Platform</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Easy Onboarding Section */}
      <div className="w-full bg-white dark:bg-[#0A0A0A] pt-4 md:pt-6 pb-16 md:pb-24 relative overflow-hidden">
        {/* Dark gradient background with green dots */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Green glowing particles background */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#1D8751] rounded-full opacity-60 blur-sm animate-pulse"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-[#1D8751] rounded-full opacity-40 blur-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-[#1D8751] rounded-full opacity-50 blur-sm animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-[#1D8751] rounded-full opacity-45 blur-sm animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-[#1D8751] rounded-full opacity-35 blur-md animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Subtle gradient overlays */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, ${tokens.colors.brand.lightGreen}15 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, ${tokens.colors.brand.lightGreen}10 0%, transparent 50%)
              `,
            }}
          ></div>
        </div>

        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl px-4 relative z-10">
          {/* Green pill label */}
          <div className="flex justify-center mb-6">
            <span className="bg-[#1D8751]/10 border border-[#1D8751] text-[#1D8751] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium">
              EASY ONBOARDING
            </span>
          </div>

          {/* Main heading */}
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              <span className="text-gray-900 dark:text-white">Get Set Up And</span>{" "}
              <span className="text-[#1D8751]">Start Exchanging</span>
            </h2>
          </div>

          {/* Description */}
          <p className="text-center text-gray-700 dark:text-white/90 text-sm sm:text-base md:text-lg mb-12 max-w-2xl mx-auto">
            Begin your crypto journey in 4 simple steps. Join thousands of traders who trust OMAYA Exchange.
          </p>

          {/* Steps Cards */}
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
              {[
                {
                  number: 1,
                  icon: UserPlus,
                  iconBg: "bg-blue-500",
                  title: t("marketing.steps.create.title", "Create Account"),
                  description: t("marketing.steps.create.desc", "Create an account quickly and securely to start your digital trading journey."),
                  features: [
                    t("marketing.steps.create.feature1", "Instant setup"),
                    t("marketing.steps.create.feature2", "Email verification"),
                    t("marketing.steps.create.feature3", "Free account"),
                  ],
                },
                {
                  number: 2,
                  icon: Shield,
                  iconBg: "bg-purple-500",
                  title: t("marketing.steps.verify.title", "Verify Identity"),
                  description: t("marketing.steps.verify.desc", "Verify your identity to ensure a secure and compliant trading experience."),
                  features: [
                    t("marketing.steps.verify.feature1", "KYC compliance"),
                    t("marketing.steps.verify.feature2", "Enhanced security"),
                    t("marketing.steps.verify.feature3", "5-min process"),
                  ],
                },
                {
                  number: 3,
                  icon: DollarSign,
                  iconBg: "bg-[#1D8751]",
                  title: t("marketing.steps.transfer.title", "Transfer Funds"),
                  description: t("marketing.steps.transfer.desc", "Transfer funds effortlessly and access a world of digital assets."),
                  features: [
                    t("marketing.steps.transfer.feature1", "Multiple methods"),
                    t("marketing.steps.transfer.feature2", "Instant deposits"),
                    t("marketing.steps.transfer.feature3", "Low fees"),
                  ],
                },
                {
                  number: 4,
                  icon: ArrowLeftRight,
                  iconBg: "bg-orange-500",
                  title: t("marketing.steps.start.title", "Start Exchanging"),
                  description: t("marketing.steps.start.desc", "Start exchanging instantly and explore endless opportunities."),
                  features: [
                    t("marketing.steps.start.feature1", "500+ assets"),
                    t("marketing.steps.start.feature2", "Real-time trading"),
                    t("marketing.steps.start.feature3", "24/7 support"),
                  ],
                },
              ].map((step, index) => (
                <div key={step.number} className="relative">
                  {/* Step Card */}
                  <div className="relative bg-white dark:bg-[#1D1D23] rounded-2xl p-6 border-2 border-[#1D8751] shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Number Badge - Inside card */}
                    <div className="absolute top-4 right-4 w-8 h-8 bg-[#13B562]/20 dark:bg-[#13B562]/30 rounded-full flex items-center justify-center">
                      <span className="text-[#1D8751] dark:text-[#13B562] text-sm font-bold">{step.number}</span>
                    </div>

                    {/* Icon Container */}
                    <div className="relative mb-6">
                      {/* Green dots decoration */}
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#1D8751] rounded-full opacity-60"></div>
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#1D8751] rounded-full opacity-60"></div>
                      
                      {/* Icon background */}
                      <div className={`${step.iconBg} w-16 h-16 rounded-xl flex items-center justify-center shadow-lg relative`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-700 dark:text-white/80 text-sm mb-4 flex-grow">
                      {step.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2 mt-auto">
                      {step.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-[#1D8751] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-700 dark:text-white/90 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Small Arrow Circle between cards (hidden on last card) */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <div className="bg-[#1D8751] rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg font-bold">&gt;</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section with Phone */}
      <section className="w-full bg-white dark:bg-[#0A0A0A] py-16 md:py-24 px-4 md:px-[100px] relative overflow-hidden">
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - Phone with Green Gradient Background */}
            <div className="relative flex justify-center lg:justify-start">
              {/* Greenish Glowing Circular Pattern Background */}
              <div className="absolute inset-0 flex items-center justify-center lg:justify-start">
                <div className="relative w-[500px] h-[500px] lg:w-[600px] lg:h-[600px]">
                  {/* Large glowing green circles */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1D8751]/20 via-[#13B562]/15 to-[#0E5531]/10 dark:from-[#1D8751]/40 dark:via-[#13B562]/30 dark:to-[#0E5531]/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#13B562]/15 via-[#1D8751]/10 to-transparent dark:from-[#13B562]/30 dark:via-[#1D8751]/20 dark:to-transparent rounded-full blur-2xl" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
              
              {/* Phone Image */}
              <div className="relative z-10">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747220053/iphone_vn7ejc.png"
                  alt="OMAYA Exchange Mobile App"
                  width={350}
                  height={700}
                  className="w-[280px] md:w-[320px] lg:w-[350px] h-auto drop-shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Right Side - Why Choose Us Content */}
            <div className="space-y-8">
              {/* Main Heading */}
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                  <span className="text-gray-900 dark:text-white">Fast and </span>
                  <span className="text-[#1D8751]">Secure</span>
                  <span className="text-gray-900 dark:text-white"> Crypto </span>
                  <span className="text-[#1D8751]">Exchange</span>
                </h2>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Low Transaction Fee */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-white/10">
                  <div className="w-12 h-12 bg-[#1D8751] rounded-lg flex items-center justify-center mb-4">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Low Transaction Fee</h4>
                  <p className="text-gray-600 dark:text-white/70 text-sm">Industry-leading fees starting from 0.1%</p>
                </div>

                {/* Secure Payment Service */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-white/10">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Secure Payment Service</h4>
                  <p className="text-gray-600 dark:text-white/70 text-sm">Bank-grade security with 2FA authentication</p>
                </div>

                {/* Fast Transactions */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-white/10">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Fast Transactions</h4>
                  <p className="text-gray-600 dark:text-white/70 text-sm">Lightning-fast execution in milliseconds</p>
                </div>

                {/* We Work 24/7 */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] backdrop-blur-sm rounded-xl p-5 border border-gray-200 dark:border-white/10">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">We Work 24/7</h4>
                  <p className="text-gray-600 dark:text-white/70 text-sm">Round-the-clock support & trading</p>
                </div>
              </div>

              {/* App Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-3 bg-gray-900 dark:bg-black/50 hover:bg-gray-800 dark:hover:bg-black/70 border border-gray-300 dark:border-white/20 rounded-xl px-6 py-4 transition-colors min-w-[200px]"
                >
                  <Image
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746539125/Appstore_nqe65y.png"
                    alt="Download on the App Store"
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain"
                  />
                  <span className="text-white font-medium text-sm">Download on the App Store</span>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-3 bg-gray-900 dark:bg-black/50 hover:bg-gray-800 dark:hover:bg-black/70 border border-gray-300 dark:border-white/20 rounded-xl px-6 py-4 transition-colors min-w-[200px]"
                >
                  <Image
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746539313/googleplay_1_w8djf0.png"
                    alt="GET IT ON Google Play"
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain"
                  />
                  <span className="text-white font-medium text-sm">GET IT ON Google Play</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    {/* Benefits Section*/}
    <div className="w-full bg-gradient-to-r from-[#0A3D1F] via-[#095E32] to-[#022E18] py-16 relative overflow-hidden">
        {/* Faint circular patterns/rings in background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large circular ring on left */}
          <div className="absolute left-[-100px] top-1/2 transform -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full"></div>
          <div className="absolute left-[-80px] top-1/2 transform -translate-y-1/2 w-[360px] h-[360px] border border-white/5 rounded-full"></div>
          
          {/* Large circular ring on right */}
          <div className="absolute right-[-100px] top-1/2 transform -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full"></div>
          <div className="absolute right-[-80px] top-1/2 transform -translate-y-1/2 w-[360px] h-[360px] border border-white/5 rounded-full"></div>
          
          {/* Additional subtle rings */}
          <div className="absolute left-[10%] top-[-50px] w-[300px] h-[300px] border border-white/3 rounded-full"></div>
          <div className="absolute right-[10%] bottom-[-50px] w-[300px] h-[300px] border border-white/3 rounded-full"></div>
        </div>

        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Absolute Safety */}
            <div className="flex">
              <div className="mr-4 relative">
                {/* Circular ring around icon */}
                <div className="absolute -inset-2 border border-white/10 rounded-full"></div>
                <div className="absolute -inset-4 border border-white/5 rounded-full"></div>
                
                {/* Hexagonal icon container */}
                <div
                  className="relative w-16 h-16 bg-[#1D8751] flex items-center justify-center shadow-lg p-2"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  {/* Shield icon with checkmark */}
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2 2xl:text-xl">
                  {t("marketing.benefits.safety.title", "Absolute Safety")}
                </h3>
                <p className="text-white/90 text-sm 2xl:text-base">
                  {t(
                    "marketing.benefits.safety.desc",
                    "Exchange confidently with OMAYA, where safety is our top priority."
                )}
              </p>
              </div>
            </div>

            {/* Fast Deposits & Withdrawals */}
            <div className="flex">
              <div className="mr-4 relative">
                {/* Circular ring around icon */}
                <div className="absolute -inset-2 border border-white/10 rounded-full"></div>
                <div className="absolute -inset-4 border border-white/5 rounded-full"></div>
                
                {/* Hexagonal icon container */}
                <div
                  className="relative w-16 h-16 bg-[#1D8751] flex items-center justify-center shadow-lg p-2"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  {/* Dollar sign icon with circle */}
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" opacity="0.3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg 2xl:text-xl mb-2">
                  {t(
                    "marketing.benefits.fast.title",
                    "Fast Deposits & Withdrawals"
                  )}
                </h3>
                <p className="text-white/90 text-sm 2xl:text-base">
                  {t(
                    "marketing.benefits.fast.desc",
                    "Enjoy swift and seamless deposits and withdrawals."
                  )}
                </p>
              </div>
            </div>

            {/* Invite your friend and earn */}
            <div className="flex">
              <div className="mr-4 relative">
                {/* Circular ring around icon */}
                <div className="absolute -inset-2 border border-white/10 rounded-full"></div>
                <div className="absolute -inset-4 border border-white/5 rounded-full"></div>
                
                {/* Hexagonal icon container */}
                <div
                  className="relative w-16 h-16 bg-[#1D8751] flex items-center justify-center shadow-lg p-2"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  {/* Users/referral icon */}
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg 2xl:text-xl mb-2">
                  {t(
                    "marketing.benefits.invite.title",
                    "Invite your friend and earn"
                  )}
                </h3>
                <p className="text-white/90 text-sm 2xl:text-base">
                  {t(
                    "marketing.benefits.invite.desc",
                    "Refer and invite your friends and earn commission on each transaction they make with us!"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
            </div>

      {/* Refer and Invite Section */}
      <div className="w-full bg-white dark:bg-transparent py-4 md:py-8 my-4 md:my-6">
        <div className="w-full md:container md:mx-auto md:max-w-7xl md:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {/* Card Image - Full width on small screens, centered on larger screens */}
          <div className="w-full md:mx-auto md:max-w-6xl md:rounded-3xl overflow-hidden">
                <Image
              src="https://res.cloudinary.com/pitz/image/upload/v1765346728/Container_37_fpyfvs.png"
              alt="Refer and Invite your friends and earn commission"
              width={1440}
              height={800}
              className="w-full h-auto object-contain"
              priority
              quality={100}
            />
          </div>
        </div>
      </div>

      {/* Blogs Section */}
      <div className="w-full bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white pt-8 md:pt-12 pb-16 px-6 md:px-12 lg:px-16 xl:px-20">
        <div className="max-w-6xl 2xl:max-w-7xl mx-auto">
          {/* Header section */}
          <div className="text-center mb-12">
                {/* Blogs Pill */}
            <div className="flex justify-center mb-6">
              <span className="bg-[#1D8751]/10 border border-[#1D8751] text-[#1D8751] px-4 py-2 rounded-2xl text-sm font-medium">
                Latest Updates
              </span>
            </div>


            {/* Main Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-bold mb-4">
              Enjoy Our <span className="text-[#1D8751]">Blog</span> & News on the <span className="text-[#1D8751]">Latest Updates</span>
</h2>

            {/* Subheading */}
            <p className="text-gray-700 dark:text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Stay informed with expert insights, market analysis, and the latest developments in the cryptocurrency world.
            </p>
          </div>

          {/* Articles grid - 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {loading ? (
              // Loading state
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-[#1D1D23] rounded-xl overflow-hidden flex flex-col h-full animate-pulse border border-[#2A2A2A]"
                >
                  <div className="relative w-full h-48 bg-gray-700"></div>
                  <div className="p-5 md:p-6 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                    <div className="h-4 bg-gray-700 rounded"></div>
                    <div className="h-6 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="col-span-full text-center py-12">
                <p className="text-red-400 mb-4">
                  Error loading blog posts: {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#1D8751] text-white px-4 py-2 rounded-lg hover:bg-[#167a47] transition-colors"
                >
                  {t("marketing.contact.tryAgain", "Try Again")}
                </button>
              </div>
            ) : filteredArticles.length === 0 ? (
              // Empty state
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg">
                  No posts available.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Please add some blog posts to your Sanity CMS.
                </p>
              </div>
            ) : (
              // Articles grid
              filteredArticles.slice(0, 6).map((article, index) => {
                // Category colors mapping
                const categoryColors: { [key: string]: string } = {
                  'Market Analysis': 'bg-purple-500',
                  'Security': 'bg-orange-500',
                  'DeFi': 'bg-[#1D8751]',
                  'Trading': 'bg-yellow-500',
                  'Technology': 'bg-pink-500',
                  'Regulation': 'bg-blue-500',
                  'Crypto': 'bg-blue-500',
                  'Investment': 'bg-purple-500',
                  'NFTs': 'bg-pink-500',
                  'Finance': 'bg-green-500',
                };

                const categoryName = article.tags[0]?.name || article.category || 'News';
                const categoryColor = categoryColors[categoryName] || 'bg-[#1D8751]';
                
                // Calculate read time (estimate 200 words per minute)
                const wordCount = article.excerpt.split(' ').length;
                const readTime = Math.ceil(wordCount / 200) || 5;

                return (
                <div
                  key={article.id}
                    className="bg-gray-50 dark:bg-[#1D1D23] rounded-xl overflow-hidden flex flex-col h-full border border-gray-200 dark:border-[#2A2A2A] hover:border-[#1D8751]/40 transition-colors"
                >
                    {/* Article Image */}
                    <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                      {/* Category Label - positioned absolutely over image */}
                      <div className="absolute top-3 left-3">
                        <span className={`${categoryColor} text-white text-xs font-medium px-3 py-1 rounded-full inline-block shadow-lg`}>
                          {categoryName}
                          </span>
                      </div>
                    </div>
                    
                    <div className="p-5 md:p-6 flex flex-col h-full">

                      {/* Date and Read Time */}
                      <div className="flex items-center gap-2 text-gray-600 dark:text-white/60 text-xs mb-3">
                        <Calendar className="w-3 h-3" />
                        <span>{article.createdAt}</span>
                        <span className="mx-1">|</span>
                        <Clock className="w-3 h-3" />
                        <span>{readTime} min read</span>
                      </div>

                      {/* Article Title */}
                      <h3 className="font-bold text-base md:text-lg mb-3 text-gray-900 dark:text-white line-clamp-2">
                      {article.title}
                    </h3>

                      {/* Description */}
                      <p className="text-gray-700 dark:text-white/70 text-sm mb-5 flex-grow line-clamp-3">
                      {article.excerpt}
                    </p>

                      {/* Read More Link */}
                    <Link
                      href={`/blog/${article.id}`}
                        className="inline-flex items-center gap-2 text-[#1D8751] text-sm font-medium hover:text-[#167a47] transition-colors group mt-auto"
                    >
                        Read More
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
                );
              })
            )}
          </div>

          {/* View All Articles Button */}
          <div className="mt-12 text-center">
            <Link
              href={`/blog/`}
              className="inline-block bg-[#1D8751] text-white rounded-full px-8 py-4 font-medium text-base md:text-lg transition-colors hover:bg-[#167a47]"
            >
              View All Articles
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Us Section */}
      <section
        id="contact"
        className="w-full bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white py-16 px-4 md:px-[100px]"
      >
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            {/* Get In Touch Pill */}
            <div className="flex justify-center mb-6">
              <span className="bg-[#1D8751]/10 border border-[#1D8751] text-[#1D8751] px-4 py-2 rounded-2xl text-sm font-medium">
                Get In Touch
              </span>
            </div>

            {/* Main Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-bold mb-4">
              Need Answers to Your Questions?{" "}
              <span className="text-[#1D8751]">Contact Us</span>
              </h2>

            {/* Subtitle */}
            <p className="text-gray-700 dark:text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Our dedicated support team is here to help you with any questions or concerns
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-xl md:text-2xl mb-2">
                  Contact Information
                </h3>
                <p className="text-gray-700 dark:text-white/70 text-sm md:text-base">
                  Fill out the form and our team will get back to you within 24 hours
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-4">
                {/* Our Office */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-xl p-5 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1">Our Office</h4>
                      <p className="text-gray-700 dark:text-white/80 text-sm">
                        KM4, Taleh, Hodan District, Mogadishu, Somalia
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-xl p-5 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#1D8751] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1">Phone Number</h4>
                      <p className="text-gray-700 dark:text-white/80 text-sm">+252 771 000777</p>
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-xl p-5 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1">Email Address</h4>
                      <p className="text-gray-700 dark:text-white/80 text-sm">info@omaya.io</p>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-xl p-5 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1">Working Hours</h4>
                      <p className="text-gray-700 dark:text-white/80 text-sm">Mon - Fri: 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-xl p-6 md:p-8 border border-gray-200 dark:border-[#2A2A2A]">
              {/* Success Message */}
              {showContactSuccess && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-xl">
                  <p className="text-green-200 text-sm">
                    {t(
                      "marketing.contact.success",
                      "Thank you! Your message has been submitted successfully. We'll get back to you soon."
                    )}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {showContactError && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl">
                  <p className="text-red-200 text-sm">
                    {contactErrorMessage}
                  </p>
                </div>
              )}

              <ContactForm
                onSuccess={handleContactSuccess}
                onError={handleContactError}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="w-full bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white py-16 px-4 md:px-8"
      >
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            {/* FAQ Pill */}
            <div className="flex justify-center mb-6 -mt-4">
              <span className="bg-[#1D8751]/10 border border-[#1D8751] text-[#1D8751] px-4 py-1.5 rounded-lg text-sm font-medium">
                FAQ
              </span>
            </div>

            {/* Main Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-bold mb-4">
              Frequently Asked <span className="text-[#1D8751]">Questions</span>
                </h2>

            {/* Subtitle */}
            <p className="text-gray-700 dark:text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Find answers to common questions about OMAYA Exchange, trading, security, and more
                </p>
              </div>

          {/* FAQ Accordion */}
          <div className="space-y-4 mb-12">
                {faqLoading ? (
                  // Loading state
              Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="relative animate-pulse">
                  <div className="bg-gray-50 dark:bg-[#1D1D23] border border-gray-200 dark:border-[#2A2A2A] rounded-xl overflow-hidden">
                    <div className="w-full flex justify-between items-center px-5 py-4">
                          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-700 rounded w-4"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : faqError ? (
                  // Error state
                  <div className="text-center py-8">
                    <p className="text-red-400 mb-4">
                      Error loading FAQs: {faqError}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-[#1D8751] text-white px-4 py-2 rounded-lg hover:bg-[#167a47] transition-colors"
                    >
                      {t("marketing.contact.tryAgain", "Try Again")}
                    </button>
                  </div>
                ) : faqItems.length === 0 ? (
                  // Empty state
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-lg">
                      {t("marketing.faq.empty", "No FAQs available.")}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {t(
                        "marketing.faq.addHint",
                        "Please add some FAQ items to your Sanity CMS."
                      )}
                    </p>
                  </div>
                ) : (
                  <>
                {/* FAQ items */}
                {faqItems.slice(0, showAllFAQs ? faqItems.length : 8).map((item, index) => {
                  const isOpen = openFAQ === (item.id || index);
                  
                  // Category mapping (you can customize this based on your FAQ data)
                  const categories = [
                    'GETTING STARTED',
                    'TRADING',
                    'SECURITY',
                    'FEES',
                    'WITHDRAWALS',
                    'AVAILABILITY',
                    'P2P TRADING',
                    'SUPPORT'
                  ];
                  const category = categories[index] || 'GENERAL';

                  return (
                    <div key={item.id || item._id || index} className="relative">
                      <div
                        className={`bg-gray-50 dark:bg-[#1D1D23] border rounded-xl overflow-hidden ${
                          isOpen
                              ? "border-[#1D8751]"
                            : "border-gray-200 dark:border-[#2A2A2A]"
                          }`}
                        >
                          {/* Accordion Header */}
                          <button
                          onClick={() => toggleFAQ(item.id || index)}
                            className="w-full flex justify-between items-start px-5 py-4 text-left hover:bg-gray-100 dark:hover:bg-[#23232B] transition-colors"
                        >
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[#1D8751] text-xs font-semibold uppercase">
                              {category}
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium text-base">
                              {item.question}
                            </span>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-4 transition-colors ${
                            isOpen 
                              ? "bg-[#1D8751]" 
                              : "bg-gray-200 dark:bg-[#2A2A2A]"
                          }`}>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-white" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </div>
                          </button>

                          {/* Accordion Content */}
                        {isOpen && (
                          <div className="px-5 py-4 bg-gray-50 dark:bg-[#1D1D23] border-t border-gray-200 dark:border-[#2A2A2A]">
                            <p className="text-gray-700 dark:text-white/80 text-sm md:text-base leading-relaxed">
                                  {item.answer}
                                </p>
                              </div>
                          )}
                        </div>
                      </div>
                  );
                })}
                    
                {/* Load All Button - only show if there are more than 8 FAQs */}
                {faqItems.length > 8 && !showAllFAQs && (
                      <div className="text-center pt-4">
                        <button
                          onClick={() => setShowAllFAQs(true)}
                          className="bg-[#1D8751] text-white px-6 py-3 rounded-lg hover:bg-[#167a47] transition-colors font-medium"
                        >
                      {t("marketing.faq.loadAll", "Load All FAQs")} ({faqItems.length - 8} more)
                        </button>
                      </div>
                    )}
                    
                    {/* Show Less Button - only show when all FAQs are displayed */}
                {faqItems.length > 8 && showAllFAQs && (
                      <div className="text-center pt-4">
                        <button
                          onClick={() => setShowAllFAQs(false)}
                          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                          {t("marketing.faq.showLess", "Show Less")}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

          {/* Bottom Support Section */}
          <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-2xl p-8 md:p-12 text-center border border-gray-200 dark:border-[#2A2A2A]">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#1D8751] rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
            <h3 className="text-gray-900 dark:text-white text-xl md:text-2xl font-bold mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-700 dark:text-white/70 text-sm md:text-base mb-6">
              Our support team is available 24/7 to assist you
            </p>
            <a
              href="#contact"
              className="inline-block bg-[#1D8751] text-white px-8 py-3 rounded-full font-medium hover:bg-[#167a47] transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
