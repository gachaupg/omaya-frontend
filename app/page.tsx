"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useMarketingI18n } from "@/lib/useMarketingI18n";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/rootReducer";
import { tokens } from "@/styles/tokens";
import { Play, MessageCircle, Plus, BarChart, Globe, Lock, DollarSign, Users, TrendingUp, Shield, Zap, Gift, UserPlus, ArrowRight, Building2, Calendar, Clock, MapPin, Phone, Mail, Send, ChevronDown, ChevronUp, ArrowLeftRight, HelpCircle, Wallet, BarChart3, Award, Rocket } from "lucide-react";
import ExchangeForm from "@/components/ExchangeForm";
import { useBlog } from "@/features/blogs/hooks/blog";
import { BlogPost } from "@/features/blogs/types";
import { useFAQ } from "@/features/faq/hooks/useFAQ";
import { ContactForm } from "@/features/contact/components";
import { useHighlightStatistics } from "@/features/contact/hooks/useHighlightStatistics";
import { useSimpleMarkets } from "@/features/markets/hooks/useSimpleMarkets";
import KYCVerificationModal from "@/features/auth/components/KYCVerificationModal";

import { HiOutlineDeviceMobile } from "react-icons/hi";
import { FaRegStar } from "react-icons/fa";
import { MdCurrencyBitcoin } from "react-icons/md";
import { ShieldCheck, CircleCheckBig, Sparkles, Earth } from "lucide-react";

import { GoDotFill } from "react-icons/go";
import FloatingParticles from "@/components/ui/floating-particles";

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
  const router = useRouter();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
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

  const heroStats = [
    {
      label: "Trading Volume",
      value: "100M+",
      icon: BarChart3,
      gradient: "from-[#2B7FFF] to-[#00B8DB]",
    },
    {
      label: "Countries",
      value: "50+",
      icon: Globe,
      gradient: "from-[#AD46FF] to-[#F6339A]",
    },
    {
      label: "Uptime",
      value: "99.9%",
      icon: Lock,
      gradient: "from-[#1D8751] to-[#309A64]",
    },
  ];

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
        className="relative min-h-screen pt-18 pb-16 mx-auto overflow-visible bg-gradient-to-br from-gray-50 to-white dark:bg-[var(--bg-color)]"
      >
        {/* Background styling - different for light and dark modes */}
        <div className="absolute inset-0 overflow-hidden z-0">
          {/* Light mode: Subtle gray/white gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:hidden"></div>

          {/* Dark mode: Very dark base (deep charcoal/near-black) */}
          <div className="absolute inset-0 bg-[#0a0a0f] hidden dark:block"></div>

          {/* Pure black overlay at top for navbar area - NO gradients visible behind navbar */}
          <div className="absolute top-0 left-0 right-0 h-[120px] bg-[#000000] hidden dark:block"></div>
          <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-[#000000] via-[#000000]/95 to-transparent hidden dark:block"></div>

          {/* Dark overlay covering upper regions to suppress gradients */}
          <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#000000]/80 via-[#000000]/40 to-transparent hidden dark:block"></div>

          {/* Very subtle purple glow - top left (faint, diffused) - positioned lower to not show behind navbar */}
          <div className="absolute top-[150px] left-0 w-[500px] h-[500px] bg-purple-600/3 dark:bg-purple-600/5 rounded-full blur-[150px]"></div>
          <div className="absolute top-[200px] left-[50px] w-[400px] h-[400px] bg-purple-500/2 dark:bg-purple-500/4 rounded-full blur-[120px]"></div>

          {/* Faint blue glow - top right to center (faint, diffused) - positioned lower */}
          <div className="absolute top-[150px] right-0 w-[600px] h-[600px] bg-blue-600/3 dark:bg-blue-600/5 rounded-full blur-[160px]"></div>
          <div className="absolute top-[250px] right-[100px] w-[450px] h-[450px] bg-blue-500/2 dark:bg-blue-500/4 rounded-full blur-[130px]"></div>

          {/* More noticeable green glow - mid-left and bottom-left (still subtle but more visible) */}
          <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#0D4D2E]/8 dark:bg-[#0D4D2E]/12 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[100px] left-[100px] w-[600px] h-[600px] bg-[#1D8751]/6 dark:bg-[#1D8751]/10 rounded-full blur-[120px]"></div>
          <div className="absolute top-[400px] left-[150px] w-[500px] h-[500px] bg-[#13B562]/4 dark:bg-[#13B562]/8 rounded-full blur-[110px]"></div>

          {/* Very faint, sparse glowing green particles - only in lower areas, not near navbar */}
          <div className="absolute top-[300px] left-1/4 w-1.5 h-1.5 bg-[#1D8751] rounded-full opacity-8 dark:opacity-15 blur-sm animate-pulse"></div>
          <div className="absolute top-[500px] left-1/3 w-2 h-2 bg-[#13B562] rounded-full opacity-6 dark:opacity-12 blur-sm animate-pulse" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute bottom-32 left-1/5 w-1.5 h-1.5 bg-[#1D8751] rounded-full opacity-8 dark:opacity-15 blur-sm animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-[600px] right-1/3 w-2 h-2 bg-[#13B562] rounded-full opacity-5 dark:opacity-10 blur-sm animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-[#1D8751] rounded-full opacity-7 dark:opacity-12 blur-sm animate-pulse" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute top-[700px] left-1/2 w-2 h-2 bg-[#13B562] rounded-full opacity-6 dark:opacity-11 blur-sm animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          <FloatingParticles count={4} size={{ min: 5, max: 11 }} />

        </div>

        {/* Simplified heptagonal patterns - matching Figma minimalism */}
        <div className="absolute inset-0 overflow-hidden z-0">
          {/* Bottom left heptagon */}
          <div
            className="absolute bottom-[80px] left-[150px] w-[100px] h-[100px] md:bottom-[120px] md:left-[200px] md:w-[140px] md:h-[140px] opacity-10 dark:opacity-15 bg-[#1D8751] hidden md:block"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>

          {/* Top left heptagon */}
          <div
            className="absolute top-[20px] left-[30px] w-[60px] h-[60px] md:w-[80px] md:h-[80px] opacity-10 dark:opacity-15 bg-[#1D8751] hidden md:block"
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
                  East Africa #1 Crypto Exchange.
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
              <p className="leading-relaxed max-w-full sm:max-w-md md:max-w-xl mx-auto lg:mx-0 px-4 sm:px-0 text-xs sm:text-base lg:text-xl relative">
                {/* Soft, diffused purple glow - only on left side, behind text - more visible */}

                <span className="absolute -left-4 sm:-left-6 md:-left-8 top-1/2 -translate-y-1/2 w-60 h-52 -z-10 bg-linear-to-br  from-[#9810FA] to-[#E60076] rounded-full blur-3xl opacity-20"></span>

                {/* <span className="absolute -left-8 sm:-left-12 md:-left-16 top-1/2 -translate-y-1/2 w-32 sm:w-40 md:w-48 h-full -z-10 bg-gradient-to-r from-purple-500/20 via-purple-400/12 to-transparent dark:from-purple-500/30 dark:via-purple-400/18 dark:to-transparent rounded-full blur-3xl"></span>
                <span className="absolute -left-4 sm:-left-6 md:-left-8 top-1/2 -translate-y-1/2 w-24 sm:w-32 md:w-40 h-3/4 -z-10 bg-gradient-to-br from-purple-600/15 via-purple-500/10 to-transparent dark:from-purple-600/25 dark:via-purple-500/15 dark:to-transparent rounded-full blur-2xl"></span>
                <span className="absolute -left-2 sm:-left-3 md:-left-4 top-1/2 -translate-y-1/2 w-16 sm:w-20 md:w-24 h-1/2 -z-10 bg-gradient-to-r from-purple-400/12 to-transparent dark:from-purple-400/20 dark:to-transparent rounded-full blur-xl"></span> */}
                <span className="relative">
                  <span className="text-gray-900 dark:text-[#788099]">Experience lightning-fast trades, ultra-low fees and bank grade security</span>
                  <br />
                  <span className="text-[#1D8751] dark:text-[#13B562]">Join 500,000+ traders worldwide.</span>
                </span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    router.push(isAuthenticated ? "/dashboard/express-exchange" : "/auth/login")
                  }
                  className="cursor-pointer rounded-xl px-5 sm:px-6 py-2.5 sm:py-2.5 text-white bg-linear-to-br from-[#1D8751] to-[#309A64] text-sm sm:text-base font-medium hover:bg-[#167a47] transition-colors min-h-[44px] flex items-center justify-center gap-2 shadow-xl"
                >
                  Start Trading Now
                  <span className="text-lg">→</span>
                </button>
                <button className="rounded-xl px-5 sm:px-6 py-2.5 sm:py-2.5 text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1D1D23] border-2 border-gray-300 dark:border-[#35353E] text-sm sm:text-base font-medium hover:bg-gray-200 dark:hover:bg-[#23232B] transition-colors min-h-[44px] flex items-center justify-center gap-2">
                  Watch Demo
                  <Play size={16} className="text-[#1D8751]" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center md:justify-start pt-4 md:pt-6 w-full">
                {heroStats.map((stat, index) => (
                  <div key={index} className="bg-white/5 dark:bg-white/5 backdrop-blur-sm rounded-2xl px-2 py-3 sm:px-5 sm:py-4 flex flex-col items-center sm:items-start gap-3 shadow-lg border border-white/10 flex-1 min-w-[120px] max-w-[180px]">
                    <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold mb-1">
                        {stat.value}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust tags under hero stats */}
              {/* <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start mt-3">
                <div className="border border-[#1D8751] rounded-full px-3 sm:px-4 py-1.5 flex items-center gap-2 bg-gray-50 dark:bg-transparent">
                  <Lock className="w-4 h-4 text-[#1D8751]" />
                  <span className="text-gray-900 dark:text-white text-[11px] sm:text-xs font-medium">
                    Licensed Exchange
                  </span>
                </div>
                <div className="border border-[#1D8751] rounded-full px-3 sm:px-4 py-1.5 flex items-center gap-2 bg-gray-50 dark:bg-transparent">
                  <Globe className="w-4 h-4 text-[#1D8751]" />
                  <span className="text-gray-900 dark:text-white text-[11px] sm:text-xs font-medium">
                    Global Reach
                  </span>
                </div>
                <div className="border border-[#1D8751] rounded-full px-3 sm:px-4 py-1.5 flex items-center gap-2 bg-gray-50 dark:bg-transparent">
                  <Zap className="w-4 h-4 text-[#1D8751]" />
                  <span className="text-gray-900 dark:text-white text-[11px] sm:text-xs font-medium">
                    Fast Execution
                  </span>
                </div>
              </div> */}
            </div>
            <div className="flex justify-center md:justify-end lg:justify-end w-full mt-7">
              <div className="w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
                <ExchangeForm isHomePage={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-4 sm:pt-6 md:pt-8 pb-12 sm:pb-16 md:pb-20 px-4 md:px-[100px] bg-white dark:bg-(--card-color) relative z-10">
        <div className="absolute -top-10 left-90 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-[#1D8751]/10 blur-3xl rounded-full" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-1">
          <div className="absolute w-[280px] sm:w-[300px] h-[600px] right-90 bottom-25 sm:h-24 blur-3xl bg-[#9810FA] rounded-full opacity-15" />
        </div>
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl">
          {/* Green pill banner */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <span className=" flex justify-center items-center gap-1 bg-[#1D8751]/10 border-2 border-secondary/20 text-secondary/60 px-4 py-1.5 sm:px-5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold">
              <GoDotFill className="text-secondary text-lg" />
              Trusted by Thousands
            </span>
          </div>

          {/* Title + Subtitle (small green gradient only around "Celebrating Success:") */}
          <div className="mx-auto mb-8 sm:mb-10 md:mb-12 max-w-5xl px-2">
            {/* Section Title */}
            <div className="relative flex justify-center mb-3 sm:mb-4">
              <h2 className="text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold">
                <span className="text-gray-900 dark:text-white">
                  <span className="relative inline-flex items-center">
                    <span className="relative">
                      {t(
                        "marketing.achievements.title.leading",
                        "Celebrating Success:"
                      )}
                    </span>
                  </span>{" "}
                  <span className="text-secondary" >
                    {t(
                      "marketing.achievements.title.highlight",
                      "Key Achievements"
                    )}
                  </span>
                </span>
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-center text-[#99A1AF] text-sm sm:text-base md:text-lg px-4">
              Join the fastest-growing crypto exchange platform in Somalia.
            </p>
          </div>

          {/* First Row - Achievement Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 md:mb-10 max-w-7xl mx-auto">
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
                  className="bg-gray-50 dark:bg-white/2 rounded-lg sm:rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col relative overflow-hidden border border-gray-200 dark:border-white/10"
                >
                  {/* Subtle white gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-b from-white/5 via-white/2 to-transparent pointer-events-none rounded-lg sm:rounded-3xl"></div>

                  {/* Greenish blur glow at top-right */}
                  <div className="absolute top-2 right-7 w-25 h-25 bg-[#1D8751] opacity-45 blur-3xl rounded-full pointer-events-none"></div>

                  {/* Content wrapper */}
                  <div className="relative z-10 flex flex-col">

                    {/* Icon Container - Vibrant green rounded square */}
                    <div className="relative mb-3 sm:mb-4 self-start">
                      <div
                        className="bg-[#1D8751] rounded-xl p-2 sm:p-2.5 md:p-3 flex items-center justify-center shadow-md"
                        style={{
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        {icons[index]}
                      </div>
                    </div>

                    {/* Number */}
                    <div className="text-[#1D8751] text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3">
                      {achievement.value}
                    </div>

                    {/* Title */}
                    <div className="text-gray-900 dark:text-muted text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
                      {titles[index]}
                    </div>

                    {/* Description */}
                    <div className="text-gray-700 dark:text-[#99A1AF] text-xs sm:text-sm">
                      {descriptions[index]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Feature Cards Row */}
          <div className="relative mt-6 sm:mt-8 md:mt-10 max-w-7xl mx-auto">
            {/* Dark background container with green gradient */}
            <div className="bg-gray-100 dark:bg-[#1D8751]/7 rounded-2xl p-4 md:p-6 border border-border dark:border-[#1D8751]/10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                {/* Lowest Trading Fee */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base font-medium text-center">Lowest Trading Fee</span>
                </div>

                {/* Bank-Grade Security */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-[#1D8751] to-[#13B562] flex items-center justify-center mb-3 shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base font-medium text-center">Bank-Grade Security</span>
                </div>

                {/* 24/7 Support */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-pink-400 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base font-medium text-center">24/7 Support</span>
                </div>

                {/* Real-Time Charts */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-linear-to-br from-[#1D8751] to-[#13B562] flex items-center justify-center mb-3 shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm md:text-base font-medium text-center">Real-Time Charts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* Supported Assets Section*/}
      <div
        id="supported-assets"
        className="w-full bg-white dark:bg-[var(--bg-color)] pt-4 md:pt-6 pb-16 px-4 md:px-[100px] relative overflow-hidden"
      >
        {/* Subtle green glowing dots background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#13B562] rounded-full opacity-60 blur-sm animate-pulse"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-[#13B562] rounded-full opacity-40 blur-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-[#1D8751] rounded-full opacity-50 blur-sm animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl relative z-10">
          {/* Section Title */}
          <div className="flex justify-center mb-2">
            <span className="border border-[#1D8751] bg-[#1D8751]/10 text-[#1D8751] text-xs sm:text-sm md:text-base font-medium px-3 py-1 rounded-[24px] inline-flex items-center justify-center">
              SUPPORTED ASSETS
            </span>
          </div>
          <div className="relative flex justify-center mb-3">
            {/* Greenish glow behind title */}
            <div className="pointer-events-none absolute inset-0 flex justify-center items-center -z-10">
              {/* Wide soft glow */}
              <div className="w-[440px] sm:w-[700px] h-[120px] sm:h-[150px] bg-gradient-to-r from-transparent via-[#1D8751]/32 to-transparent blur-3xl rounded-full" />
              {/* Brighter core glow */}
              <div className="absolute w-[280px] sm:w-[420px] h-[78px] sm:h-[96px] bg-gradient-to-r from-transparent via-[#13B562]/38 to-transparent blur-2xl rounded-full" />
              {/* Subtle green tint wash */}
              <div className="absolute w-[560px] sm:w-[860px] h-[180px] sm:h-[230px] bg-[#1D8751]/10 blur-[64px] rounded-full" />
            </div>
            <h2 className="text-center text-2xl md:text-3xl 2xl:text-4xl font-bold">
              <span className="text-gray-900 dark:text-white">Trade Your Favorite</span>{" "}
              <span className="text-[#1D8751]">Cryptocurrencies</span>
            </h2>
          </div>

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
                              className={`absolute top-1/2 left-0 h-16 sm:h-20 md:h-24 ${iconBgColor} transform -translate-y-1/2 opacity-40`}
                              style={{
                                right: '-1rem',
                                width: 'calc(100% + 2rem)'
                              }}
                            ></div>
                            {/* Centered asset image - Larger to match Figma */}
                            <div className="relative z-10 flex items-center justify-center">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white dark:bg-[#1D1D23] rounded-full flex items-center justify-center border border-gray-200 dark:border-transparent shadow-lg">
                                <Image
                                  src={asset.image}
                                  alt={asset.name}
                                  width={80}
                                  height={80}
                                  className="object-contain w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
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
                            <div className={`text-xs sm:text-sm font-medium ${change >= 0 ? 'text-secondary' : 'text-red-500'}`}>
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
            {/* 1000+ Total Assets */}
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
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-gray-900 dark:text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">1000+</div>
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
                    <path d="M3 21L12 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-gray-900 dark:text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">1000+</div>
                <div className="text-gray-700 dark:text-white text-xs sm:text-sm md:text-base text-center">Trading Pairs</div>
              </div>
            </div>

            {/* $2M+ Daily Volume */}
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
                <div className="text-gray-900 dark:text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">$2M+</div>
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
      <div className="w-full bg-white dark:bg-[var(--bg-color)] pt-8 pb-16">
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl px-4">
          {/* Outer card with border that fades downward (no rounded top edge) */}
          <div className="relative rounded-b-3xl">
            {/* Content wrapper without visible border */}
            <div className="rounded-b-3xl">
              {/* Inner content card (flat top, rounded bottom) */}
              <div className="relative bg-gray-50 dark:bg-(--card-color) rounded-b-3xl p-5 sm:p-6 md:p-8 shadow-sm overflow-hidden">
                {/* green glow bg */}
                <div className="absolute bg-[#1D8751] blur-3xl w-90 h-70 bottom-30 right-40 opacity-20 z-1" />

                {/* Overlay to fade card background to page background at bottom */}
                <div
                  className="absolute inset-x-0 bottom-0 h-3/4 rounded-b-3xl pointer-events-none dark:hidden"
                  style={{
                    background: 'linear-gradient(to top, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0.95) 25%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.5) 75%, transparent 100%)',
                  }}
                ></div>
                <div
                  className="absolute inset-x-0 bottom-0 h-3/4 rounded-b-3xl pointer-events-none hidden dark:block"
                  style={{
                    background: 'linear-gradient(to top, rgb(10, 10, 15) 0%, rgba(10, 10, 15, 0.95) 25%, rgba(10, 10, 15, 0.8) 50%, rgba(10, 10, 15, 0.5) 75%, transparent 100%)',
                  }}
                ></div>
                {/* Overlay to fade border at bottom - keep behind content */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-3xl pointer-events-none z-0 dark:hidden"
                  style={{
                    background: 'linear-gradient(to top, rgb(255, 255, 255) 0%, transparent 100%)',
                  }}
                ></div>
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-3xl pointer-events-none hidden dark:block z-0"
                  style={{
                    background: 'linear-gradient(to top, rgb(10, 10, 15) 0%, transparent 100%)',
                  }}
                ></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
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
                    </div>

                    {/* Badge - Since 2019 (positioned slightly below top edge) */}
                    <div className="absolute -top-6 right-4 md:-top-6 md:right-8 bg-[#1D8751] rounded-full px-3 md:px-4 py-1 md:py-1.5 z-20 shadow-md">
                      <span className="text-white text-xs font-medium">Since 2019</span>
                    </div>

                    {/* Badge - 10K+ Users (inside image card, raised above bottom edge) */}
                    <div className="absolute bottom-2 left-4 md:bottom-3 md:left-8 bg-[#1D8751] rounded-full px-3 md:px-4 py-1 md:py-1.5 z-20 shadow-md">
                      <span className="text-white text-xs font-medium">10K+ Users</span>
                    </div>
                  </div>

                  {/* Right Section - Text and Feature Cards */}
                  <div className="space-y-6">
                    {/* ABOUT OMAYA Header */}
                    <div className="bg-[#1D8751]/15 border border-[#1D8751]/25 rounded-3xl px-4 py-2 inline-block">
                      <div className="text-[#1D8751] text-sm font-medium uppercase tracking-wide">
                        ABOUT OMAYA
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-4xl 2xl:text-5xl font-semibold text-gray-900 dark:text-white">
                      <span className="text-[#1D8751]">Safe & Reliable</span>{" "}
                      <span className="text-gray-900 dark:text-white">Cryptocurrency Exchange Platform</span>
                    </h2>

                    {/* Descriptive Text */}
                    <p className="text-[#788099] text-sm md:text-base leading-relaxed">
                      Established in 2019, OMAYA.io is a leading digital asset and cryptocurrency trading platform in Somalia,
                      licensed by the{" "}
                      <span className="text-[#1D8751] font-semibold">Central Bank of Somalia</span>.
                      With a team deeply rooted in East Africa, OMAYA.io is built to serve the region&apos;s unique financial
                      landscape by delivering secure, compliant, and localized trading and exchange solutions.
                      <br />
                      At OMAYA.io, we go beyond transactions. We are committed to empowering our users through education,
                      transparency, and access to expert insights that support informed financial decision-making. Backed by
                      deep regional market knowledge, we provide reliable, responsive, and secure services tailored to the
                      evolving needs of individuals, traders, and businesses across emerging markets.
                    </p>

                    {/* Feature Boxes - 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      {[
                        {
                          icon: Shield,
                          title: "Bank-Grade Security",
                          desc: "Advanced encryption & multi-layer protection",
                          bgColor: "bg-linear-to-br from-[#2B7FFF] to-[#00B8DB]",
                        },
                        {
                          icon: Award,
                          title: "Licensed & Regulated",
                          desc: "Approved by Central Bank of Somalia",
                          bgColor: "bg-linear-to-br from-[#AD46FF] to-[#F6339A]",
                        },
                        {
                          icon: Users,
                          title: "100K+ Active Users",
                          desc: "Trusted by traders across East Africa",
                          bgColor: "bg-linear-to-br from-[#1D8751] to-[#309A64]",
                        },
                        {
                          icon: TrendingUp,
                          title: "99.9% Uptime",
                          desc: "Reliable trading 24/7/365",
                          bgColor: "bg-linear-to-br from-[#FF6900] to-[#FB2C36]",
                        },
                      ].map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 sm:gap-4 bg-gray-50 dark:bg-[#18181D] rounded-2xl p-4 border border-border dark:border-secondary/15"
                        >
                          <div className={`w-10 h-10 ${feature.bgColor} rounded-xl flex items-center justify-center mb-3 shrink-0`}>
                            <feature.icon className={`w-6 h-6`} />
                          </div>
                          <div>
                            <div className="text-gray-900 dark:text-white font-bold text-sm mb-1">
                              {feature.title}
                            </div>
                            <div className="text-gray-700 dark:text-white/70 text-xs leading-relaxed">
                              {feature.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Tags/Buttons */}
                    <div className="flex flex-wrap gap-3 mt-6">
                      {[
                        { icon: Lock, label: "Licensed Exchange" },
                        { icon: Earth, label: "Global Reach" },
                        { icon: Zap, label: "Fast Execution" },
                        { icon: CircleCheckBig, label: "Verified Platform" },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="border border-[#1D8751]/25 bg-[#1D8751]/15 rounded-full px-4 py-2 flex items-center gap-2"
                        >
                          <item.icon className="w-4 h-4 text-[#1D8751]" />
                          <span className="text-[#1D8751] text-xs font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Easy Onboarding Section */}
      <div className="w-full bg-white dark:bg-[var(--bg-color)] pt-4 md:pt-6 pb-16 md:pb-24 relative overflow-hidden">
        {/* Dark gradient background with green dots */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Green glowing particles background */}
          <FloatingParticles count={6} size={{ min: 5, max: 11 }} />

          {/* <div className="absolute top-20 left-10 w-2 h-2 bg-[#1D8751] rounded-full opacity-60 blur-sm animate-pulse"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-[#1D8751] rounded-full opacity-40 blur-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-[#1D8751] rounded-full opacity-50 blur-sm animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-[#1D8751] rounded-full opacity-45 blur-sm animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-[#1D8751] rounded-full opacity-35 blur-md animate-pulse" style={{ animationDelay: '2s' }}></div> */}

          {/* Subtle gradient overlays */}
          {/* <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, ${tokens.colors.brand.lightGreen}15 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, ${tokens.colors.brand.lightGreen}10 0%, transparent 50%)
              `,
            }}
          ></div> */}

          {/* Subtle gradient overlays */}
          <div className="relative inset-0 opacity-30">
            <div className="absolute top-5 left-20 w-65 h-80 rounded-full bg-[#1D8751] blur-3xl opacity-60" />
            <div className="absolute top-145 right-10 w-75 h-90 rounded-full bg-[#1D8751] blur-3xl opacity-60" />
          </div>
        </div>

        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl px-4 relative z-10">
          {/* Green pill label */}
          <div className="flex justify-center mb-6">
            <span className="flex justify-center items-center gap-2 bg-[#1D8751]/10 border border-secondary/20 text-[#1D8751] px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm">
              <Sparkles className=" h-4 w-4 -mt-0.5 " />
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
          <p className="text-center text-gray-700 dark:text-[#788099] text-sm sm:text-base md:text-lg mb-12 max-w-2xl mx-auto">
            Begin your crypto journey in 4 simple steps. Join thousands of traders who trust OMAYA Exchange.
          </p>

          {/* Steps Cards */}
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
              {[
                {
                  number: 1,
                  icon: UserPlus,
                  iconBg: "bg-blue-500",
                  ringColor: "bg-blue-500/15",
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
                  icon: ShieldCheck,
                  iconBg: "bg-purple-500",
                  ringColor: "bg-purple-500/15",
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
                  icon: Wallet,
                  iconBg: "bg-[#1D8751]",
                  ringColor: "bg-[#1D8751]/15",
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
                  ringColor: "bg-orange-500/15",
                  title: t("marketing.steps.start.title", "Start Exchanging"),
                  description: t("marketing.steps.start.desc", "Start exchanging instantly and explore endless opportunities."),
                  features: [
                    t("marketing.steps.start.feature1", "1000+ assets"),
                    t("marketing.steps.start.feature2", "Real-time trading"),
                    t("marketing.steps.start.feature3", "24/7 support"),
                  ],
                },
              ].map((step, index) => (
                <div key={step.number} className="relative">
                  {/* Step Card */}
                  <div className="relative bg-white dark:bg-white/5 rounded-3xl p-6 pt-2 border-2 border-[#1D8751]/80 shadow-lg h-full flex flex-col items-center text-center mx-auto">
                    {/* Number Badge - Inside card, top right */}
                    <div className="absolute top-4 right-4 w-10 h-10  rounded-full bg-[#1D8751]/20 border border-[#1D8751]/30 flex items-center justify-center">
                      <span className="text-[#1D8751] dark:text-[#1D8751] text-base font-bold">{step.number}</span>
                    </div>

                    {/* Icon Container with gradient background */}
                    <div className="relative mb-5 mt-2">
                      {/* Outer darker background container */}
                      <div className={`relative ${step.ringColor} rounded-[20px] p-2 w-fit`}>
                        {/* Green dots decoration - positioned on the outer container */}
                        <div className="absolute top-1 left-1 w-2 h-2 lg:w-3 lg:h-3 bg-[#1D8751] rounded-full z-10"></div>
                        <div className="absolute bottom-1 right-1 w-2 h-2 lg:w-3 lg:h-3 bg-[#1D8751] rounded-full z-10"></div>

                        {/* Inner gradient icon background */}
                        <div className="relative">
                          <div className={`${step.iconBg} w-[72px] h-[72px] rounded-[16px] flex items-center justify-center shadow-lg relative overflow-hidden`}>
                            {/* Gradient overlay for depth */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[16px]"></div>
                            <step.icon className="w-8 h-8 text-white relative z-10" strokeWidth={2} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-gray-900 dark:text-white font-bold text-xl mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-700 dark:text-[#788099] text-sm mb-4 grow px-2">
                      {step.description}
                    </p>

                    {/* Features List - Left aligned */}
                    <div className="flex flex-col space-y-2.5 mt-auto w-full">
                      {step.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-[#1D8751]/20 flex items-center justify-center shrink-0">
                            <svg
                              className="w-3.5 h-3.5 text-[#1D8751]/75"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 dark:text-[#788099] text-sm text-left">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Small Arrow Circle between cards (hidden on last card) */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <div className="bg-[#1D8751] rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                        <span className="text-white text-md ml-0.5 font-light">&gt;</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-10">
            <button
              onClick={() => router.push(isAuthenticated ? '/dashboard' : '/auth/register')}
              className="group relative bg-[#1D8751] hover:bg-[#1a7547] text-white text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section with Phone */}
      <section className="
  w-full bg-white dark:bg-linear-to-t from-[#0A0A0F] to-[#18181D]
  py-16 sm:py-20 lg:py-28
  px-4 sm:px-6 md:px-10 lg:px-20 xl:px-28
  relative overflow-hidden
">
        {/* Subtle floating particles */}
        <FloatingParticles count={8} size={{ min: 5, max: 11 }} />
        {/* <div className="pointer-events-none absolute inset-0 hidden sm:block">
          <div className="absolute top-16 left-1/4 w-2 h-2 bg-[#1D8751] rounded-full opacity-60"></div>
          <div className="absolute top-32 right-1/3 w-3 h-3 bg-[#13B562] rounded-full opacity-40 "></div>
          <div className="absolute bottom-24 left-1/3 w-2 h-2 bg-[#13B562] rounded-full opacity-50 "></div>
          <div className="absolute bottom-12 right-1/4 w-3 h-3 bg-[#1D8751] rounded-full opacity-35 "></div>
        </div> */}

        <div className="
    container mx-auto
    max-w-5xl lg:max-w-6xl xl:max-w-7xl
    relative z-10
  ">
          {/* Top pill */}
          <div className="flex justify-center mb-6">
            <span className="flex justify-center items-center gap-2 bg-[#1D8751]/10 border border-[#1D8751]/30 text-[#1D8751] px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm">
              <FaRegStar className=" text-lg -mt-0.5" />
              WHY CHOOSE US
            </span>
          </div>

          {/* Main title */}
          <div className="text-center mb-17">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="text-gray-900 dark:text-white">Why Choose </span>
              <span className="text-[#1D8751]">Us</span>
            </h2>
          </div>

          <div className="
      grid grid-cols-1
      lg:grid-cols-2
      gap-10 sm:gap-12 lg:gap-5 xl:gap-7
      items-center
    ">
            {/* Left Side - Phone */}
            <div className="relative flex justify-center">
              {/* Green Glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] lg:w-[650px] lg:h-[650px]">
                  <div className="absolute inset-0 bg-[#1D8751]/30 rounded-full blur-3xl"></div>
                  {/* <div className="absolute inset-0 bg-gradient-to-br from-[#13B562]/20 via-[#1D8751]/15 to-transparent rounded-full blur-2xl"></div> */}
                </div>
              </div>

              {/* Phone Image */}
              <div className="relative z-10">
                <Image
                  src="https://res.cloudinary.com/pitz/image/upload/v1765870778/iPhone_13_Mockup_1_wnbmqk.png"
                  alt="OMAYA Exchange Mobile App"
                  width={350}
                  height={700}
                  priority
                  className="
              w-[220px] sm:w-[240px] md:w-[260px] lg:w-[280px]
              h-auto
            drop-shadow-[8px_14px_28px_rgba(0,0,0,0.45)]

            "
                />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="relative space-y-6 sm:space-y-8 max-w-xl lg:max-w-none">
              {/* Background glows */}
              <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1D8751]/15 via-[#0E5531]/10 to-transparent rounded-[40px] blur-3xl opacity-60 dark:from-[#1D8751]/25 dark:via-[#0E5531]/20 dark:opacity-70"></div>
                <div className="absolute -bottom-1 -right-10 w-90 h-110 rounded-full blur-3xl opacity-60 bg-[#1D8751]/30 dark:opacity-80"></div>
              </div>

              {/* Heading */}
              <div>
                <h3 className="
            text-2xl sm:text-3xl md:text-4xl
            font-bold
            mb-4 sm:mb-6
            leading-tight
          ">
                  <span className="text-[#1D8751]">Fast</span>
                  <span className="text-gray-900 dark:text-white"> and </span>
                  <span className="text-[#1D8751]">Secure</span><br />
                  <span className="text-gray-900 dark:text-white"> Crypto Exchange</span>
                </h3>
              </div>

              {/* Feature Cards */}
              <div className="
          grid grid-cols-1
          sm:grid-cols-2
          gap-2
        ">
                {[
                  {
                    title: "Low Transaction Fee",
                    desc: "Industry-leading fees starting from 0.1%",
                    icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
                    bg: "bg-[#1D8751]"
                  },
                  {
                    title: "Secure Payment Service",
                    desc: "Bank-grade security with 2FA authentication",
                    icon: <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
                    bg: "bg-blue-500"
                  },
                  {
                    title: "Fast Transactions",
                    desc: "Lightning-fast execution in milliseconds",
                    icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
                    bg: "bg-orange-500"
                  },
                  {
                    title: "We Work 24/7",
                    desc: "Round-the-clock support & trading",
                    icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
                    bg: "bg-purple-500"
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="
                flex items-start gap-3 sm:gap-4
                bg-gray-50 dark:bg-[#18181D]
                rounded-2xl
                p-4
                border border-gray-200 dark:border-secondary/15
              "
                  >
                    <div className={`${item.bg} w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-base  mb-1 sm:mb-2">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 dark:text-muted-foreground text-sm">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* App Buttons */}
              <div className="
          flex flex-col sm:flex-row
          gap-3 sm:gap-4
          pt-6
        ">
                {[
                  { pre: 'Download on the', text: "App Store" },
                  { pre: "GET IT ON", text: "Google Play" }
                ].map((btn, i) => (
                  <a
                    key={i}
                    href="#"
                    className="
                inline-flex items-center justify-start gap-3
                bg-gray-900 hover:bg-gray-800
                dark:bg-[#18181D] dark:hover:bg-black/70
                border-2 border-[#1D8751]/30
                rounded-2xl
                px-5 sm:px-6 py-3.5 sm:py-4
                min-w-[180px] sm:min-w-[200px]
                transition-colors
              "
                  >
                    <HiOutlineDeviceMobile className="text-3xl text-[#1D8751]" />
                    <div className="flex flex-col items-start">
                      <span className="text-muted-foreground font-medium text-sm tracking-wide">{btn.pre}</span>
                      <span className="text-white font-medium text-sm tracking-wide">{btn.text}</span>

                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Benefits Section*/}
      <div className="w-full bg-white dark:bg-[var(--bg-color)]">
        <img className="w-full h-auto object-contain" src="https://res.cloudinary.com/pitz/image/upload/v1765800227/Screenshot_2025-12-15_150329_l1z3zp.png" alt="" />
      </div>
      {/* Refer and Invite Section */}
      <div className="w-full bg-white dark:bg-transparent py-4 md:py-8 my-4 md:my-6">
        <div className="w-full md:container md:mx-auto md:max-w-8xl md:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="w-full md:mx-auto md:max-w-7xl rounded-3xl overflow-hidden bg-[#1D8751] relative">

            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-50px] left-[-50px] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 p-8 md:p-12 lg:p-16 relative z-10 items-center overflow-hidden">
              {/* Left Content */}
              <div className="space-y-5 relative z-20">
                {/* Pill */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 w-fit">
                  <Gift className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-medium tracking-wide">Earn Rewards</span>
                </div>

                {/* Heading */}
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tighter mb-4">
                    Refer and Invite your friends and earn commission
                  </h2>
                  <p className="text-white/80 text-lg font-light">
                    on each transaction they make with us
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white text-lg">Invite Friends</h4>
                      <p className="text-white/70 text-sm">Share your unique referral link</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white text-lg">They Trade</h4>
                      <p className="text-white/70 text-sm">Your friends start trading on OMAYA</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white text-lg">Earn Commission</h4>
                      <p className="text-white/70 text-sm">Get commission on every trade</p>
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="pt-2">
                  <Link href="/dashboard/account?tab=referral" className="inline-flex items-center gap-2 bg-white text-[#1D8751] px-8 py-3.5 rounded-full font-bold text-sm md:text-base hover:bg-gray-100 transition-colors shadow-xl shadow-black/10">
                    Start Referring
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Content - Visuals */}
              <div className="
                  absolute bottom-0 right-0 w-full h-[300px] z-0 opacity-25 overflow-hidden pointer-events-none
                  sm:opacity-40 sm:h-[400px]
                  lg:relative lg:opacity-100 lg:pointer-events-auto lg:h-full lg:w-auto lg:overflow-visible lg:z-10
                  perspective-1000 flex items-center justify-end lg:mr-0
                ">
                {/* Circle Decorations */}
                <div className="absolute top-4 left-4 lg:top-10 lg:left-10 w-8 h-8 lg:w-12 lg:h-12 bg-[#FDC700] rounded-full opacity-50 animate-floatSlow"></div>
                <div className="absolute bottom-10 right-10 lg:bottom-10 lg:right-1 w-12 h-12 lg:w-20 lg:h-20 bg-white/30 rounded-full opacity-40"></div>

                {/* Floating Glass Cards Container - Scaled for Mobile */}
                <div className="relative w-[340px] h-[300px] lg:w-[400px] lg:h-[300px] transform scale-[0.55] sm:scale-[0.6] md:scale-[0.85] lg:scale-85 origin-bottom-right lg:origin-center transition-transform duration-500">

                  {/* Money Bag Emoji - Floating Top Right */}
                  <div className="absolute -top-6 right-20 text-4xl lg:text-5xl animate-float-delayed z-20 drop-shadow-md">💰</div>

                  {/* Card 1 - Top Left (Greenish/Yellow tint) */}
                  <div className="absolute top-0 left-0 w-64 h-40 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 transform rotate-6 shadow-xl p-5 flex flex-col justify-between z-0">
                    {/* Yellow Coin Circle */}
                    <div className="w-10 h-10 rounded-full bg-[#FDC700] flex items-center justify-center shadow-lg">
                      <span className="text-xl -ml-0.5"><MdCurrencyBitcoin /></span>
                    </div>
                    <div className="space-y-3">
                      <div className="w-3/4 h-3 bg-white/20 rounded-full"></div>
                      <div className="w-1/2 h-2 bg-white/20 rounded-full"></div>
                    </div>
                  </div>

                  {/* Card 2 - Middle Right (Main) */}
                  <div className="absolute top-17 right-0 w-72 h-44 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/30 transform shadow-2xl p-5 flex flex-col justify-between animate-floatSlow z-10 transition-transform hover:scale-105 duration-300">
                    {/* Dark Green Circle Decoration */}
                    <div className="w-12 h-12 rounded-full bg-[#134e32]/40 absolute top-1/2 left-[45%] transform -translate-x-1/2 -translate-y-1/2 blur-lg"></div>

                    <div className="w-10 h-10 rounded-full bg-[#1D8751] flex items-center justify-center shadow-lg">
                      <span className="text-xl">$</span>
                    </div>
                    <div className="absolute top-4 right-4 text-2xl">💸</div>

                    <div className="mt-auto space-y-3 relative z-10">
                      <div className="w-full h-3 bg-white/30 rounded-full"></div>
                      <div className="w-2/3 h-2 bg-white/30 rounded-full"></div>
                    </div>
                  </div>

                  {/* Card 3 - Bottom Left (Blue Dot) */}
                  <div className="absolute bottom-[-10px] left-8 w-60 h-36 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl p-5 flex flex-col justify-between transform -rotate-2 z-20 hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-full bg-[#3B82F6] shadow-md flex items-center justify-center">£</div>
                    <div className="space-y-3">
                      <div className="w-4/5 h-3 bg-white/40 rounded-full"></div>
                      <div className="w-3/5 h-2 bg-white/40 rounded-full"></div>
                    </div>

                    {/* Dollar Bill Emoji - Floating Left */}
                    <div
                      className="absolute top-1/2 -left-20 transform -translate-y-1/2 text-3xl animate-bounce  drop-shadow-md"
                      style={{ animationDuration: '3s' }}
                    >
                      💵
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blogs Section */}
      <div className="w-full bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white pt-8 md:pt-12 pb-16 px-6 md:px-12 lg:px-16 xl:px-20">
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
        className="w-full bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white py-16 px-4 md:px-[100px]"
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
        className="w-full bg-white dark:bg-[var(--bg-color)] text-gray-900 dark:text-white py-16 px-4 md:px-8"
      >
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            {/* FAQ Pill */}
            <div className="flex justify-center mb-6 -mt-4">
              <span className="bg-[#1D8751]/10 border border-[#1D8751]/30 text-[#1D8751] px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </span>
            </div>

            {/* Main Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-bold mb-4">
              Frequently Asked <span className="text-[#1D8751]">Questions</span>
            </h2>

            {/* Subtitle */}
            <p className="text-gray-700 dark:text-[#788099] text-base md:text-lg max-w-3xl mx-auto">
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
                        className={`bg-gray-50 dark:bg-[#18181D] border rounded-xl overflow-hidden ${isOpen
                          ? "dark:border-accent border-border"
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
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors ${isOpen
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
                          <div className="bg-gray-50 dark:bg-[#18181D]">
                            <div className="px-5 pt-4 pb-4">
                              <div className="border-t border-accent dark:border-[#2A2A2A] pt-5 -mt-4">
                                <p className="text-gray-700 dark:text-white/80 text-sm md:text-base leading-relaxed">
                                  {item.answer}
                                </p>
                              </div>
                            </div>
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
          <div className="bg-gray-50 dark:bg-[#1D1D23] rounded-2xl p-8 md:p-12 text-center border border-border dark:border-accent">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 flex items-center justify-center">
                <MessageCircle className="w-13 h-13 text-[#1D8751]" />
              </div>
            </div>
            <h3 className="text-gray-900 dark:text-white text-xl md:text-2xl font-bold mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-700 dark:text-[#788099]  text-sm md:text-base mb-6">
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

      {/* KYC Verification Modal */}
      <KYCVerificationModal />
    </div>
  );
}