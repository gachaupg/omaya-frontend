"use client";

import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Video,
  Headphones,
} from "lucide-react";
import ContactForm from "./ContactForm";
import ContactFAQSection from "./ContactFAQSection";
import { useContactI18n } from "@/lib/useContactI18n";
import { openChatwoot } from "@/lib/chatwoot/client";

const CARD_BORDER =
  "border-gray-200 dark:border-gray-600";
const CARD_BG = "bg-white dark:bg-[#1a1a1f]";

const SUPPORT_EMAILS = [
  {
    label: "support@omayaexchange.com",
    href: "mailto:support@omayaexchange.com",
  },
  {
    label: "info@omaya.io",
    href: "mailto:info@omaya.io",
  },
];

const WHATSAPP_CALL_URL =
  "https://api.whatsapp.com/send/?phone=252611273030&text&type=phone_number&app_absent=0";

const SUPPORT_PHONES = [
  {
    label: "+252 61 127 3030",
    href: "tel:+252611273030",
  },
];

const actionIconBtnClass =
  "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#1D8751] hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors";

function ContactDetailLine({
  label,
  action,
  href,
}: {
  label: string;
  action: "email" | "phone";
  href: string;
}) {
  const isEmail = action === "email";

  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_32px] items-center gap-x-2">
      <span className="min-w-0 text-sm text-gray-600 dark:text-gray-400 break-words">
        {label}
      </span>
      <a
        href={href}
        title={isEmail ? "Send email" : "Call"}
        aria-label={isEmail ? `Send email to ${label}` : `Call ${label}`}
        className={`${actionIconBtnClass} justify-self-end`}
      >
        {isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
      </a>
    </div>
  );
}

type InfoCardProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

function InfoCard({ icon, title, children }: InfoCardProps) {
  return (
    <div
      className={`flex gap-3 sm:gap-4 rounded-2xl border ${CARD_BORDER} ${CARD_BG} p-3 sm:p-4`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1D8751]/10 dark:bg-[#1D8751]/15 text-[#1D8751]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </p>
        <div className="text-sm space-y-0.5 w-full">{children}</div>
      </div>
    </div>
  );
}

type SupportChannelProps = {
  icon: React.ReactNode;
  description: string;
  title: string;
  actionLabel: string;
  onAction: () => void;
  primary?: boolean;
};

function SupportChannelCard({
  icon,
  description,
  title,
  actionLabel,
  onAction,
  primary = false,
}: SupportChannelProps) {
  return (
    <div
      className={`flex flex-col rounded-2xl border ${CARD_BORDER} ${CARD_BG} p-6 text-center`}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1D8751]/10 dark:bg-[#1D8751]/15 text-[#1D8751]">
        {icon}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
        {title}
      </h3>
      <button
        type="button"
        onClick={onAction}
        className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          primary
            ? "bg-[#1D8751] text-white hover:bg-[#166b42]"
            : `border ${CARD_BORDER} text-gray-900 dark:text-white hover:border-[#1D8751] hover:text-[#1D8751]`
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

interface ContactPageProps {
  showFileUpload?: boolean;
}

const ContactPage: React.FC<ContactPageProps> = () => {
  const { t } = useContactI18n();

  const handleConnectLiveChat = () => {
    void openChatwoot();
  };

  const handleCallNow = () => {
    window.open(WHATSAPP_CALL_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full text-gray-900 dark:text-white">
      {/* Hero */}
      <header className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-[#1D8751] mb-2">
          <MessageCircle className="w-4 h-4" />
          {t("contact.hero.badge", "We're Here to Help")}
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 sm:mb-3">
          {t("contact.hero.titleStart", "Get in")}{" "}
          <span className="text-[#1D8751]">
            {t("contact.hero.titleAccent", "Touch")}
          </span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          {t(
            "contact.hero.subtitle",
            "Have questions? Our dedicated support team is available 24/7 to assist you with any inquiries about trading, security, or platform features."
          )}
        </p>
      </header>

      {/* Form + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-14 sm:mb-20">
        <div
          className={`lg:col-span-2 rounded-2xl border ${CARD_BORDER} ${CARD_BG} p-6 sm:p-8`}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t("contact.form.title", "Send us a Message")}
          </h2>
          <ContactForm layout="marketing" />
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-600">
            {/* Connect with Live Chat — legacy in-app live chat route
            <button
              type="button"
              onClick={handleConnectLiveChat}
              className={`w-full py-3 rounded-xl border ${CARD_BORDER} text-gray-900 dark:text-white text-sm font-semibold hover:border-[#1D8751] hover:text-[#1D8751] transition-colors`}
            >
              {t("contact.liveChat", "Connect with Live Chat")}
            </button>
            */}
            <button
              type="button"
              onClick={handleConnectLiveChat}
              className="w-full py-3 rounded-xl bg-[#1D8751] text-white text-sm font-semibold hover:bg-[#166b42] transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {t("contact.chatwoot", "Chat with us")}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <InfoCard
            icon={<Mail className="w-5 h-5" />}
            title={t("contact.info.email", "Email")}
          >
            <div className="space-y-2">
              {SUPPORT_EMAILS.map((item) => (
                <ContactDetailLine
                  key={item.href}
                  label={item.label}
                  action="email"
                  href={item.href}
                />
              ))}
            </div>
          </InfoCard>

          <InfoCard
            icon={<Phone className="w-5 h-5" />}
            title={t("contact.info.phone", "Phone")}
          >
            <div className="space-y-2">
              {SUPPORT_PHONES.map((item) => (
                <ContactDetailLine
                  key={item.label}
                  label={item.label}
                  action="phone"
                  href={item.href}
                />
              ))}
            </div>
          </InfoCard>

          <InfoCard
            icon={<MapPin className="w-5 h-5" />}
            title={t("contact.info.address", "Address")}
          >
            <p className="text-gray-600 dark:text-gray-400">
              {t("contact.info.addressLine1", "OMAYA.io")}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {t("contact.info.addressLine2", "Mogadishu, Somalia")}
            </p>
          </InfoCard>

          <InfoCard
            icon={<Clock className="w-5 h-5" />}
            title={t("contact.info.hours", "Support Hours")}
          >
            <p className="text-gray-600 dark:text-gray-400">
              {t("contact.info.hoursLine1", "24/7 Customer Support")}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {t("contact.info.hoursLine2", "Always Available")}
            </p>
          </InfoCard>

          <div
            className={`rounded-2xl border ${CARD_BORDER} bg-[#1D8751]/5 dark:bg-[#1D8751]/10 p-5 sm:p-6`}
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {t("contact.quickResponse.title", "Quick Response")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              {t(
                "contact.quickResponse.text",
                "Most inquiries are answered within 2 hours during business hours."
              )}
            </p>
            <button
              type="button"
              onClick={handleCallNow}
              className="w-full py-2.5 rounded-xl bg-[#1D8751] text-white text-sm font-semibold hover:bg-[#166b42] transition-colors"
            >
              {t("contact.callNow", "Call Now")}
            </button>
          </div>
        </div>
      </div>

      {/* Other ways */}
      <section className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("contact.channels.titleStart", "Other Ways to")}{" "}
          <span className="text-[#1D8751]">
            {t("contact.channels.titleAccent", "Reach Us")}
          </span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(
            "contact.channels.subtitle",
            "Choose the support channel that works best for you"
          )}
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <SupportChannelCard
          icon={<MessageCircle className="w-6 h-6" />}
          description={t(
            "contact.channels.liveChatDesc",
            "Chat with our support team in real-time"
          )}
          title={t("contact.channels.liveChatTitle", "Live Chat")}
          actionLabel={t("contact.channels.startChat", "Start Chat")}
          onAction={handleConnectLiveChat}
          primary
        />
        <SupportChannelCard
          icon={<Video className="w-6 h-6" />}
          description={t(
            "contact.channels.videoDesc",
            "Watch step-by-step video guides"
          )}
          title={t("contact.channels.videoTitle", "Video Tutorials")}
          actionLabel={t("contact.channels.watchVideos", "Watch Videos")}
          onAction={() =>
            window.open(
              "https://www.youtube.com/@OMAYAExchange?sub_confirmation=1",
              "_blank",
              "noopener,noreferrer"
            )
          }
        />
        <SupportChannelCard
          icon={<Headphones className="w-6 h-6" />}
          description={t(
            "contact.channels.phoneDesc",
            "Speak directly with our support team"
          )}
          title={t("contact.channels.phoneTitle", "Phone Support")}
          actionLabel={t("contact.callNow", "Call Now")}
          onAction={handleCallNow}
        />
      </div>

      <ContactFAQSection />
    </div>
  );
};

export default ContactPage;
