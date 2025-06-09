import UserCard from "@/components/dashboard/ui/UserCard";
import PriceCards from "@/components/charts/PriceChart";
import VolumeChart from "@/components/charts/VolumeChart";
import LineCharts from "@/components/charts/LineCharts";
import Transactions from "@/components/dashboard/ui/Transactions";
export default function DashboardPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-0 mb-4 flex flex-col gap-4 rounded-lg w-full">
      <UserCard />
      <PriceCards />
      <VolumeChart />
      <LineCharts />
      <Transactions />
    </div>
  );
}
