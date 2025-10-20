"use client";

import React from "react";
import { tokens } from "@/styles/tokens";
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
  Phone
} from "lucide-react";

const AboutPage = () => {
  const stats = [
    { label: "Active Users", value: "50,000+", icon: Users },
    { label: "Daily Transactions", value: "$10M+", icon: Zap },
    { label: "Countries Served", value: "150+", icon: Globe },
    { label: "Security Rate", value: "99.9%", icon: Shield },
  ];

  const teamMembers = [
    {
      name: "John Doe",
      role: "CEO & Founder",
      image: "https://via.placeholder.com/150",
      bio: "10+ years in fintech and blockchain",
    },
    {
      name: "Jane Smith",
      role: "CTO",
      image: "https://via.placeholder.com/150",
      bio: "Former lead engineer at major exchanges",
    },
    {
      name: "Mike Johnson",
      role: "Head of Security",
      image: "https://via.placeholder.com/150",
      bio: "Cybersecurity expert with 15+ years experience",
    },
    {
      name: "Sarah Williams",
      role: "Head of Operations",
      image: "https://via.placeholder.com/150",
      bio: "Scaled operations for top crypto platforms",
    },
  ];

  const testimonials = [
    {
      name: "Alex Thompson",
      role: "Crypto Trader",
      image: "https://via.placeholder.com/80",
      rating: 5,
      text: "OMAYA Exchange has been my go-to platform for crypto trading. The P2P feature is seamless and the customer support is outstanding. Highly recommended!",
    },
    {
      name: "Maria Garcia",
      role: "Forex Investor",
      image: "https://via.placeholder.com/80",
      rating: 5,
      text: "The forex trading features are exceptional. Fast execution, competitive rates, and a user-friendly interface. Best exchange I've used!",
    },
    {
      name: "David Chen",
      role: "Day Trader",
      image: "https://via.placeholder.com/80",
      rating: 5,
      text: "Security and reliability are top-notch. I've been trading here for over a year and never had any issues. The platform just works!",
    },
    {
      name: "Emma Wilson",
      role: "Long-term Investor",
      image: "https://via.placeholder.com/80",
      rating: 5,
      text: "OMAYA's express exchange feature saves me so much time. Quick, reliable, and transparent pricing. Couldn't ask for more!",
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
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D8751]/10 via-transparent to-[#1D8751]/5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              About <span className="text-[#1D8751]">OMAYA Exchange</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-[#788099] max-w-3xl mx-auto">
              Leading the future of digital asset exchange with innovation, security, and trust
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-white dark:bg-[#18181D]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] hover:shadow-lg transition-shadow"
                >
                  <Icon className="w-10 h-10 mx-auto mb-3 text-[#1D8751]" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-[#788099]">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-white dark:bg-[#18181D] rounded-2xl p-8 border border-gray-200 dark:border-[#35353E]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#1D8751]/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#1D8751]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Our Mission
                </h2>
              </div>
              <p className="text-gray-600 dark:text-[#788099] leading-relaxed">
                To democratize access to digital asset trading by providing a secure, 
                efficient, and user-friendly platform that empowers individuals and 
                businesses worldwide to participate in the digital economy. We strive 
                to break down barriers and make cryptocurrency trading accessible to 
                everyone, regardless of their location or experience level.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white dark:bg-[#18181D] rounded-2xl p-8 border border-gray-200 dark:border-[#35353E]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#1D8751]/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-[#1D8751]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Our Vision
                </h2>
              </div>
              <p className="text-gray-600 dark:text-[#788099] leading-relaxed">
                To become the world's most trusted and innovative digital asset 
                exchange platform, setting new standards for security, transparency, 
                and user experience. We envision a future where blockchain technology 
                and traditional finance seamlessly integrate, creating unprecedented 
                opportunities for wealth creation and financial freedom.
              </p>
            </div>
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
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-[#18181D] rounded-2xl p-8 md:p-12 border border-gray-200 dark:border-[#35353E]">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-[#788099] leading-relaxed">
              <p>
                Founded in 2020, OMAYA Exchange emerged from a vision to revolutionize 
                the way people interact with digital assets. Our founders, seasoned 
                professionals from both traditional finance and blockchain technology, 
                recognized the need for a platform that combines the best of both worlds.
              </p>
              <p>
                What started as a small team of passionate innovators has grown into a 
                global platform serving hundreds of thousands of users across 150+ countries. 
                We've processed billions in transactions while maintaining an unwavering 
                commitment to security, transparency, and user satisfaction.
              </p>
              <p>
                Today, OMAYA Exchange stands at the forefront of the digital asset revolution, 
                offering comprehensive trading solutions including spot trading, P2P exchange, 
                forex trading, and express swaps. Our commitment to innovation drives us to 
                continuously improve and expand our services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-white dark:bg-[#18181D]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-gray-600 dark:text-[#788099] max-w-2xl mx-auto">
              Led by industry experts with decades of combined experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-[#23232B] rounded-2xl p-6 border border-gray-200 dark:border-[#35353E] hover:shadow-lg transition-all"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-[#1D8751]"
                />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-1">
                  {member.name}
                </h3>
                <p className="text-[#1D8751] text-sm text-center mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 dark:text-[#788099] text-sm text-center">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-gray-600 dark:text-[#788099] max-w-2xl mx-auto">
              Trusted by thousands of traders worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#18181D] rounded-2xl p-6 border border-gray-200 dark:border-[#35353E] hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full border-2 border-[#1D8751]"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-[#788099]">
                      {testimonial.role}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4 text-[#FFB800] fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-[#788099] leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 px-4 bg-white dark:bg-[#18181D]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Achievements
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] text-center">
              <Award className="w-12 h-12 text-[#1D8751] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Best Crypto Exchange 2023
              </h3>
              <p className="text-gray-600 dark:text-[#788099] text-sm">
                Awarded by Crypto Excellence Awards
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] text-center">
              <Shield className="w-12 h-12 text-[#1D8751] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ISO 27001 Certified
              </h3>
              <p className="text-gray-600 dark:text-[#788099] text-sm">
                Information Security Management
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#23232B] border border-gray-200 dark:border-[#35353E] text-center">
              <Users className="w-12 h-12 text-[#1D8751] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Trusted by 50K+ Users
              </h3>
              <p className="text-gray-600 dark:text-[#788099] text-sm">
                Growing community worldwide
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Locations
            </h2>
            <p className="text-gray-600 dark:text-[#788099] max-w-2xl mx-auto">
              Visit us or get in touch
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Headquarters */}
            <div className="bg-white dark:bg-[#18181D] rounded-2xl p-8 border border-gray-200 dark:border-[#35353E]">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1D8751]" />
                Headquarters
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 dark:text-[#788099]">
                    123 Blockchain Avenue
                    <br />
                    Financial District
                    <br />
                    Dubai, UAE
                  </p>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-[#788099]">
                  <Mail className="w-5 h-5 text-[#1D8751]" />
                  <span>support@omaya.io</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-[#788099]">
                  <Phone className="w-5 h-5 text-[#1D8751]" />
                  <span>+971 4 123 4567</span>
                </div>
              </div>
            </div>

            {/* Regional Office */}
            <div className="bg-white dark:bg-[#18181D] rounded-2xl p-8 border border-gray-200 dark:border-[#35353E]">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1D8751]" />
                Regional Office
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 dark:text-[#788099]">
                    456 Tech Hub Street
                    <br />
                    Silicon Valley
                    <br />
                    San Francisco, CA 94102, USA
                  </p>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-[#788099]">
                  <Mail className="w-5 h-5 text-[#1D8751]" />
                  <span>us@omaya.io</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-[#788099]">
                  <Phone className="w-5 h-5 text-[#1D8751]" />
                  <span>+1 (415) 123-4567</span>
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

