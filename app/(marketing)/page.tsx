"use client";
import React, { useState } from "react";
import { useMarketingI18n } from "@/lib/useMarketingI18n";
import Image from "next/image";
import Link from "next/link";
import { tokens } from "@/styles/tokens";
import { Play, MessageCircle } from "lucide-react";
import ExchangeForm from "@/components/ExchangeForm";
import { useBlog } from "@/features/blogs/hooks/blog";
import { BlogPost } from "@/features/blogs/types";
import { useFAQ } from "@/features/faq/hooks/useFAQ";
import { ContactForm } from "@/features/contact/components";

const steps = [
  {
    icon: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/create_account_gzbijn.png",
    title: "Create Account",
    description:
      "Create an account quickly and securely to start your digital trading journey.",
  },
  {
    icon: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/verify_i9k3dd.png",
    title: "Verify Identity",
    description:
      "Verify your identity to ensure a secure and compliant trading experience.",
  },
  {
    icon: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/Transfermoney_hnssjb.png",
    title: "Transfer Money",
    description:
      "Transfer funds effortlessly and access a world of digital assets.",
  },
  {
    icon: "https://res.cloudinary.com/dam1sxczj/image/upload/v1746707947/exchange_gmhyus.png",
    title: "Start Exchanging",
    description: "Start exchanging instantly and explore endless opportunities",
  },
];

const achievements = [
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
  const [openFAQ, setOpenFAQ] = useState<number | null>(4);
  const [showContactSuccess, setShowContactSuccess] = useState(false);
  const [showContactError, setShowContactError] = useState(false);
  const [contactErrorMessage, setContactErrorMessage] = useState("");
  const { blogs, news, loading, error } = useBlog();
  const { faqs: faqItems, loading: faqLoading, error: faqError } = useFAQ();

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

      return "/images/placeholder.jpg";
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

  // Get articles based on active category
  const getArticles = (): Article[] => {
    const posts = activeCategory === "News" ? news : blogs;
    return posts
      .slice(0, 6)
      .map((post, index) => transformBlogToArticle(post, index));
  };

  const articles = getArticles();

  // Filter articles based on active category
  const filteredArticles = articles.filter(
    (article) => article.category === activeCategory
  );

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
        className="relative min-h-screen pt-18 pb-16 mx-auto overflow-hidden bg-gradient-to-br from-[#022E18] via-[#022E18CC] to-transparent"
        style={{
          background: `
            radial-gradient(circle at top left, ${tokens.colors.brand.hero} 0%, ${tokens.colors.brand.hero}CC 30%, transparent 70%),
            radial-gradient(circle at bottom right, ${tokens.colors.brand.hero} 0%, ${tokens.colors.brand.hero}CC 30%, transparent 70%),
            linear-gradient(135deg, ${tokens.colors.brand.hero} 0%, ${tokens.colors.brand.hero}CC 40%, 
            ${tokens.colors.brand.lightGreen} 50%, ${tokens.colors.brand.hero}CC 60%, ${tokens.colors.brand.hero} 100%)
          `,
        }}
      >
        {/* Heptagonal Patterns */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Bottom right heptagon */}
          <div
            className="absolute bottom-[160px] right-[40px] w-[170px] h-[170px] 2xl:bottom-[220px] 2xl:right-[130px] opacity-20 bg-[#13B562]"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>

          {/* Top left heptagon */}
          <div
            className="absolute top-[-20px] left-[30px] w-[90px] h-[90px] 2xl:left-[60px] opacity-20 bg-[#13B562]"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>

          {/* Bottom left heptagon */}
          <div
            className="absolute bottom-[-40px] left-[300px] w-[180px] h-[180px] opacity-20 bg-[#13B562]"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>

          {/* Top right heptagon */}
          <div
            className="absolute top-[70px] left-[720px] w-[180px] h-[180px] 2xl:left-[1250px] opacity-20 bg-[#13B562]"
            style={{
              clipPath:
                "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)",
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 mt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3  items-starts">
            <div className="space-y-6 pl-6 md:pl-12 md:text-left text-center 2xl:col-span-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide ">
                <span className="inline-block w-full 2xl:text-7xl">
                  {t("marketing.hero.heading1", "Welcome to")}
                </span>
                <span className="inline-block w-full 2xl:text-7xl">
                  {t("marketing.hero.heading2", "OMAYA Exchange")}
                </span>
              </h1>
              <p className="text-white/80  max-w-xl 2xl:max-w-3xl mx-auto md:mx-0 2xl:text-lg">
                {t(
                  "marketing.hero.subtitle",
                  "We are OMAYA EXCHANGE, Somalia's leading platform for exchanging cryptocurrencies and Forex."
                )}
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <a
                  href="#contact"
                  className="rounded-md px-6 py-2 text-white bg-[#1D8751] 2xl:text-lg hover:bg-[#166b42] transition-colors"
                >
                  {t("marketing.hero.cta.primary", "Contact Us")}
                </a>
                <button className="rounded-md text-white hover:bg-white/10 px-6 py-2 flex items-center gap-2 border border-[#1D8751] 2xl:text-lg">
                  {t("marketing.hero.cta.secondary", "Watch Video")}
                  <Play size={16} className="ml-1 text-[#1D8751]" />
                </button>
              </div>
            </div>
            <div className="flex justify-center 2xl:justify-end 2xl:col-span-1">
              {/* <div className="relative">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746561970/iPhone_13_Mockup_1_zzm7tt.png"
                  alt="OMAYA Exchange App"
                  width={300}
                  height={400}
                  className="2xl:w-[369.55px] 2xl:h-[695.7px]"
                />
              </div> */}
              <ExchangeForm />
            </div>
          </div>
        </div>
      </section>

      <div className="py-20 px-4 bg-[#EEF1F4] dark:bg-[#18181D]">
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl px-4">
          {/* Section Title */}
          <h2 className="text-center text-2xl md:text-3xl 2xl:text-4xl font-medium darK:text-white mb-12">
            {t(
              "marketing.achievements.title",
              "Celebrating Success: Key Achievements at OMAYA EXCHANGE"
            )}
          </h2>
          {/* Achievement Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="border border-[#13B562]/40 rounded-lg p-6 flex flex-col items-center justify-center darrk:bg-[#1D1D23]"
              >
                <div className="text-[#F79330] text-3xl md:text-4xl font-bold mb-2">
                  {achievement.value}
                </div>
                <div className="darK:text-white text-xm text-center 2xl:text-sm">
                  {t(achievement.label, achievement.label)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About section */}
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left side - About */}
            <div className="md:text-left text-center">
              <div className="flex mb-6 justify-center md:justify-start">
                <div className="mr-4"></div>
                <div>
                  <div className="flex items-center mb-2 gap-4 justify-center md:justify-start">
                    <div className="text-sm 2xl:text-lg darK:text-white font-medium p-1 tracking-widest rotate-180 border-l-2 border-[#1D8751] [writing-mode:vertical-rl]">
                      {t("marketing.about.label", "ABOUT US")}
                    </div>
                    <div>
                      <h3 className="text-[#1D8751] text-xl 2xl:text-2xl font-medium mb-1">
                        {t("marketing.about.title1", "ABOUT")}
                      </h3>
                      <h4 className="text-[#1D8751] text-xl 2xl:text-2xl font-medium mb-4">
                        {t("marketing.about.title2", "OMAYA EXCHANGE .")}
                      </h4>
                    </div>
                  </div>

                  <div className="darK:text-white space-y-6 text-left 2xl:text-lg">
                    <p>
                      {t("marketing.about.body", "Established in 2019, OMAYA Express Exchange is Somalia's leading cryptocurrency exchange, licensed by the Central Bank of Somalia. With a team spread across the country and abroad, we've facilitated over 50,000 transactions, surpassing $60 million in volume. In addition to cryptocurrency services, we act as a local agent for premier Forex brokers, offering comprehensive financial solutions. We are fully compliant with government regulations, ensuring a secure and trustworthy platform for all our users. Our commitment to innovation and customer satisfaction drives everything we do at OMAYA Exchange. We focus on providing a seamless, user-friendly experience for both novice and experienced traders. By combining advanced technology with a deep understanding of the local market, we empower our users to confidently participate in the global digital economy. As we continue to grow, we remain dedicated to maintaining the highest standards of transparency, security, and regulatory compliance, ensuring that OMAYA Exchange remains the trusted gateway to financial freedom in East Africa.")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - 3D illustration */}
            <div className="flex justify-center items-start">
              <div className="relative h-64 w-64 md:h-80 md:w-80 2xl:h-110 2xl:w-110">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746707948/Group_164015_izwpob.png"
                  alt="Cryptocurrency exchange 3D illustration"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main heading */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl 2xl:text-4xl font-medium">
            <span className="darK:text-white">
              {t("marketing.getSetup.titlePrefix", "Get Set Up And")}{" "}
            </span>
            <span className="text-[#1D8751]">
              {t("marketing.getSetup.titleHighlight", "Start Exchanging")}
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl relative mt-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step card */}
                <div className="border border-[#13B562]/40 rounded-lg p-6 flex flex-col items-center darK:bg-[#18181D] h-full">
                  <div className="border border-[#13B562]/40 p-4 rounded-md mb-4 relative">
                    <div className="bg-green-700 w-2 h-2 rounded-full absolute top-1.5 left-[-7]"></div>
                    <div className="bg-green-700 w-2 h-2 rounded-full absolute bottom-3 right-[-4]"></div>
                    <img
                      src={step.icon || "/placeholder.svg"}
                      alt={step.title}
                      className="w-12 h-12 object-contain"
                    ></img>
                  </div>
                  <h3 className="darK:text-white font-medium text-lg 2xl:text-xl mb-2 text-center">
                    {step.title}
                  </h3>
                  <p className="darK:text-[#788099] text-center text-sm 2xl:text-lg">
                    {step.description}
                  </p>
                </div>

                {/* Bottom semi-circle curves for first and third connections */}
                {(index === 0 || index === 2) && index < steps.length - 1 && (
                  <div
                    className="absolute hidden md:block"
                    style={{
                      left: "100%",
                      top: "100%",
                      transform: "translateX(-50%)",
                      width: "130px",
                      height: "60px",
                      zIndex: 10,
                    }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 120 50"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0 0 C30 50, 75 50, 120 0"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        fill="none"
                      />
                      <polygon
                        points="115,5 125,0 115,-5"
                        fill="#1D8751"
                        transform="translate(-1,0) rotate(160, 120, 0)"
                      />
                    </svg>
                  </div>
                )}

                {/* Top semi-circle curve for the middle connection */}
                {index === 1 && (
                  <div
                    className="absolute hidden md:block"
                    style={{
                      left: "100%",
                      bottom: "100%",
                      transform: "translateX(-50%)",
                      width: "130px",
                      height: "75px",
                      zIndex: 10,
                    }}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 120 50"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0 50 C25 0, 75 0, 100 50"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        fill="none"
                      />
                      <polygon
                        points="95,55 100,50 90,50"
                        fill="#1D8751"
                        transform="translate(5, 0) rotate(-45, 100, 50)"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features section */}
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl mt-24">
          <h2 className="text-center text-2xl md:text-3xl 2xl:text-4xl font-medium text-white mb-16">
            <span className="text-[#1D8751]">
              {t("marketing.features.title", "Why Choose Us")}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
            <div className="relative flex justify-center">
              <div className="relative w-64 h-96 2xl:w-80 2xl:h-110">
                <div
                  className="absolute w-60 h-60 2xl:w-76 2xl:h-76  rounded-full bg-[#12AA5D21] bg-opacity- top-[100px] right-1/4 "
                  style={{ transform: "scale(1.5)" }}
                ></div>
                <div
                  className="absolute w-60 h-60 2xl:w-76 2xl:h-76 rounded-full border border-[#1D7A4A] border-opacity- top-[100px] "
                  style={{ transform: "scale(1.5)" }}
                ></div>
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746561970/iPhone_13_Mockup_1_zzm7tt.png"
                  alt="OMAYA Exchange mobile app"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-col justify-center md:items-start items-center">
              <h3 className="text-2xl 2xl:text-3xl font-medium mb-8">
                <span className="text-[#1D8751] mr-2">Fast</span>
                <span className="dark:text-white mr-2">and</span>
                <span className="text-[#1D8751]">Secure</span>
                <span className="dark:text-white"> Crypto Exchange</span>
              </h3>

              <ul className="space-y-4 ml-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center 2xl:text-lg">
                    <div className="w-3 h-3 rounded-full bg-[#1D8751] flex items-center justify-center mr-3"></div>
                    <span className="text-[#788099]">
                      {t(
                        `marketing.features.items.${feature === "Low Transaction Fee" ? "lowFee" : feature === "Secure Payment Service" ? "secure" : feature === "Fast Transactions" ? "fast" : "support"}`,
                        feature
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* App Store Buttons */}
              <div className="flex mt-8 space-x-2">
                <div className="rounded px-4 py-2 flex items-center border border-gray-700">
                  <Image
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746786399/apple_f0yfel.png"
                    alt="Apple App Store"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  <div>
                    <p className="dark:text-white text-xs 2xl:text-sm">
                      Download on the
                    </p>
                    <span className="dark:text-white text-sm 2xl:text-lg">
                      App Store
                    </span>
                  </div>
                </div>
                <div className="rounded px-4 py-2 flex items-center border border-gray-700">
                  <Image
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746787514/Google_Play-Icon-Logo.wine_dqxxk7.svg"
                    alt="Google Play Store"
                    width={45}
                    height={13}
                    className="mr-2"
                  />
                  <div>
                    <p className="dark:text-white text-xs 2xl:text-sm">
                      Download on the
                    </p>
                    <span className="dar:text-white text-sm 2xl:text-lg">
                      Google Play
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Benefits Section*/}
      <div className="w-full bg-gradient-to-r from-[#022E18] to-[#13B562] py-16">
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Absolute Safety */}
            <div className="flex">
              <div className="mr-4">
                <div
                  className="w-16 h-16 bg-[#095E32] flex items-center justify-center shadow-lg shadow-[#0A6E3A]/50 p-2"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <img
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746792649/safety_s0zxej.png"
                    alt=""
                  />
                </div>
              </div>
              <div>
                <h3 className="text-white font-medium text-lg mb-2 2xl:text-xl">
                  {t("marketing.benefits.safety.title", "Absolute Safety")}
                </h3>
                <p className="text-gray-200 text-sm 2xl:text-lg">
                  {t("marketing.benefits.safety.desc", "Exchange confidently with OMAYA, where safety is our top priority.")}
                </p>
              </div>
            </div>

            {/* Fast Deposits & Withdrawals */}
            <div className="flex">
              <div className="mr-4">
                <div
                  className="w-16 h-16 bg-[#095E32] flex items-center justify-center shadow-lg shadow-[#0A6E3A]/50 px-2 py-3"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <img
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746792649/withdrawals_sy4kqe.png"
                    alt=""
                  />
                </div>
              </div>
              <div>
                <h3 className="text-white font-medium text-lg 2xl:text-xl mb-2">
                  {t("marketing.benefits.fast.title", "Fast Deposits & Withdrawals")}
                </h3>
                <p className="text-gray-200 text-sm 2xl:text-lg">
                  {t("marketing.benefits.fast.desc", "Enjoy swift and seamless deposits and withdrawals.")}
                </p>
              </div>
            </div>

            {/* Invite your friend and earn */}
            <div className="flex">
              <div className="mr-4">
                <div
                  className="w-16 h-16 bg-[#095E32] flex items-center justify-center shadow-lg shadow-[#0A6E3A]/50 p-2"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                >
                  <img
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746792649/users-profiles-03_qfxyha.png"
                    alt=""
                  />
                </div>
              </div>
              <div>
                <h3 className="text-white font-medium text-lg 2xl:text-xl mb-2">
                  {t("marketing.benefits.invite.title", "Invite your friend and earn")}
                </h3>
                <p className="text-gray-200 text-sm 2xl:text-lg">
                  {t("marketing.benefits.invite.desc", "Refer and invite your friends and earn commission on each transaction they make with us!")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Assets Section*/}
      <div className="w-full dark:bg-[#18181D] bg-[#EEF1F4]  py-16">
        <div className="container mx-auto max-w-6xl 2xl:max-w-screen-2xl px-4">
          <h2 className="text-center text-2xl md:text-3xl 2xl:text-4xl font-medium darK:text-white mb-12">
            {t("marketing.assets.title", "Supported Assets")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {/* FXPRIMUS */}
            <div className="dark:bg-[#1D1D23] bg-[#F5F5F5] rounded-lg py-6 px-4 flex flex-col items-center">
              <div className="w-16 h-16 mb-3">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746793801/FXPRIMUS-logo_2_k8ikwb.png"
                  alt="FXPRIMUS"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <span className="darK:text-white text-sm 2xl:text-lg">
                FXPRIMUS
              </span>
            </div>

            {/* Perfect Money */}
            <div className="dark:bg-[#1D1D23] bg-[#F5F5F5] rounded-lg py-6 px-4 flex flex-col items-center">
              <div className="w-16 h-16 mb-3">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746793801/Perfect_Money_Logo_2_niaa2j.png"
                  alt="Perfect Money"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <span className="darK:text-white text-sm 2xl:text-lg">
                Perfect Money
              </span>
            </div>

            {/* USDT Tether (ERC20) */}
            <div className="dark:bg-[#1D1D23] bg-[#F5F5F5] rounded-lg py-6 px-4 flex flex-col items-center">
              <div className="w-16 h-16 mb-3">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Group_164023_bluiv9.png"
                  alt="USDT Tether (ERC20)"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <span className="darK:text-white text-sm 2xl:text-lg">
                USDT Tether (ERC20)
              </span>
            </div>

            {/* Bitcoin */}
            <div className="dark:bg-[#1D1D23] bg-[#F5F5F5] rounded-lg py-6 px-4 flex flex-col items-center">
              <div className="w-16 h-16 mb-3">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Bitcoin-1_b6ku56.png"
                  alt="Bitcoin"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <span className="darK:text-white text-sm 2xl:text-lg">
                Bitcoin
              </span>
            </div>

            {/* USDT Tether (TRC20) */}
            <div className="dark:bg-[#1D1D23] bg-[#F5F5F5] rounded-lg py-6 px-4 flex flex-col items-center">
              <div className="w-16 h-16 mb-3">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/Tether_ttkeym.png"
                  alt="USDT Tether (TRC20)"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <span className="darK:text-white text-sm 2xl:text-lg">
                USDT Tether (TRC20)
              </span>
            </div>

            {/* ICM Capital */}
            <div className="dark:bg-[#1D1D23] bg-[#F5F5F5] rounded-lg py-6 px-4 flex flex-col items-center">
              <div className="w-16 h-16 mb-3">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746793800/ICMCapital_1_qte6tt.png"
                  alt="ICM Capital"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <span className="darK:text-white text-sm 2xl:text-lg">
                ICM Capital
              </span>
            </div>

            {/* +300 More */}
            <div className="dark:bg-[#1D1D23] bg-[#F5F5F5] rounded-lg py-6 px-4 flex flex-col items-center justify-center">
              <div className="text-[#FFA500] font-semibold 2xl:text-2xl">
                +300
              </div>
              <span className="text-gray-400 text-sm 2xl:text-lg">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Section*/}
      <div className="w-full bg-gradient-to-r from-[#197345] to-[#278D59] relative  md:py-0 lg:py-8">
        <div className="container mx-auto md:pl-18 md:pr-0 px-6">
          <div className="flex flex-col md:flex-row items-center">
            {/* Text content */}
            <div className="w-full md:w-1/2 mb-8 md:mb-0">
              <p className="text-white text-lg 2xl:text-xl mb-2">
                {t(
                  "marketing.referral.subtitle",
                  "Invite your friend, and earn commission"
                )}
              </p>
              <h2 className="text-white text-2xl md:text-2xl 2xl:text-3xl font-medium mb-6">
                {t(
                  "marketing.referral.title",
                  "Refer and Invite your friends and earn commission on each transaction they make with us!"
                )}
              </h2>
              <a
                href="#contact"
                className="bg-white text-[#0A6E3A] px-6 py-2 rounded-full hover:bg-gray-100 transition duration-300 inline-block"
              >
                Contact Us
              </a>
            </div>

            <div className="hidden md:flex w-1/2 justify-end md:mt-8 lg:mt-12 absolute right-0">
              <div className="relative w-64 h-64">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746795074/phones_fmej07.png"
                  alt="Referral Program"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Mobile-only image that appears below text */}
          <div className="flex md:hidden justify-center mt-8">
            <div className="relative w-64 h-64">
              <Image
                src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746795074/phones_fmej07.png"
                alt="Referral Program"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Blogs Section */}
      <div className="w-full dark:bg-[#18181D] bg-[#EEF1F4] text-white py-12 px-4 md:px-8">
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto">
          {/* Header section */}
          <div className="mb-10">
            <h2 className="text-center text-2xl 2xl:text-3xl font-semibold dark:text-white text-[#0D0D0D]">
              {t(
                "marketing.blogs.title",
                "Enjoy Our Blog & News On the Latest Updates"
              )}
            </h2>

            {/* Category toggle buttons */}
            <div className="mt-6 inline-flex bg-white dark:bg-[#1D1D23] rounded-full">
              <button
                onClick={() => setActiveCategory("News")}
                className={`px-6 py-2 rounded-full text-sm font-medium flex 2xl:text-lg items-center gap-2 transition-colors ${
                  activeCategory === "News"
                    ? "bg-[#1D8751] text-white"
                    : "text-[#788099]"
                }`}
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded-full border-2 ${
                    activeCategory === "News"
                      ? "border-white"
                      : "border-gray-400"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      activeCategory === "News" ? "bg-white" : "bg-transparent"
                    }`}
                  ></span>
                </span>
                News
              </button>
              <button
                onClick={() => setActiveCategory("Blog")}
                className={`px-6 py-2 rounded-full text-sm 2xl:text-lg font-medium flex items-center gap-2 transition-colors ${
                  activeCategory === "Blog"
                    ? "bg-[#1D8751] text-white"
                    : "text-[#788099]"
                }`}
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded-full border-2 ${
                    activeCategory === "Blog"
                      ? "border-white"
                      : "border-gray-400"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      activeCategory === "Blog" ? "bg-white" : "bg-transparent"
                    }`}
                  ></span>
                </span>
                Blog
              </button>
            </div>
          </div>

          {/* Articles grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // Loading state
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="dark:bg-[#18181D] rounded-lg overflow-hidden flex flex-col h-full animate-pulse"
                >
                  <div className="relative h-48 bg-gray-700"></div>
                  <div className="py-6 space-y-3">
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
                  No {activeCategory.toLowerCase()} posts available.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Please add some blog posts to your Sanity CMS.
                </p>
              </div>
            ) : (
              // Articles grid
              filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="dark:bg-[#18181D] rounded-lg overflow-hidden flex flex-col h-full"
                >
                  <div className="relative h-48">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="py-6">
                    <div className="flex justify-between flex-wrap gap-2 mb-3">
                      <p className="text-xs 2xl:text-sm rounded-full dark:text-[#727272] text-[#788099]">
                        {article.createdAt}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {article.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-xs 2xl:text-sm px-2 py-1 dark:bg-[#35353E] bg-[#F5F5F5] rounded-full text-[#788099]"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg 2xl:text-xl mb-4 dark:text-white text-[#0D0D0D]">
                      {article.title}
                    </h3>
                    <p className="dark:text-[#788099] text-[#788099] text-sm 2xl:text-lg mb-4">
                      {article.excerpt}
                    </p>
                    <Link
                      href={`/blog/${article.id}`}
                      className="inline-block text-[#1D8751] border border-[#1D8751] rounded-full px-4 py-1 text-sm 2xl:text-lg transition-colors hover:bg-[#1D8751] hover:text-white"
                    >
                      {t("marketing.blogs.read", "Read Article")}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* See all button */}
          <div className="mt-10 text-center">
            <Link
              href={`/${activeCategory.toLowerCase()}`}
              className="inline-block bg-[#1D8751] text-white rounded-full px-6 py-3 font-medium text-sm transition-colors hover:bg-[#1D8751]"
            >
              {t("marketing.buttons.goToCategory", `Go To ${activeCategory}`)}
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Us Section */}
      <section
        id="contact"
        className="w-full dark:bg-[#1D1D23] bg-[#F6F6F6] text-white py-16 px-4 md:px-8"
      >
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Form Section */}
            <div className="w-full lg:w-1/2 space-y-6">
              <h2 className="text-3xl 2xl:text-4xl font-bold mb-6 w-3/4 text-[#0D0D0D]  dark:text-white">
                {t(
                  "marketing.contact.title",
                  "Need Answers to Your Questions? Contact Us"
                )}
              </h2>

              {/* Success Message */}
              {showContactSuccess && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    {t(
                      "marketing.contact.success",
                      "Thank you! Your message has been submitted successfully. We'll get back to you soon."
                    )}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {showContactError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    {contactErrorMessage}
                  </p>
                </div>
              )}

              <ContactForm
                onSuccess={handleContactSuccess}
                onError={handleContactError}
              />
            </div>

            {/* Image Section */}
            <div className="w-full lg:w-1/2">
              <div className="rounded-2xl overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746799099/Rectangle_39366_f6i8px.png"
                  alt="Customer service representatives"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full dark:bg-[#18181D]  bg-[#EEF1F4]   dark:text-white text-[#0D0D0D] py-16 px-4 md:px-8">
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Illustration */}
            <div className="w-full lg:w-1/2">
              <div className="relative w-full max-w-md mx-auto">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746799098/na_january_14-ai_2_odotog.png"
                  alt="FAQ Illustration"
                  width={500}
                  height={400}
                  className="w-full h-auto "
                />
              </div>
            </div>

            {/* FAQ Content */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl 2xl:text-3xl font-bold ">
                  Let's Answer Some Of Your Questions Or
                </h2>
                <p className="text-2xl 2xl:text-3xl font-medium text-[#1D8751]">
                  Frequently Asked Questions
                </p>
              </div>

              {/* Accordion */}
              <div className="space-y-4">
                {faqLoading ? (
                  // Loading state
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="relative animate-pulse">
                      <div className="border rounded-xl overflow-hidden border-[#35353E]">
                        <div className="w-full flex justify-between items-center px-4 py-3 text-left dark:bg-[#1D1D23] bg-[#F5F5F5]">
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
                  // FAQ items
                  faqItems.map((item) => (
                    <div key={item.id || item._id} className="relative">
                      <div
                        className={`border rounded-xl overflow-hidden ${
                          openFAQ === (item.id || 0)
                            ? "border-[#1D8751]"
                            : "border-[#35353E]"
                        }`}
                      >
                        {/* Accordion Header */}
                        <button
                          onClick={() => toggleFAQ(item.id || 0)}
                          className="w-full flex justify-between items-center px-4 py-3 text-left dark:bg-[#1D1D23] bg-[#F5F5F5]"
                        >
                          <span className="dark:text-white text-black">
                            {item.question}
                          </span>
                          {openFAQ === (item.id || 0) ? (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 4L4 12"
                                stroke="#1D8751"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M4 4L12 12"
                                stroke="#1D8751"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8 4V12"
                                stroke="#1D8751"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M4 8H12"
                                stroke="#1D8751"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>

                        {/* Accordion Content */}
                        {openFAQ === (item.id || 0) && (
                          <>
                            {/* Dashed separator line */}
                            <div className="border-t border-dashed border-gray-600 ml-2 mr-2"></div>
                            <div className="px-4 py-3 dark:bg-[#1D1D23] bg-[#F5F5F5]">
                              <p className="text-gray-400 text-sm 2xl:text-lg">
                                {item.answer}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat button */}
          <div className="absolute right-4 mt-4">
            <button className="rounded-full p-3 text-[#1D8751]">
              <MessageCircle size={34} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
