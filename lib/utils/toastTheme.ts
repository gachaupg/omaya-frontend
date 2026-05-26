/** Shared toast colors — Sonner + react-hot-toast */

export const TOAST_COLORS = {
  success: {
    bg: "#1D8751",
    border: "#166B40",
    text: "#FFFFFF",
    description: "#E8F8EE",
    iconPrimary: "#FFFFFF",
    iconSecondary: "#1D8751",
  },
  error: {
    bg: "#E23D3A",
    border: "#C93330",
    text: "#FFFFFF",
    description: "#FDE8E8",
    iconPrimary: "#FFFFFF",
    iconSecondary: "#E23D3A",
  },
  default: {
    bg: "#35353E",
    border: "#4A4A55",
    text: "#FFFFFF",
  },
} as const;

const sonnerToastBase =
  "group toast shadow-md rounded-lg border !py-2 !px-3 !gap-2 !min-h-0";

export const sonnerToastClassNames = {
  toast: sonnerToastBase,
  title: "group-[.toast]:!text-[13px] group-[.toast]:!leading-snug group-[.toast]:font-semibold",
  description:
    "group-[.toast]:!text-xs group-[.toast]:!leading-snug group-[.toast]:!mt-0.5 group-[.toast]:opacity-90",
  closeButton:
    "group-[.toast]:!bg-white/10 group-[.toast]:!border-0 group-[.toast]:!text-inherit group-[.toast]:!opacity-80 hover:group-[.toast]:!opacity-100 group-[.toast]:!left-auto group-[.toast]:!right-2 group-[.toast]:!top-2 group-[.toast]:!transform-none group-[.toast]:!w-5 group-[.toast]:!h-5",
  success: `${sonnerToastBase} !bg-[#1D8751] !border-[#166B40] !text-white [&_[data-title]]:!text-white [&_[data-description]]:!text-[#E8F8EE]`,
  error: `${sonnerToastBase} !bg-[#E23D3A] !border-[#C93330] !text-white [&_[data-title]]:!text-white [&_[data-description]]:!text-[#FDE8E8]`,
  warning: `${sonnerToastBase} !bg-[#F79330]/28 !border-[#F79330]/58 !text-white [&_[data-title]]:!text-[#FFF4E8] [&_[data-description]]:!text-[#F5D9B8]`,
  info: `${sonnerToastBase} !bg-[#3B82F6]/22 !border-[#3B82F6]/52 !text-white [&_[data-title]]:!text-[#E8F0FF] [&_[data-description]]:!text-[#BFDBFE]`,
  actionButton: "group-[.toast]:bg-[#1D8751] group-[.toast]:text-white !text-xs !py-1 !px-2",
  cancelButton: "group-[.toast]:bg-[#35353E] group-[.toast]:text-gray-300 !text-xs",
};

const hotToastCompactStyle = {
  padding: "8px 12px",
  fontSize: "13px",
  lineHeight: "1.35",
  minHeight: "auto",
  maxWidth: "360px",
  borderRadius: "8px",
} as const;

export const hotToastOptions = {
  success: {
    style: {
      ...hotToastCompactStyle,
      background: TOAST_COLORS.success.bg,
      border: `1px solid ${TOAST_COLORS.success.border}`,
      color: TOAST_COLORS.success.text,
    },
    iconTheme: {
      primary: TOAST_COLORS.success.iconPrimary,
      secondary: TOAST_COLORS.success.iconSecondary,
    },
  },
  error: {
    style: {
      ...hotToastCompactStyle,
      background: TOAST_COLORS.error.bg,
      border: `1px solid ${TOAST_COLORS.error.border}`,
      color: TOAST_COLORS.error.text,
    },
    iconTheme: {
      primary: TOAST_COLORS.error.iconPrimary,
      secondary: TOAST_COLORS.error.iconSecondary,
    },
  },
  style: {
    ...hotToastCompactStyle,
    background: TOAST_COLORS.default.bg,
    border: `1px solid ${TOAST_COLORS.default.border}`,
    color: TOAST_COLORS.default.text,
  },
};
