import Link from "next/link";
import Image from "next/image";
import { tokens } from "@/styles/tokens";
import {
  Youtube,
  Facebook,
  Instagram,
  PhoneIcon as WhatsApp,
  Twitter,
} from "lucide-react";

// Custom Telegram Icon Component
const TelegramIcon = ({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.11 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.13-.02.2z" />
  </svg>
);

// Custom TikTok Icon Component
const TikTokIcon = ({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.35V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// Custom Snapchat Icon Component
const SnapchatIcon = ({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
  </svg>
);

export default function Footer() {
  const { primary } = tokens.colors.brand;
  const { textTitle, textBody, background, card } = tokens.colors.dark;

  return (
    <footer className="relative z-40 pt-10 pb-4 bg-[#18181D] text-[#788099]">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-8 border-b border-gray-700">
          {/* Logo and Social Media Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/">
              <Image
                src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746548004/Omaya-green_g7uk8r.png"
                alt="OMAYA Exchange"
                width={150}
                height={40}
                style={{ height: 'auto' }}
                className="h-auto"
              />
            </Link>
            <div className="space-y-5 mt-4">
              <p className="text-sm text-white">Follow us on:</p>
              <div className="flex flex-wrap items-center gap-5">
                <a
                  href="https://t.me/omayaexchange"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1D8751] text-white"
                  title="Telegram"
                >
                  <TelegramIcon size={20} />
                </a>
                <a href="https://www.youtube.com/@OMAYAExchange" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D8751] text-white" title="YouTube">
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a href="https://www.facebook.com/OMAYAExchange" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D8751] text-white" title="Facebook">
                  <svg 
                   xmlns="http://www.w3.org/2000/svg"
                   width={20}
                   height={20} 
                   viewBox="0 0 16 16">
                   <path 
                   fill="currentColor" 
                   d="M7.2 16V8.5h-2V5.8h2V3.5C7.2 1.7 8.4 0 11.1 0c1.1 0 1.9.1 1.9.1l-.1 2.5h-1.7c-1 0-1.1.4-1.1 1.2v2H13l-.1 2.7h-2.8V16H7.2z"/>
                   </svg>
                </a>
                <a href="https://www.instagram.com/OMAYAExchange/" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D8751] text-white" title="Instagram">
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
              <div className="flex space-x-4 items-center">
                <a href="https://api.whatsapp.com/send/?phone=252611273030&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D8751] text-white" title="WhatsApp">
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
                  </svg>
                </a>
                <a href="https://www.snapchat.com/@omayaexchange?sender_web_id=1c0b0880-bc36-4c50-b300-d9b32e5bc4af&device_type=desktop&is_copy_url=true" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D8751] text-white" title="Snapchat">
                  <SnapchatIcon size={20} />
                </a>
                <a href="https://x.com/omayaexchange" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D8751] text-white" title="Twitter / X">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width={20}
                    height={20} 
                    viewBox="0 0 18 18"
                    >
                    <path 
                    fill="currentColor" 
                    fillRule="evenodd" 
                    d="M15.8 2.76a1 1 0 0 1 .095 1.19a7 7 0 0 1-1.27 1.5c-.035 4.36-3.21 9.54-9.17 9.54a8.8 8.8 0 0 1-4.97-1.53a.998.998 0 0 1 .687-1.817q.274.036.552.034h.008c.41 0 .816-.055 1.21-.164a4.03 4.03 0 0 1-1.29-1.94a1 1 0 0 1-.006-.568A4.14 4.14 0 0 1 .604 6.253v-.034c0-.263.103-.511.28-.694a4.18 4.18 0 0 1 .26-3.47a1 1 0 0 1 1.668-.123c.634.827 1.42 1.5 2.32 1.98c.56.3 1.15.519 1.76.654c.07-.636.284-1.25.63-1.79a3.9 3.9 0 0 1 1.77-1.49a3.73 3.73 0 0 1 2.3-.19a3.8 3.8 0 0 1 1.52.75a4.7 4.7 0 0 0 1.01-.472c.354-.221.808-.2 1.14.053a1 1 0 0 1 .33 1.148a1 1 0 0 1 .206.179zm-2.96.197a2.84 2.84 0 0 0-1.47-.885a2.7 2.7 0 0 0-1.68.138a2.93 2.93 0 0 0-1.32 1.11a3.13 3.13 0 0 0-.496 1.704q-.004.35.066.69a7.7 7.7 0 0 1-3.27-.918a8 8 0 0 1-1.91-1.42a8 8 0 0 1-.723-.826a3.15 3.15 0 0 0-.321 2.21a3.2 3.2 0 0 0 .294.803a3 3 0 0 0 .509.696v.001a3 3 0 0 0 .4.34a2.7 2.7 0 0 1-1.238-.34l-.058-.033v.033a3.2 3.2 0 0 0 .217 1.156a3.1 3.1 0 0 0 .543.9a2.9 2.9 0 0 0 .991.739a3 3 0 0 0 .548.18a2.8 2.8 0 0 1-.753.1a2.4 2.4 0 0 1-.543-.05a3.2 3.2 0 0 0 .56 1.051a3 3 0 0 0 .866.72c.387.212.816.329 1.26.34a5.7 5.7 0 0 1-2.3 1.146a5.5 5.5 0 0 1-1.937.1q.335.229.686.419l.003.001q.57.308 1.17.516c.816.282 1.67.426 2.54.423c5.28 0 8.17-4.62 8.17-8.62q0-.2-.01-.39a6 6 0 0 0 .31-.253a6 6 0 0 0 1.13-1.32a5.7 5.7 0 0 1-1.65.48q.063-.04.122-.082a2.94 2.94 0 0 0 1.02-1.266q.069-.16.12-.329a5.5 5.5 0 0 1-1.822.734z" clipRule="evenodd"/>
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@omayaexchange" target="_blank" rel="noopener noreferrer" className="hover:text-[#1D8751] text-white" title="TikTok">
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2">
            <h3 className="text-base md:text-lg font-semibold mb-3 text-white">
              Quick Links
            </h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link
                  href="/#contact"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Support center
                </Link>
              </li>
              <li>
                <Link
                  href="/#supported-assets"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Our Partners
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="lg:col-span-2">
            <h3 className="text-base md:text-lg font-semibold mb-3 text-white">
              Company
            </h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link
                  href="/blog"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/contactUs"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Contact us
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  About us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Policies Column */}
          <div className="lg:col-span-2">
            <h3 className="text-base md:text-lg font-semibold mb-3 text-white">
              Legal Policies
            </h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link
                  href="/legal/terms-of-service"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies-policy"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Cookies Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/disclaimer-policy"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Disclaimer Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/payment-policy"
                  className="hover:text-[#1D8751] text-xs md:text-sm text-white/80 transition-colors"
                >
                  Payment Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information Column */}
          <div className="lg:col-span-2">
            <h3 className="text-base md:text-lg font-semibold mb-3 text-white">
              Contact us
            </h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: textTitle }}
                  className="flex-shrink-0"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span className="text-xs md:text-sm text-white/80">
                  252123456789
                </span>
              </div>
              <div className="flex items-center space-x-2 ">
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
                </svg>
                <span className="text-xs md:text-sm text-white/80">
                  252123456789
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white flex-shrink-0"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span className="text-xs md:text-sm text-white/80">
                  info@OMAYAExpress.com
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: textTitle }}
                  className="flex-shrink-0"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="text-xs md:text-sm text-white/80">
                  KM4, Mogadishu, Somalia
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col mb-4 items-center lg:items-end gap-3">
            {/* App Download Section */}
            <div className="flex flex-col items-center lg:items-end justify-center gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746539125/Appstore_nqe65y.png"
                  alt="App Store QR Code"
                  width={84}
                  height={84}
                  style={{ width: 'auto', height: 'auto' }}
                  className="mb-1"
                />

                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746551283/qr-code-bc94057f452f4806af70fd34540f72ad_3_jk8lq1.png"
                  alt="Play Store QR Code"
                  width={84}
                  height={84}
                  priority
                  style={{ width: 'auto', height: 'auto' }}
                  className="mb-1"
                />
              </div>
            </div>

            {/* Google Play Download */}
            <div className="flex flex-col items-center lg:items-end justify-center gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746539313/googleplay_1_w8djf0.png"
                  alt="Play Store QR Code"
                  width={84}
                  height={84}
                  style={{ width: 'auto', height: 'auto' }}
                  className="mb-1"
                />
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746551283/qr-code-bc94057f452f4806af70fd34540f72ad_3_jk8lq1.png"
                  alt="Play Store QR Code"
                  width={84}
                  height={84}
                  style={{ width: 'auto', height: 'auto' }}
                  className="mb-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="pt-6 text-center">
          <p className="text-sm text-white">Copyright © 2024, OMAYA.io</p>
          <div className="flex justify-center items-center mt-2">
            <span className="text-xs text-white flex items-center gap-2">Powered by 
               <span className="flex flex-col items-center gap-2">
              <img src="https://res.cloudinary.com/dmoqammol/image/upload/v1763650633/Group_34253_ysx2s5.png" alt="" />
             <h3 className="text-xs text-white font-bold">TECHNOLOGIES</h3>
              </span> 
              
              
              </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
