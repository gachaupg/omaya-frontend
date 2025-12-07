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
} from "lucide-react";

const AboutPage = () => {
  const tradingSolutions = [
    {
      title: "Money X",
      description:
        "Direct peer-to-peer trading with multiple payment methods and currencies.",
      icon: Zap,
    },
    {
      title: "P2P Exchange",
      description:
        "Direct peer-to-peer trading with multiple payment methods and currencies.",
      icon: Users,
    },
    {
      title: "Forex Trading",
      description:
        "Access global forex markets with competitive spreads and leverage.",
      icon: Globe,
    },
    {
      title: "Express Swap",
      description:
        "Instant cryptocurrency swaps with the best available exchange rates.",
      icon: Zap,
    },
    {
      title: "Secure Wallet",
      description:
        "Multi-signature wallets with cold storage for maximum security.",
      icon: Shield,
    },
    {
      title: "Staking & Rewards",
      description:
        "Earn passive income through staking and liquidity provision.",
      icon: Award,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F11]">
      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 px-4 overflow-hidden bg-white dark:bg-[#0F0F11]">
        {/* Background particles effect */}
        <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D8751]/10 via-transparent to-[#1D8751]/5"></div>
          {/* Green particles */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-[#1D8751] rounded-full opacity-30 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            {/* Welcome Banner */}
            <div className="inline-block mb-8">
              <div className="px-4 py-2 rounded-3xl bg-[#1D8751]/20 border border-[#1D8751]/30">
                <p className="text-sm md:text-base text-[#1D8751] font-medium">
                  Welcome to OMAYA Exchange
                </p>
              </div>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-gray-900 dark:text-white">About</span>{" "}
              <span className="text-[#1D8751]">OMAYA Exchange</span>
            </h1>
            
            {/* Tagline */}
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
              Leading the future of digital asset exchange with innovation, security, and trust
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="#story"
                className="relative px-8 py-3 bg-[#1D8751] text-white font-semibold hover:bg-[#166b3e] transition-all duration-300 shadow-lg shadow-[#1D8751]/20 hover:shadow-[#1D8751]/40"
                style={{ borderRadius: '2rem' }}
              >
                Explore Our Journey
              </a>
              <a
                href="/contactUs"
                className="px-8 py-3 bg-transparent border-2 border-[#1D8751] text-[#1D8751] font-semibold hover:bg-[#1D8751]/10 transition-all duration-300"
                style={{ borderRadius: '2rem' }}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trading Solutions Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0F0F11] dark:via-[#060608] dark:to-[#050507]">
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
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
                  className="group relative overflow-hidden rounded-3xl bg-white dark:bg-[#14141A] border border-gray-200 dark:border-[#20202A] hover:border-[#1D8751] transition-all duration-300 hover:-translate-y-1"
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
      <section className="py-16 px-4 bg-white dark:bg-[#0F0F11]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Mission Content */}
            <div>
              {/* Mission Banner */}
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-[#18181D] border border-[#1D8751]/30 mb-8" style={{ borderRadius: '2rem' }}>
                <div className="w-8 h-8 rounded-full bg-[#1D8751]/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-[#1D8751]" />
                </div>
                <span className="text-sm font-medium text-[#1D8751]">Our Mission</span>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Accessible</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">For Everyone</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Secure</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank-Grade</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Efficient</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lightning Fast</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Global</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">150+ Countries</p>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative">
              <div className="relative w-full h-[600px] rounded-3xl overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/pitz/image/upload/v1764574482/Container_ihax20.png"
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
      <section className="py-16 px-4 bg-gray-50 dark:bg-[#0F0F11]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Image */}
            <div className="relative order-2 md:order-1">
              <div className="relative w-full h-[600px] rounded-3xl overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/pitz/image/upload/v1764574805/Container_2_yazuhu.png"
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
                className="inline-flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-[#18181D] border border-[#1D8751]/30 mb-8"
                style={{ borderRadius: "2rem" }}
              >
                <div className="w-8 h-8 rounded-full bg-[#1D8751]/20 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-[#1D8751]" />
                </div>
                <span className="text-sm font-medium text-[#1D8751]">Our Vision</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                <span className="block">The Future of Digital</span>
                <span className="block">Finance</span>
                </h2>

              {/* Description Paragraphs */}
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                To become the world's most trusted and innovative digital asset exchange
                platform, setting new standards for security, transparency, and user
                experience.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                We envision a future where blockchain technology and traditional finance
                seamlessly integrate, creating unprecedented opportunities for wealth
                creation and financial freedom.
              </p>

              {/* Vision Feature Boxes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Innovation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cutting-Edge Tech</p>
              </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Trust</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transparent</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Integration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Seamless</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#20202A]">
                  <h3 className="text-xl font-bold text-[#1D8751] mb-2">Freedom</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Financial Liberty</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0F0F11] dark:via-[#060608] dark:to-[#050507]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#1D8751]/10 border border-[#1D8751]/30 mb-5">
              <span className="text-xs md:text-sm font-medium text-[#1D8751]">
                Platform Features
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose OMAYA Exchange?
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
                  className="group relative rounded-3xl bg-white dark:bg-[#14141A] border border-gray-200 dark:border-[#20202A] hover:border-[#1D8751] transition-all duration-300 p-6 flex flex-col"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#1D8751]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#1D8751]" />
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
                  <Icon className="w-10 h-10 text-[#1D8751] mb-4" />
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
      <section id="story" className="py-20 px-4 bg-gray-50 dark:bg-[#050507]">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#1D8751]/10 border border-[#1D8751]/30 mb-4">
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

          {/* Intro Story Card */}
          <div className="mb-12 rounded-3xl bg-white dark:bg-[#0F0F11] border border-gray-200 dark:border-[#20202A] p-8 md:p-10 text-gray-700 dark:text-gray-300 leading-relaxed shadow-lg dark:shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <p className="mb-4">
              Founded in 2020, OMAYA Exchange emerged from a vision to revolutionize the way
              people interact with digital assets. Our founders, seasoned professionals from
              both traditional finance and blockchain technology, recognized the need for a
              platform that combines the best of both worlds.
            </p>
            <p className="mb-4">
              What started as a small team of passionate innovators has grown into a global
              platform serving hundreds of thousands of users across 150+ countries. We&apos;ve
              processed billions in transactions while maintaining an unwavering commitment to
              security, transparency, and user satisfaction.
              </p>
              <p>
                Today, OMAYA Exchange stands at the forefront of the digital asset revolution, 
                offering comprehensive trading solutions including spot trading, P2P exchange, 
                forex trading, and express swaps. Our commitment to innovation drives us to 
                continuously improve and expand our services.
              </p>
            </div>

          {/* Timeline */}
          <div className="relative max-w-6xl mx-auto">
            {/* Vertical line (desktop) */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 dark:bg-[#1D8751]/30" />

            <div className="space-y-10">
              {/* 2020 Row */}
              <div className="relative grid md:grid-cols-2 gap-8 items-stretch">
                {/* Center dot */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-50 dark:bg-[#050507] border border-[#1D8751] shadow-[0_0_25px_rgba(29,135,81,0.8)]" />

                {/* 2020 Text Card */}
                <div className="rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-[#101017] dark:to-[#050507] border border-gray-200 dark:border-[#20202A] p-8 text-gray-900 dark:text-white flex flex-col">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs font-semibold">
                      2020
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-[#18181D] text-gray-600 dark:text-gray-400 text-xs">
                      Q1
                    </span>
          </div>
                  <h3 className="text-2xl font-semibold mb-2">Foundation</h3>
                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
                    OMAYA Exchange was founded by crypto pioneers and fintech experts with a
                    vision to revolutionize digital asset trading.
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      10 Cryptocurrencies
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      Beta Launch
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      1,000+ Users
                    </span>
        </div>
        </div>

                {/* 2020 Image */}
                <div className="relative h-64 md:h-72 rounded-3xl overflow-hidden">
                  <Image
                    src="https://res.cloudinary.com/pitz/image/upload/v1764575266/Container_9_e1cnzo.png"
                    alt="OMAYA Exchange foundation"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
          </div>

              {/* 2021 Row */}
              <div className="relative grid md:grid-cols-2 gap-8 items-stretch">
                {/* Center dot */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#050507] border border-[#1D8751] shadow-[0_0_25px_rgba(29,135,81,0.8)]" />

                {/* 2021 Image */}
                <div className="relative h-64 md:h-72 rounded-3xl overflow-hidden md:order-1 order-2">
                  <Image
                    src="https://res.cloudinary.com/pitz/image/upload/v1764575158/Container_5_aj1cpq.png"
                    alt="Global growth"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* 2021 Text Card */}
                <div className="rounded-3xl bg-gradient-to-br from-[#101017] to-[#050507] border border-[#20202A] p-8 text-white flex flex-col md:order-2 order-1">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs font-semibold">
                      2021
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#18181D] text-gray-400 text-xs">
                      Q3
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Rapid Growth</h3>
                  <p className="text-sm md:text-base text-gray-300 mb-4">
                    Expanded to 50 countries and reached 10,000 active users with enhanced
                    trading features and mobile app launch.
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      50 Countries
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      $100M+ Volume
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      10K+ Users
                    </span>
              </div>
          </div>
        </div>

              {/* 2022 Row */}
              <div className="relative grid md:grid-cols-2 gap-8 items-stretch">
                {/* Center dot */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-50 dark:bg-[#050507] border border-[#1D8751] shadow-[0_0_25px_rgba(29,135,81,0.8)]" />

                {/* 2022 Text Card */}
                <div className="rounded-3xl bg-gradient-to-br from-white to-gray-50 dark:from-[#101017] dark:to-[#050507] border border-gray-200 dark:border-[#20202A] p-8 text-gray-900 dark:text-white flex flex-col">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs font-semibold">
                      2022
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-[#18181D] text-gray-600 dark:text-gray-400 text-xs">
                      Q2
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Global Expansion</h3>
                  <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4">
                    Reached 150+ countries with 24/7 multilingual support and introduced P2P
                    trading and staking features.
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      150+ Countries
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      200+ Coins
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      15 Languages
                    </span>
          </div>
          </div>

                {/* 2022 Image */}
                <div className="relative h-64 md:h-72 rounded-3xl overflow-hidden">
                  <Image
                    src="https://res.cloudinary.com/pitz/image/upload/v1764575156/Container_7_ffwiyh.png"
                    alt="Blockchain expansion"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                    </div>
                  </div>

              {/* 2023 Row */}
              <div className="relative grid md:grid-cols-2 gap-8 items-stretch">
                {/* Center dot */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#050507] border border-[#1D8751] shadow-[0_0_25px_rgba(29,135,81,0.8)]" />

                {/* 2023 Image */}
                <div className="relative h-64 md:h-72 rounded-3xl overflow-hidden md:order-1 order-2">
                  <Image
                    src="https://res.cloudinary.com/pitz/image/upload/v1764575266/Container_8_c6iouu.png"
                    alt="Industry recognition"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* 2023 Text Card */}
                <div className="rounded-3xl bg-gradient-to-br from-[#101017] to-[#050507] border border-[#20202A] p-8 text-white flex flex-col md:order-2 order-1">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs font-semibold">
                      2023
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#18181D] text-gray-400 text-xs">
                      Q4
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Industry Recognition</h3>
                  <p className="text-sm md:text-base text-gray-300 mb-4">
                    Won Best Crypto Exchange Award and achieved ISO 27001 certification for
                    information security management.
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      50K+ Traders
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      ISO Certified
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#1D8751]/10 text-[#1D8751] text-xs border border-[#1D8751]/30">
                      Best Exchange
                    </span>
              </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 px-4 bg-white dark:bg-[#0F0F11]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Our Achievements
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Recognition of our commitment to excellence and innovation
            </p>
          </div>

          {/* Achievement Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Best Crypto Exchange 2023 */}
            <div className="bg-gray-50 dark:bg-[#18181D] rounded-3xl overflow-hidden border border-gray-200 dark:border-[#20202A]">
              <div className="relative h-48 bg-gradient-to-br from-amber-600 to-amber-800">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800')] bg-cover bg-center opacity-60"></div>
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-gray-50/80 dark:bg-[#18181D]/80 backdrop-blur-sm text-gray-900 dark:text-white text-sm font-medium">
                  2023
                </div>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-[#1D8751]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Best Crypto Exchange 2023
              </h3>
                <div className="inline-block px-3 py-1 rounded-full bg-[#1D8751]/20 border border-[#1D8751]/30 text-[#1D8751] text-xs font-medium mb-3">
                  Crypto Excellence Awards
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Recognized for outstanding innovation and user experience
                </p>
                <div className="flex items-center gap-2 text-sm text-[#1D8751]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Verified & Certified</span>
            </div>
              </div>
            </div>

            {/* ISO 27001 Certified */}
            <div className="bg-gray-50 dark:bg-[#18181D] rounded-3xl overflow-hidden border border-gray-200 dark:border-[#20202A]">
              <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-900">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800')] bg-cover bg-center opacity-60"></div>
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-gray-50/80 dark:bg-[#18181D]/80 backdrop-blur-sm text-gray-900 dark:text-white text-sm font-medium">
                  2022
                </div>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#1D8751]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                ISO 27001 Certified
              </h3>
                <div className="inline-block px-3 py-1 rounded-full bg-[#1D8751]/20 border border-[#1D8751]/30 text-[#1D8751] text-xs font-medium mb-3">
                Information Security Management
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  International standard for security management systems
              </p>
                <div className="flex items-center gap-2 text-sm text-[#1D8751]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Verified & Certified</span>
            </div>
              </div>
            </div>

            {/* Trusted by 50K+ Users */}
            <div className="bg-gray-50 dark:bg-[#18181D] rounded-3xl overflow-hidden border border-gray-200 dark:border-[#20202A]">
              <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800')] bg-cover bg-center opacity-60"></div>
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-gray-50/80 dark:bg-[#18181D]/80 backdrop-blur-sm text-gray-900 dark:text-white text-sm font-medium">
                  2024
                </div>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#1D8751]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Trusted by 50K+ Users
              </h3>
                <div className="inline-block px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-medium mb-3">
                Growing community worldwide
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Building trust through transparency and reliability
                </p>
                <div className="flex items-center gap-2 text-sm text-[#1D8751]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Verified & Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Bar */}
          <div className="bg-gray-50 dark:bg-[#18181D] rounded-3xl p-6 border border-gray-200 dark:border-[#20202A]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">12+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Security Audits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">5+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Industry Awards</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">3+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Certifications</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">4+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-[#0F0F11]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Padlock Image */}
            <div className="relative">
              <div className="relative w-full h-[500px] rounded-3xl overflow-hidden bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#20202A] flex items-center justify-center">
                <Image
                  src="https://res.cloudinary.com/pitz/image/upload/v1764575591/Container_11_tss9j7.png"
                  alt="Security Padlock"
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Security Rate Indicator */}
                <div className="absolute top-6 right-6 px-4 py-2 rounded-2xl bg-white dark:bg-[#18181D] border border-gray-200 dark:border-[#1D8751]/30 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#1D8751]" />
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">99.9%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Security Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Security Features */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                <span className="block">Your Assets Are Always</span>
                <span className="block text-[#1D8751]">Safe</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                We employ industry-leading security measures to protect your digital assets and personal information.
              </p>

              {/* Security Features Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#1D8751]/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Cold Storage</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">95% of assets stored offline in bank-grade vaults.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#1D8751]/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Multi-Signature</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Multiple approvals required for all transactions.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#1D8751]/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center flex-shrink-0">
                      <Fingerprint className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Biometric Auth</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Face ID and fingerprint recognition.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#1D8751]/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">24/7 Monitoring</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Real-time threat detection and prevention.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#1D8751]/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center flex-shrink-0">
                      <Key className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">2FA Protection</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Two-factor authentication on all accounts.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#1D8751]/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center flex-shrink-0">
                      <FileLock className="w-6 h-6 text-[#1D8751]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Data Encryption</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Military-grade SSL encryption.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <a
                href="/security"
                className="inline-block px-8 py-4 bg-[#1D8751] text-white font-semibold rounded-2xl hover:bg-[#166b3e] transition-all duration-300 shadow-lg shadow-[#1D8751]/20"
              >
                Learn About Our Security
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-20 px-4 bg-white dark:bg-[#0F0F11] relative overflow-hidden">
        {/* Subtle green glow at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#1D8751]/10 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Our Locations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Operating worldwide with local presence
            </p>
          </div>

          {/* Statistics Bar */}
          <div className="bg-gray-50 dark:bg-[#18181D] rounded-3xl p-6 mb-12 border border-gray-200 dark:border-[#20202A]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-[#1D8751]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">150+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Countries</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1D8751]/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#1D8751]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">350+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Team Members</div>
                </div>
              </div>
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

          {/* Location Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Dubai Headquarters */}
            <div className="bg-gray-50 dark:bg-[#18181D] rounded-3xl overflow-hidden border border-gray-200 dark:border-[#20202A]">
              {/* Image Section */}
              <div className="relative h-64 bg-gradient-to-br from-blue-400 to-blue-600">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800')] bg-cover bg-center opacity-80"></div>
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-lg">🇦🇪</span>
                </div>
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-[#1D8751] text-white text-sm font-medium">
                Headquarters
                </div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-3xl font-bold text-white mb-1">Dubai</h3>
                  <p className="text-gray-300">United Arab Emirates</p>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Local Time</p>
                    <p className="text-gray-900 dark:text-white font-medium">GMT+4</p>
                </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Team Size</p>
                    <p className="text-gray-900 dark:text-white font-medium">200+ Employees</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                    <p className="text-gray-900 dark:text-white font-medium">123 Blockchain Avenue, Financial District</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white font-medium">support@omaya.io</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white font-medium">+971 4 123 4567</p>
                  </div>
                </div>
              </div>
            </div>

            {/* San Francisco Regional Office */}
            <div className="bg-gray-50 dark:bg-[#18181D] rounded-3xl overflow-hidden border border-gray-200 dark:border-[#20202A]">
              {/* Image Section */}
              <div className="relative h-64 bg-gradient-to-br from-orange-400 to-pink-500">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800')] bg-cover bg-center opacity-80"></div>
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-lg">🇺🇸</span>
                </div>
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-[#1D8751] text-white text-sm font-medium">
                Regional Office
                </div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-3xl font-bold text-white mb-1">San Francisco</h3>
                  <p className="text-gray-300">United States</p>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Local Time</p>
                    <p className="text-gray-900 dark:text-white font-medium">PST (GMT-8)</p>
                </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Team Size</p>
                    <p className="text-gray-900 dark:text-white font-medium">150+ Employees</p>
                </div>
              </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                    <p className="text-gray-900 dark:text-white font-medium">456 Tech Hub Street, Silicon Valley, CA 94102</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white font-medium">us@omaya.io</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#1D8751] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white font-medium">+1 (415) 123-4567</p>
                  </div>
                </div>
              </div>
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
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#1D8751] to-[#166b3e] rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of traders who trust OMAYA Exchange for their digital asset needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="px-8 py-3 bg-white text-[#1D8751] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Create Account
              </a>
              <a
                href="/contactUs"
                className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

