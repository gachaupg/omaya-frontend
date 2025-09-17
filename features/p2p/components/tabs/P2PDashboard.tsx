"use client";

import React, { useState } from "react";
import { tokens } from "@/styles/tokens";
import Card from "../Common/Card";
import Available from "../ui/p2pdashboard/Available";
import P2PCharts from "../ui/p2pdashboard/P2PCharts";
import Overview from "../ui/p2pdashboard/Overview";
import P2pWallet from "../ui/p2pdashboard/P2pWallet";
import UserCard from "../ui/p2pdashboard/UserCard";
import Deposit from "../ui/p2pdashboard/sections/Deposit";
import Withdraw from "../ui/p2pdashboard/sections/Withdraw";
import Express from "../ui/express/components/express";

const P2PDashboard = () => {
  const [isOpenForm, setIsOpenForm] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <UserCard />
      <div className="flex flex-col lg:flex-row  gap-4">
        {(isOpenForm === "deposit" || isOpenForm === "withdraw") ? (
          <div className="w-full">
            <P2pWallet isOpenForm={isOpenForm} setIsOpenForm={setIsOpenForm} />
            {isOpenForm === "deposit" && <Express mode="deposit" />}
            {isOpenForm === "withdraw" && <Express mode="withdrawal" />}
          </div>
        ) : (
          <>
            <div className="w-full lg:w-[70%] lg:flex-1">
              <P2pWallet isOpenForm={isOpenForm} setIsOpenForm={setIsOpenForm} />
              {isOpenForm === "" && (
                <>
                  {" "}
                  <Available />
                  <P2PCharts />
                </>
              )}
            </div>
            {isOpenForm === "" && (
              <div className="w-full lg:w-[28%] lg:flex-shrink-0">
                <Overview />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default P2PDashboard;
