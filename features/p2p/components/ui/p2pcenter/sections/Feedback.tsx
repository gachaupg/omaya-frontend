import React from "react";
import { feedbackTableData } from "@/features/p2p/data";
import { tokens } from "@/styles/tokens";
import { Table } from "@/features/p2p/components/Common/Table";
import Card from "@/features/p2p/components/Common/Card";

const BANK_ICON_URL =
  "https://res.cloudinary.com/pitz/image/upload/v1746705424/1d80d34ccb0f17b03572fe01e820f090edc3e463_y13v5u.jpg";

const Feedback = () => {
  return (
    <Card
      borderColor={`border-[${tokens.colors.dark.border}]`}
      width="w-full"
      bgColor={`bg-[${tokens.colors.dark.card}]`}
      borderRadius="rounded-[16px]"
      className="p-4 min-h-[600px]"
    >
      <div className="text-[18px] sm:text-[22px] font-semibold mb-4 text-[#FFFFFF]">
        Feedback
      </div>
      <Table type="feedback" title="Feedback" data={feedbackTableData} />
    </Card>
  );
};

export default Feedback;
