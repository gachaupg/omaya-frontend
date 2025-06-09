import { showToast } from "@/lib/utils/toast";

/**
 * Copies text to clipboard and shows a success toast
 * @param value - The text to copy to clipboard
 */
export const handleCopy = (value: string | undefined) => {
  if (!value) return;

  navigator.clipboard.writeText(value);
  showToast.success("Copied to clipboard");
};
