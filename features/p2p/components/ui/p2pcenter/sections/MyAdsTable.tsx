import React from "react";
import { Table } from "../../../Common/Table";

const BANK_ICON_URL =
  "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg";

const ads = [
  {
    id: "1283979421",
    asset: "Tether US",
    assetSymbol: "USDT",
    type: "Buy",
    limit: "50,000-75,000",
    price: "148.56",
    commission: "$1.22",
    payment: [{ bank: "Salam Bank", logo: BANK_ICON_URL }],
    lastUpdate: "12-Jun-2023 15:33",
    status: "Published",
    date: "12-Jun-2023 15:33",
    amount: "148.56",
  },
  // Add more rows as needed
];

const MyAdsTable = () => <Table title="My Ads" data={ads} type="myads" />;

export default MyAdsTable;
