"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { useMarketingI18n } from "@/lib/useMarketingI18n";
import { setAuthRedirectPath } from "@/lib/utils/authRedirect";
import type { HomeP2PMode, HomeP2POffer } from "./types";
import { useHomeP2POffers } from "./hooks/useHomeP2POffers";
import { P2PMarketTabs } from "./components/P2PMarketTabs";
import { P2POfferList } from "./components/P2POfferList";
import { P2PMarketFooter } from "./components/P2PMarketFooter";
import { P2PTradeModal } from "./components/P2PTradeModal";

type HomeP2PProps = {
  isHomePage?: boolean;
};

const P2P_MARKET_REDIRECT = "/dashboard/p2p/?tab=market";

export default function HomeP2P({ isHomePage = true }: HomeP2PProps) {
  const router = useRouter();
  const { t } = useMarketingI18n();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [mode, setMode] = useState<HomeP2PMode>("buy");
  const [selectedOffer, setSelectedOffer] = useState<HomeP2POffer | null>(null);
  const { offers, loading, activeTradersLabel } = useHomeP2POffers(mode);

  const redirectToLoginForMarket = useCallback(() => {
    setAuthRedirectPath(P2P_MARKET_REDIRECT);
    router.push("/auth/login");
  }, [router]);

  const goToP2PMarket = useCallback(() => {
    if (!isAuthenticated) {
      redirectToLoginForMarket();
      return;
    }
    router.push(P2P_MARKET_REDIRECT);
  }, [isAuthenticated, redirectToLoginForMarket, router]);

  const handleOfferAction = useCallback(
    (offer: HomeP2POffer) => {
      if (!isAuthenticated) {
        redirectToLoginForMarket();
        return;
      }
      setSelectedOffer(offer);
    },
    [isAuthenticated, redirectToLoginForMarket]
  );

  const closeTradeModal = useCallback(() => {
    setSelectedOffer(null);
  }, []);

  return (
    <div
      className={`w-full max-w-full mx-auto pt-0 mb-0 text-[#788099] ${
        isHomePage ? "flex flex-col" : ""
      }`}
    >
      <P2PMarketTabs
        mode={mode}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          setSelectedOffer(null);
        }}
        buyLabel={t("marketing.p2p.buyCrypto", "Buy Crypto")}
        sellLabel={t("marketing.p2p.sellCrypto", "Sell Crypto")}
      />

      <div className="pt-0.5">
        <P2POfferList
          offers={offers}
          mode={mode}
          loading={loading}
          emptyLabel={t(
            "marketing.p2p.emptyOffers",
            "No offers available right now."
          )}
          onOfferAction={handleOfferAction}
        />
      </div>

      <P2PMarketFooter
        activeTradersLabel={activeTradersLabel}
        tradersOnlineText={t(
          "marketing.p2p.activeTraders",
          "active traders online"
        )}
        viewAllLabel={t("marketing.p2p.viewAll", "View all offers")}
        onViewAll={goToP2PMarket}
      />

      <P2PTradeModal
        open={Boolean(selectedOffer)}
        marketRow={selectedOffer?.marketRow ?? null}
        mode={mode}
        onClose={closeTradeModal}
      />
    </div>
  );
}
