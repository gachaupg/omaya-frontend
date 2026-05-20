export default function DashboardContentArea({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-page-wrapper mt-[70px] sm:mt-[82px] md:mt-20 w-full max-w-full overflow-x-hidden box-border min-h-[calc(100vh-10rem)]">
      {children}
    </div>
  );
}
