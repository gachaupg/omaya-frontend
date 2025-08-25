"use client";
import React, { useState } from "react";
import ExpressExchangeForm from "./ExpressExchangeForm";
import Exchanging from "./exchnaging";

const Express = () => {
  const [showExchanging, setShowExchanging] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  return (
    <div className="container w-full mx-auto">
      <button>
        <span className="flex items-center justify-center">
          <img
            src="https://res.cloudinary.com/pitz/image/upload/v1752429993/Express_1_ggdxth.png"
            alt=""
          />
          <img
            className="mt-2"
            src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
            alt=""
          />
        </span>
      </button>
      {showExchanging ? (
        <Exchanging transactionData={transactionData} />
      ) : (
        <ExpressExchangeForm
          onExchange={(data) => {
            setTransactionData(data);
            setShowExchanging(true);
          }}
        />
      )}
    </div>
  );
};

export default Express;
