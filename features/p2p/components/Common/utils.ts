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

/**
 * Custom copy handler that shows "Copied" in button
 * @param value - The text to copy to clipboard
 * @param buttonId - The unique identifier for the button
 * @param setCopiedButton - State setter function to update which button shows "Copied"
 */
export const handleCopyToClipboard = (
  value: string | undefined,
  buttonId: string,
  setCopiedButton: (id: string | null) => void
) => {
  if (!value) return;
  navigator.clipboard.writeText(value);
  setCopiedButton(buttonId);
  setTimeout(() => setCopiedButton(null), 2000);
};
