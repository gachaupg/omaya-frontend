"use client";

import React from "react";
import Image from "next/image";
import {
  Target,
  Eye,
  Users,
  Shield,
  Zap,
  Globe,
  Award,
  Star,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  Fingerprint,
  Key,
  FileLock,
  ShieldCheck,
  Clock,
  Building2,
  ArrowRight,
  Rocket,
  DollarSign,
  TrendingUp,
  ArrowLeftRight,
  LineChart,
  Wallet,
  RefreshCcw,
  Trophy,
} from "lucide-react";
import FloatingParticles from "@/components/ui/floating-particles";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";
import { useMarketingI18n } from "@/lib/useMarketingI18n";

const PRIVACY_PATH = "/dashboard/account/?tab=privacy";

const AboutPage = () => {
  const { t } = useMarketingI18n();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleSecurityClick = () => {
    if (isAuthenticated) {
      router.push(PRIVACY_PATH);
    } else {
      setAuthRedirectPath(PRIVACY_PATH);
      router.push("/auth/login");
    }
  };
  const stats = [
    {
      icon: Users,
      value: "50,000+",
      label: t("marketing.aboutPage.stat.users", "Active Users"),
    },
    {
      icon: DollarSign,
      value: "100M+",
      label: t("marketing.aboutPage.stat.totalVolume", "Total Volume"),
    },
    {
      icon: Globe,
      value: "150+",
      label: t("marketing.aboutPage.stat.countries", "Countries Served"),
    },
    {
      icon: Shield,
      value: "99.9%",
      label: t("marketing.aboutPage.stat.uptime", "Uptime SLA"),
    },
  ];

  const tradingSolutions = [
    {
      title: "Spot Trading",
      description:
        "Trade digital assets with advanced charting tools and real-time market data",
      icon: TrendingUp,
    },
    {
      title: "P2P Exchange",
      description:
        "Direct peer-to-peer trading with multiple payment methods and currencies",
      icon: ArrowLeftRight,
    },
    {
      title: "Forex Trading",
      description:
        "Access global forex markets with competitive spreads and leverage",
      icon: LineChart,
    },
    {
      title: "Express Swap",
      description:
        "Instant cryptocurrency swaps with the best exchange rates",
      icon: Zap,
    },
    {
      title: "Secure Wallet",
      description:
        "Multi-signature wallets with cold storage for maximum security",
      icon: Wallet,
    },
    {
      title: "Staking & Rewards",
      description:
        "Earn passive income through staking and liquidity provision",
      icon: RefreshCcw,
    },
  ];

  const platformFeatures = [
    {
      title: "Bank-Grade Security",
      description:
        "Multi-layer security with cold storage, 2FA, and biometric authentication.",
      icon: Shield,
      bullets: ["Cold Storage", "Multi-Signature", "SSL Encryption"],
    },
    {
      title: "Lightning Fast",
      description:
        "Ultra-low latency trading engine processing millions of transactions per second.",
      icon: Zap,
      bullets: ["<1ms Execution", "High Liquidity", "Smart Routing"],
    },
    {
      title: "Advanced Tools",
      description:
        "Professional trading tools with real-time charts and market analysis.",
      icon: Globe,
      bullets: ["TradingView", "API Access", "Custom Alerts"],
    },
    {
      title: "Mobile Trading",
      description:
        "Trade anywhere with our iOS and Android apps with full functionality.",
      icon: Phone,
      bullets: ["iOS & Android", "Face ID", "Push Notifications"],
    },
    {
      title: "24/7 Support",
      description:
        "Round-the-clock customer support in multiple languages to keep you trading.",
      icon: Users,
      bullets: ["Live Chat", "Email Support", "15+ Languages"],
    },
    {
      title: "Global Access",
      description:
        "Available in 150+ countries with local payment methods and currencies.",
      icon: Globe,
      bullets: ["150+ Countries", "Multiple Fiat", "Bank Transfer"],
    },
    {
      title: "Wide Selection",
      description:
        "Trade 200+ cryptocurrencies with 500+ trading pairs and new listings.",
      icon: Award,
      bullets: ["200+ Coins", "500+ Pairs", "New Listings"],
    },
    {
      title: "Transparent Fees",
      description:
        "Competitive trading fees starting from 0.1% with volume discounts.",
      icon: Shield,
      bullets: ["0.1% Fee", "No Hidden Costs", "VIP Tiers"],
    },
  ];

  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "Bank-grade encryption and multi-layer security protocols protect your assets 24/7.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Experience instant transactions with our optimized infrastructure and smart routing.",
    },
    {
      icon: Users,
      title: "Customer Focused",
      description: "24/7 dedicated support team ready to assist you with any questions or concerns.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Trade from anywhere in the world with support for multiple currencies and payment methods.",
    },
  ];

  const journeySteps = [
    {
      year: "2020",
      quarter: "Q1",
      title: "Foundation",
      description: "OMAYA.io was founded by crypto pioneers and fintech experts with a vision to revolutionize digital asset trading.",
      icon: Rocket,
      pills: ["10 Cryptocurrencies", "Beta Launch", "1,000+ Users"],
      image: "/assets/Container_9_e1cnzo.png",
      align: "right",
    },
    {
      year: "2021",
      quarter: "Q3",
      title: "Rapid Growth",
      description: "Expanded to 50 countries and reached 10,000 active users with enhanced trading features and mobile app launch.",
      icon: TrendingUp,
      pills: ["50 Countries", "100M+ Total Volume", "10K+ Users"],
      image: "/assets/Container_5_aj1cpq.png",
      align: "left",
    },
    {
      year: "2022",
      quarter: "Q2",
      title: "Global Expansion",
      description: "Reached 150+ countries with 24/7 multilingual support and introduced P2P trading and staking features.",
      icon: Globe,
      pills: ["150+ Countries", "200+ Coins", "15 Languages"],
      image: "/assets/Container_8_c6iouu.png",
      align: "right",
    },
    {
      year: "2023",
      quarter: "Q4",
      title: "Industry Recognition",
      description: "Won Best Crypto Exchange Award and achieved ISO 27001 certification for information security management.",
      icon: Trophy,
      pills: ["50K+ Traders", "ISO Certified", "Best Exchange"],
      image: "/assets/Container_7_ffwiyh.png",
      align: "left",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-(--bg-color)">
      {/* Hero Section */}

      <section className="relative mt-16 md:mt-20 pt-12 md:pt-16 pb-20 px-4 overflow-hidden bg-gradient-to-br from-[#1D8751] via-[#16864a] to-[#0e5c33] dark:from-[#0A0A0F] dark:via-[#0A0A0F]/5 dark:to-[#0A0A0F]">
        <FloatingParticles count={15} size={4} />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            {/* Welcome Banner */}
            <div className="inline-block mb-8">
              <div className="px-4 py-1.5 rounded-3xl bg-[#1D87511A] border border-[#1D87514D] dark:bg-[#1D8751]/10 dark:border-[#1D8751]/30">
                <p className="text-sm md:text-sm text-white dark:text-[#1D8751] font-medium">
                  {t("marketing.aboutPage.welcome", "Welcome to OMAYA.io")}
                </p>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <div className="text-white">{t("marketing.aboutPage.titleAbout", "About")}</div>
              <div className="text-white dark:text-[#1D8751]">{t("marketing.aboutPage.titleBrand", "OMAYA.io")}</div>
            </h1>

            {/* Tagline */}
            <p className="text-xl dark:text-muted-foreground text-muted max-w-3xl mx-auto mb-10">
              {t("marketing.aboutPage.tagline", "Leading the future of digital asset exchange with innovation, security, and trust")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="#story"
                className="relative px-8 py-3 bg-[#1D8751] text-white hover:bg-white/90 transition-all duration-300 shadow-lg dark:bg-[#1D8751] dark:text-white dark:hover:bg-[#166b3e]"
                style={{ borderRadius: '2rem' }}
              >
                {t("marketing.aboutPage.exploreJourney", "Explore Our Journey")}
              </a>
              <a
                href="/contactUs"
                className="px-8 py-3 bg-transparent border-1 border-white text-white font-semibold hover:bg-white/10 transition-all duration-300 dark:border-[#1D8751] dark:text-[#1D8751] dark:hover:bg-[#1D8751]/10"
                style={{ borderRadius: '2rem' }}
              >
                {t("marketing.aboutPage.contactUs", "Contact Us")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by Millions Worldwide Section */}
      <section className="py-16 px-4 bg-white dark:bg-linear-to-b via-[#18181D] via-40% from-[#0A0A0F] to-[#0A0A0F]" >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {t("marketing.aboutPage.trustedTitle", "Trusted by Millions Worldwide")}
            </h2>
            <p className="text-gray-600 dark:text-[#788099] text-base md:text-lg">
              {t("marketing.aboutPage.trustedSubtitle", "Leading the digital asset revolution with proven results")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="text-center p-6 rounded-2xl bg-white dark:bg-[#14141A] border border-gray-100 dark:border-[#20202A] shadow-sm"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1D8751]/10 mb-4">
                    <StatIcon className="w-6 h-6 text-[#1D8751]" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trading Solutions Section */}
      <section className="relative py-20 px-4 bg-gray-50 dark:bg-[#0A0A0F]">

        {/* Blur floating background */}
        <div className="absolute bottom-10 left-1 w-90 h-70 blur-3xl rounded-full bg-[#1D8751]/15 "></div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#1D8751]/10 border border-[#1D8751]/30 mb-5">
              <span className="text-xs md:text-sm font-medium text-[#1D8751]">
                Trading Solutions
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Trading Platform
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-[#788099] max-w-2xl mx-auto">
              Everything you need to trade, invest, and earn in the digital
              economy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tradingSolutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-white/5 backdrop-blur-3xl border border-border dark:border-accent"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-[#1D8751]/10 via-transparent to-[#1D8751]/5 transition-opacity duration-300" />
                  <div className="relative p-6 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-2xl bg-[#1D8751]/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {solution.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                      {solution.description}
                    </p>
                    <div className="mt-6">
                      <div className="h-1 w-10 rounded-full bg-[#1D8751] group-hover:w-16 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-white dark:bg-[var(--bg-color)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Mission Content */}
            <div>
              {/* Mission Banner */}
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-[#1D8751]/10 border border-[#1D8751]/30 mb-8" style={{ borderRadius: '2rem' }}>
                <div className="w-8 h-8 rounded-full bg-[#1D8751]/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-[#1D8751]" />
                </div>
                <span className="text-lg text-[#1D8751]">Our Mission</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                <span className="block">Democratizing Digital</span>
                <span className="block">Asset Trading</span>
              </h2>

              {/* Description Paragraphs */}
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                To democratize access to digital asset trading by providing a secure,
                efficient, and user-friendly platform that empowers individuals and
                businesses worldwide to participate in the digital economy.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                We strive to break down barriers and make cryptocurrency trading accessible to
                everyone, regardless of their location or experience level.
              </p>

              {/* Feature Boxes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-xl p-4 border border-border dark:border-accent">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Accessible</h3>
                  <p className="text-sm text-gray-600 dark:text-[#788099]">For Everyone</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-xl p-4 border border-border dark:border-accent">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Secure</h3>
                  <p className="text-sm text-gray-600 dark:text-[#788099]">Bank-Grade</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-xl p-4 border border-border dark:border-accent">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Efficient</h3>
                  <p className="text-sm text-gray-600 dark:text-[#788099]">Lightning Fast</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-xl p-4 border border-border dark:border-accent">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Global</h3>
                  <p className="text-sm text-gray-600 dark:text-[#788099]">150+ Countries</p>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative">
              <div className="relative w-full h-[600px] rounded-3xl overflow-hidden">
                <Image
                  src="/assets/Container_ihax20.png"
                  alt="Our Mission"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-[var(--bg-color)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Image */}
            <div className="relative order-2 md:order-1">
              <div className="relative w-full h-[600px] rounded-3xl overflow-hidden">
                <Image
                  src="/assets/Container_2_yazuhu.png"
                  alt="Our Vision"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Right Column - Vision Content */}
            <div className="order-1 md:order-2">
              {/* Vision Banner */}
              <div
                className="inline-flex items-center gap-1 px-4 py-1 bg-gray-100 dark:bg-[#AD46FF]/10 border border-[#AD46FF]/30 mb-8"
                style={{ borderRadius: "2rem" }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-[#1D8751]" />
                </div>
                <span className="text-lg font-bold text-[#1D8751]">Our Vision</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                <span className="block">The Future of Digital</span>
                <span className="block">Finance</span>
              </h2>

              {/* Description Paragraphs */}
              <p className="text-lg text-[#788099] mb-4 leading-relaxed">
                To become the world's most trusted and innovative digital asset exchange
                platform, setting new standards for security, transparency, and user
                experience.
              </p>
              <p className="text-lg text-[#788099] mb-8 leading-relaxed">
                We envision a future where blockchain technology and traditional finance
                seamlessly integrate, creating unprecedented opportunities for wealth
                creation and financial freedom.
              </p>

              {/* Vision Feature Boxes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Innovation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cutting-Edge Tech</p>
                </div>
                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Trust</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transparent</p>
                </div>
                <div className="bg-white dark:bg-[#18181D] rounded-xl p-5 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Integration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Seamless</p>
                </div>
                <div className="bg-white dark:bg-[#18181D] rounded-xl p-5 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Freedom</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Financial Liberty</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 px-4 bg-linear-to-b from-gray-50 via-white to-gray-50 dark:from-[#0A0A0F] dark:via-[#18181D] dark:to-[##0A0A0F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#1D8751]/10 border border-[#1D8751]/30 mb-5">
              <span className="text-xs md:text-sm font-medium text-[#1D8751]">
                Platform Features
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose OMAYA.io?
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Industry-leading features designed for traders of all levels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-2xl bg-white dark:bg-linear-to-b dark:from-[#18181D] dark:to-[#0F0F13] to-40% border border-border dark:border-accent hover:border-[#1D8751]/90 transition-all duration-300 px-6 pb-9 pt-5 flex flex-col"
                >
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#1D8751] to-[#309A64] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
                    {feature.description}
                  </p>
                  <ul className="space-y-1.5 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    {feature.bullets.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1D8751]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5">
                    <div className="h-1 w-10 rounded-full bg-[#1D8751] group-hover:w-16 transition-all duration-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 px-4 bg-white dark:bg-[#18181D]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600 dark:text-[#788099] max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] hover:border-[#1D8751] transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#1D8751] to-[#166b3e] mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-[#788099] text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Our Story Section */}

      <section id="story" className="py-20 px-4 bg-white dark:bg-[var(--bg-color)]">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#1D8751]/10 border border-[#1D8751]/30 mb-5">
              <span className="text-xs md:text-sm font-medium text-[#1D8751]">
                Our Journey
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3">
              Our Story
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              From a visionary startup to a global crypto exchange platform
            </p>
          </div>

          {/* Bento Grid Timeline */}
          <div className="relative">
            {/* Center vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gray-300 dark:bg-[#25252F] transform -translate-x-1/2 hidden md:block" />

            {/* Timeline Rows - Use journeySteps.map for all steps */}
            {journeySteps.map((step, index) => (
              <div key={step.year} className="grid md:grid-cols-2 gap-6 mb-6 relative">
                {/* Center dot */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#1D8751] z-10 hidden md:block" />
                {step.align === "right" ? (
                  <>
                    {/* Left - Text Card (Aligned Right) */}
                    <div className="group bg-white dark:bg-linear-to-b dark:from-[#18181D] dark:to-[#0F0F13] border border-border dark:border-accent rounded-2xl p-7 flex flex-col min-h-[200px] max-h-80 items-end text-right transition-all duration-300">
                      <div className="grid grid-cols-[1fr_auto] gap-x-3 mb-3 items-center justify-items-end">
                        <span className="text-4xl md:text-5xl font-bold bg-linear-to-b from-[#1D8751] to-[#309A64] group-hover:from-[#00C950] group-hover:to-[#00BC7D] bg-clip-text text-transparent transition-all duration-300 leading-none">
                          {step.year}
                        </span>
                        <div className="row-span-2 w-15 h-15 rounded-2xl bg-linear-to-b from-[#1D8751] to-[#309A64] group-hover:from-[#00C950] group-hover:to-[#00BC7D] flex items-center justify-center transition-all duration-300 shadow-md">
                          <step.icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-muted-foreground text-sm leading-none">{step.quarter}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1 max-w-md">
                        {step.description}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {step.pills.map((pill) => (
                          <span key={pill} className="px-4 py-2 rounded-full bg-linear-to-b from-[#1D8751] to-[#309A64] group-hover:from-[#00C950] group-hover:to-[#00BC7D] text-white text-xs font-medium transition-all duration-300">
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Right - Image Card */}
                    <div className="relative rounded-3xl overflow-hidden min-h-[320px]">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Left - Image Card */}
                    <div className="relative rounded-3xl overflow-hidden min-h-[320px] order-2 md:order-1">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    {/* Right - Text Card */}
                    <div className="group bg-white dark:bg-linear-to-b dark:from-[#18181D] dark:to-[#0F0F13] border border-border dark:border-accent rounded-2xl p-7 flex flex-col min-h-[200px] max-h-80 items-start text-left transition-all duration-300 order-1 md:order-2">
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 mb-3 items-center justify-items-start">
                        <div className="row-span-2 w-15 h-15 rounded-2xl bg-linear-to-b from-[#1D8751] to-[#309A64] group-hover:from-[#00C950] group-hover:to-[#00BC7D] flex items-center justify-center transition-all duration-300 shadow-md">
                          <step.icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-4xl md:text-5xl font-bold bg-linear-to-b from-[#1D8751] to-[#309A64] group-hover:from-[#00C950] group-hover:to-[#00BC7D] bg-clip-text text-transparent transition-all duration-300 leading-none">
                          {step.year}
                        </span>
                        <span className="text-muted-foreground text-sm leading-none">{step.quarter}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1 max-w-md">
                        {step.description}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-start">
                        {step.pills.map((pill) => (
                          <span key={pill} className="px-4 py-2 rounded-full bg-linear-to-b from-[#1D8751] to-[#309A64] group-hover:from-[#00C950] group-hover:to-[#00BC7D] text-white text-xs font-medium transition-all duration-300">
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Achievements Section - Figma Match */}

      {/* Location Section */}

      {/* Location Section */}
      <section className="py-20 px-4 bg-white dark:bg-[var(--bg-color)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#1D8751]/10 border border-[#1D8751]/30 mb-5 gap-2">
              <Globe className="w-4 h-4 text-[#1D8751]" />
              <span className="text-xs md:text-sm font-medium text-[#1D8751]">
                Global Network
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Our Locations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Operating worldwide with local presence in strategic hubs
            </p>
          </div>

          {/* Statistics Bar - COLORED ICONS AND NUMBERS */}
          <div className="bg-white dark:bg-[#14141A] rounded-2xl p-6 mb-12 border border-gray-200 dark:border-[#1E1E26]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Countries - BLUE */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">150+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Countries</div>
                </div>
              </div>

              {/* Team Members - PURPLE */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">350+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Team Members</div>
                </div>
              </div>

              {/* Support Hours - GREEN */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#1D8751]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Support Hours</div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-linear-to-t dark:from-[#0F0F13] dark:to-[#18181D] border border-border dark:border-accent shadow-2xl transition-all duration-500 hover:shadow-[#1D8751]/10">
              {/* City Image Header */}
              <div className="relative h-[280px] md:h-[300px] overflow-hidden">
                <Image
                  src="/images/Mougadishu.jpeg"
                  alt="Mogadishu"
                  fill
                  className="object-cover transition-transform duration-600 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0F0F13] via-[#0F0F13]/40 to-transparent" />

                {/* Flag Icon */}
                <div className="absolute top-6 left-6 md:top-8 md:left-8">
                  <div className="w-12 h-8 rounded-md overflow-hidden bg-[#4189DD] flex items-center justify-center shadow-lg border border-white/20">
                    <Star className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>

                {/* Headquarters Badge */}
                <div className="absolute top-6 right-6 md:top-8 md:right-8">
                  <div className="px-5 py-2.5 rounded-xl bg-white backdrop-blur-md border border-[#20202A] text-xs font-semibold text-[#1D8751] uppercase tracking-wider">
                    Headquarters
                  </div>
                </div>

                {/* City Name */}
                <div className="absolute bottom-10 left-6 md:left-10">
                  <h3 className="text-4xl md:text-5xl font-bold text-white mb-2">Mogadishu</h3>
                  <p className="text-lg text-gray-300 font-medium">Somalia</p>
                </div>
              </div>

              {/* Card Content Area */}
              <div className="p-8 md:p-12 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                  {/* Local Time */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">GMT+3</div>
                      <div className="text-sm text-muted-foreground font-medium">Local Time</div>
                    </div>
                  </div>

                  {/* Team Size */}
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">20+ Employees</div>
                      <div className="text-sm text-muted-foreground font-medium">Team Size</div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="pt-8 border-t border-border dark:border-[#20202A]">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground font-medium">Address</span>
                      <p className="text-lg md:text-xl text-gray-900 dark:text-white leading-relaxed font-medium">
                        KM4, Taleh, Hodan District, Mogadishu, Somalia
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Rows */}
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-center gap-5 group/item">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Email</div>
                      <a
                        href="mailto:info@omaya.io"
                        className="text-base md:text-lg text-[#1D8751] font-bold hover:underline transition-all"
                      >
                        info@omaya.io
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-5 group/item">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Phone</div>
                      <a
                        href="tel:+252771000777"
                        className="text-base md:text-lg text-gray-900 dark:text-white font-bold hover:text-[#1D8751] transition-colors"
                      >
                        +252771000777
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 px-4 bg-white dark:bg-[var(--bg-color)]">
        <div className="max-w-6xl mx-auto">
          {/* Header - NO ITALIC */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#1D8751]/10 border border-[#1D8751]/30 mb-5 gap-2">
              <Star className="w-4 h-4 text-[#1D8751]" />
              <span className="text-xs md:text-sm font-medium text-[#1D8751]">
                Recognition & Awards
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Our Achievements
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Recognition of our commitment to excellence and innovation
            </p>
          </div>

          {/* Achievement Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Best Crypto Exchange 2023 - Use handshake/team image */}
            <div className="flex flex-col relative w-full min-w-0">
              <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#14141A]">
                <Image
                  src="/assets/Container_9_e1cnzo.png"
                  alt="Best Crypto Exchange"
                  fill
                  className="object-cover rounded-2xl !w-full !h-full"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectPosition: 'center' }}
                />
                <div className="absolute top-2 right-1 sm:top-3 sm:right-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg bg-[#1D8751] text-white text-[10px] sm:text-xs font-medium whitespace-nowrap">2023</div>
                <div className="absolute bottom-3 left-6 w-11 h-11 rounded-xl bg-[#1D8751] flex items-center justify-center z-10">
                  <Award className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="pt-4 pb-4 flex flex-col flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Best Crypto Exchange 2023</h3>
                <div className="inline-flex mb-3">
                  <span className="px-3 py-1 rounded-full border border-[#1D8751]/40 text-[#1D8751] text-xs">Crypto Excellence Awards</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-500 mb-4 flex-1 leading-relaxed">Recognized for outstanding innovation and user experience</p>
                <div className="flex items-center gap-2 text-xs text-[#1D8751]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified & Certified</span>
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-[#1D8751] 
              via-[#22c55e] to-[#eab308]" />
            </div>

            {/* ISO 27001 Certified - Use padlock image */}
            <div className="flex flex-col relative w-full min-w-0">
              <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#14141A]">
                <Image
                  src="/assets/Container_11_tss9j7.png"
                  alt="ISO Certified"
                  fill
                  className="object-cover rounded-2xl !w-full !h-full"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectPosition: 'center' }}
                />
                <div className="absolute top-2 right-1 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg bg-[#1D8751] text-white text-[10px] sm:text-xs font-medium whitespace-nowrap">2022</div>
                <div className="absolute bottom-3 left-4 w-11 h-11 rounded-xl bg-[#1D8751] flex items-center justify-center z-10">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="pt-4 pb-4 flex flex-col flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">ISO 27001 Certified</h3>
                <div className="inline-flex mb-3">
                  <span className="px-3 py-1 rounded-full border border-[#1D8751]/40 text-[#1D8751] text-xs">Information Security Management</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-500 mb-4 flex-1 leading-relaxed">International standard for security management systems</p>
                <div className="flex items-center gap-2 text-xs text-[#1D8751]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified & Certified</span>
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-[#1D8751] via-[#22c55e] to-[#eab308]" />
            </div>

            {/* Trusted by 50K+ Users - Use handshake image */}
            <div className="flex flex-col relative w-full min-w-0">
              <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#14141A]">
                <Image
                  src="/assets/Container_5_aj1cpq.png"
                  alt="Trusted Users"
                  fill
                  className="object-cover rounded-2xl !w-full !h-full"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectPosition: 'center' }}
                />
                <div className="absolute top-2 right-1 sm:top-3 sm:right-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg bg-[#1D8751] text-white text-[10px] sm:text-xs font-medium whitespace-nowrap">2024</div>
                <div className="absolute bottom-3 left-6 w-11 h-11 rounded-xl bg-[#1D8751] flex items-center justify-center z-10">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="pt-4 pb-4 flex flex-col flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Trusted by 50K+ Users</h3>
                <div className="inline-flex mb-3">
                  <span className="px-3 py-1 rounded-full border border-[#1D8751]/40 text-[#1D8751] text-xs">Growing community worldwide</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-500 mb-4 flex-1 leading-relaxed">Building trust through transparency and reliability</p>
                <div className="flex items-center gap-2 text-xs text-[#1D8751]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified & Certified</span>
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-[#1D8751] via-[#22c55e] to-[#eab308]" />
            </div>
          </div>

          {/* Statistics Bar - NUMBERS ARE GREEN */}
          <div className="rounded-2xl p-6 border border-gray-200 dark:border-[#1E1E26] bg-transparent">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1D8751] mb-1">12+</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Security Audits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1D8751] mb-1">5+</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Industry Awards</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1D8751] mb-1">3+</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Certifications</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1D8751] mb-1">4+</div>
                <div className="text-xs text-gray-600 dark:text-gray-500">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      {/* Security Section - Figma Match */}



      {/* Security Section - Figma Match */}

      {/* Security Section */}
      <section className="py-10 sm:py-16 md:py-20 px-4 bg-white dark:bg-(--bg-color)">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Left Column - Padlock Image - NO OVERLAY (image has badge baked in) */}
            <div className="relative">
              <div className="relative w-full h-[400px] overflow-hidden">
                <Image
                  src="/assets/Container_11_tss9j7.png"
                  alt="Security Padlock"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* NO 99.9% BADGE HERE - the image already contains it */}
              </div>
            </div>

            {/* Right Column - Content */}
            <div>
              {/* Enterprise Security Badge */}
              <div className="inline-flex mb-4">
                <span className="px-4 py-1.5 rounded-full bg-[#1D8751]/10 border border-[#1D8751]/30 text-[#1D8751] text-sm font-medium">
                  Enterprise Security
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">
                Your Assets Are Always
              </h2>
              <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
                Safe
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm leading-relaxed">
                We employ industry-leading security measures to protect your digital assets and personal information.
              </p>

              {/* Security Features Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A35] bg-white dark:bg-[#14141A]">
                  <div className="w-10 h-10 rounded-xl bg-[#1D8751]/10 border border-[#1D8751]/30 flex items-center justify-center flex-shrink-0 mb-2">
                    <Lock className="w-5 h-5 text-[#1D8751]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Cold Storage</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-500 leading-relaxed">95% of assets stored offline in bank-grade vaults.</p>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A35] bg-white dark:bg-[#14141A]">
                  <div className="w-10 h-10 rounded-xl bg-[#1D8751]/10 border border-[#1D8751]/30 flex items-center justify-center flex-shrink-0 mb-2">
                    <ShieldCheck className="w-5 h-5 text-[#1D8751]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Multi-Signature</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-500 leading-relaxed">Multiple approvals required for all transactions.</p>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A35] bg-white dark:bg-[#14141A]">
                  <div className="w-10 h-10 rounded-xl bg-[#1D8751]/10 border border-[#1D8751]/30 flex items-center justify-center flex-shrink-0 mb-2">
                    <Fingerprint className="w-5 h-5 text-[#1D8751]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Biometric Auth</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-500 leading-relaxed">Face ID and fingerprint recognition.</p>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A35] bg-white dark:bg-[#14141A]">
                  <div className="w-10 h-10 rounded-xl bg-[#1D8751]/10 border border-[#1D8751]/30 flex items-center justify-center flex-shrink-0 mb-2">
                    <Eye className="w-5 h-5 text-[#1D8751]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5">24/7 Monitoring</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-500 leading-relaxed">Real-time threat detection and prevention.</p>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A35] bg-white dark:bg-[#14141A]">
                  <div className="w-10 h-10 rounded-xl bg-[#1D8751]/10 border border-[#1D8751]/30 flex items-center justify-center flex-shrink-0 mb-2">
                    <Key className="w-5 h-5 text-[#1D8751]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5">2FA Protection</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-500 leading-relaxed">Two-factor authentication on all accounts.</p>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A35] bg-white dark:bg-[#14141A]">
                  <div className="w-10 h-10 rounded-xl bg-[#1D8751]/10 border border-[#1D8751]/30 flex items-center justify-center flex-shrink-0 mb-2">
                    <FileLock className="w-5 h-5 text-[#1D8751]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Data Encryption</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-500 leading-relaxed">Military-grade SSL encryption.</p>
                  </div>
                </div>
              </div>
              {/* CTA Button */}
              <button
                type="button"
                onClick={handleSecurityClick}
                className="inline-block px-6 py-3 bg-[#1D8751] text-white text-sm font-semibold rounded-full hover:bg-[#166b3e] transition-all duration-300 cursor-pointer"
              >
                Learn About Our Security
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Why Choose Us Section */}
      <section className="py-16 px-4 bg-white dark:bg-[#18181D]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose OMAYA?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1D8751]/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[#1D8751]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Advanced Security
              </h3>
              <p className="text-gray-600 dark:text-[#788099]">
                Multi-signature wallets, cold storage, and 2FA protection keep your
                assets safe with industry-leading security measures.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1D8751]/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-[#1D8751]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Lightning Speed
              </h3>
              <p className="text-gray-600 dark:text-[#788099]">
                Experience instant deposits, withdrawals, and trades with our
                high-performance infrastructure and optimized transaction processing.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1D8751]/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#1D8751]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                24/7 Support
              </h3>
              <p className="text-gray-600 dark:text-[#788099]">
                Our dedicated support team is always available to help you with
                any questions or issues, ensuring smooth trading experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black relative overflow-hidden">
        {/* Glowing green light effect from top-left */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#1D8751]/10 via-[#22c55e]/5 to-transparent dark:from-[#1D8751]/20 dark:via-[#22c55e]/10 dark:to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />


        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center">
            {/* Join the Revolution Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1D8751] bg-[#1D8751]/5 dark:bg-[#1D8751]/10 mb-8">
              <Rocket className="w-4 h-4 text-[#1D8751]" />
              <span className="text-sm font-medium text-[#1D8751]">Join the Revolution</span>
            </div>
            {/* Main Headline - "Trading?" in green */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
              <span className="text-gray-900 dark:text-white">Ready to Start </span>
              <span className="bg-gradient-to-r from-[#1D8751] via-[#22c55e] to-[#1D8751] bg-clip-text text-transparent">Trading?</span>
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl mb-10 text-gray-700 dark:text-white/90 max-w-2xl mx-auto">
              Join thousands of traders who trust OMAYA.io for their digital asset needs
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href="/auth/register"
                className="group relative px-8 py-3 bg-gradient-to-r from-[#1D8751] via-[#22c55e] to-[#1D8751] text-white rounded-xl font-semibold hover:from-[#22c55e] hover:via-[#1D8751] hover:to-[#166b3e] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-[#1D8751]/25 dark:shadow-[#1D8751]/20 dark:hover:shadow-[#1D8751]/30"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/contactUs"
                className="px-8 py-3 bg-transparent border-2 border-[#1D8751] text-[#1D8751] dark:text-white rounded-xl font-semibold hover:bg-[#1D8751]/10 dark:hover:bg-[#1D8751]/20 transition-colors"
              >
                Learn More
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-700 dark:text-white">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#1D8751] to-[#22c55e]" />
                <span className="text-sm md:text-base">50K+ Active Users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#1D8751] to-[#22c55e]" />
                <span className="text-sm md:text-base">
                  {t("marketing.aboutPage.trust.totalVolume", "100M+ Total Volume")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#1D8751] to-[#22c55e]" />
                <span className="text-sm md:text-base">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

