import Link from "next/link"
import Image from "next/image"
import { tokens } from "@/styles/tokens"
import {
  TextIcon as Telegram,
  Youtube,
  Facebook,
  Instagram,
  PhoneIcon as WhatsApp,
  Twitter,
  InstagramIcon as TiktokIcon,
} from "lucide-react"

export default function Footer() {
  const { primary } = tokens.colors.brand;
  const { textTitle, textBody, background, card } = tokens.colors.dark
  
  return (
    <footer
      className="pt-10 pb-4 bg-[#18181D] text-[#788099]"
    >
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-8 border-b border-gray-700">
          {/* Logo and Social Media Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/">
              <Image src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746548004/Omaya-green_g7uk8r.png" alt="OMAYA Exchange" width={150} height={40} className="h-auto" />
            </Link>

            <div className="space-y-4 mt-4">
              <p className="text-sm text-white">Follow us on:</p>
              <div className="flex space-x-4">
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  <Telegram size={20} />
                </Link>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  <Youtube size={20} />
                </Link>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  <Facebook size={20} />
                </Link>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  <Instagram size={20} />
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  <WhatsApp size={20} />
                </Link>
                <Link href="#" className="hover:text-[#1D8751] text-white" >
                  <Twitter size={20} />
                </Link>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  <TiktokIcon size={20} />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white" >
                  Support center
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  Our Partners
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium mb-4 text-white">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white" >
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  About us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Policies Column */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium mb-4 text-white">Legal Policies</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  Cookies Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  Disclaimer Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#1D8751] text-white">
                  Payment Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information Column */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium mb-4 text-white">Contact us</h3>
            <div className="space-y-3">
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
                  style={{color :textTitle}}
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span className="text-sm text-white">252123456789</span>
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
                  className="text-white"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span className="text-sm text-white">252123456789</span>
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
                  className="text-white"
                  
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span className="text-sm text-white">info@OMAYAExpress.com</span>
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
                  style={{color :textTitle}}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="text-sm text-white">KM4, Mogadishu, Somalia</span>
              </div>
            </div>
          </div>

        <div className="flex flex-col mb-4">
          {/* App Download Section */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <Image
                src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746539125/Appstore_nqe65y.png"
                alt="App Store QR Code"
                width={100}
                height={100}
                className="mb-2"
              />
              
              <Image
                src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746551283/qr-code-bc94057f452f4806af70fd34540f72ad_3_jk8lq1.png"
                alt="Play Store QR Code"
                width={100}
                height={100}
                className="mb-2"
              />
              
            </div>
          </div>

          {/* Google Play Download */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746539313/googleplay_1_w8djf0.png"
                  alt="Play Store QR Code"
                  width={100}
                  height={100}
                  className="mb-2"
                />
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746551283/qr-code-bc94057f452f4806af70fd34540f72ad_3_jk8lq1.png"
                  alt="Play Store QR Code"
                  width={100}
                  height={100}
                  className="mb-2"
                />
              </div>
          </div>

          
          </div>
        </div>

        {/* Copyright Section */}
        <div className="pt-6 text-center">
          <p className="text-sm text-white">Copyright © 2024, OMAYA.io</p>
          <div className="flex justify-center items-center mt-2">
            <span className="text-xs text-white">Powered by</span>
            <div className="ml-2 text-green-500 font-bold">
            <Image
                src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746548004/Omaya-green_g7uk8r.png"
                alt="Play Store QR Code"
                width={100}
                height={100}
                className="mb-2"
              />
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}