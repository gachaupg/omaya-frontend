export const ratesFieldBorder = (isDark: boolean) =>
  isDark ? "border-white/10 text-white" : "border-gray-200 text-[#111827]";

export const ratesFieldClass = (isDark: boolean, extra = "") =>
  `w-full h-[44px] min-h-[44px] rounded-2xl px-4 text-sm font-medium focus:outline-none border appearance-none bg-transparent box-border ${ratesFieldBorder(isDark)} ${extra}`.trim();

export const ratesSelectTriggerClass = (isDark: boolean) =>
  `!h-[44px] !min-h-[44px] !py-0 px-4 text-sm font-medium border rounded-2xl bg-transparent ${isDark ? "text-white border-white/10" : "text-[#1F2937] border-gray-200"}`;

export const ratesFieldLabelClass =
  "block text-sm sm:text-[17px] text-[#7e7e8f] dark:text-[#ffffff] mb-2 font-semibold min-h-[28px] flex items-center";
