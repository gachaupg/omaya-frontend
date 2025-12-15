// app/page.tsx

import MarketingPage from "./(marketing)/page";

export default function Home() {
  return (
    <div className="bg-[#EEF1F4] dark:bg-[var(--bg-color)]">
      <MarketingPage />
    </div>
  );
}