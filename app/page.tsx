import DashboardClient from "@/components/dashboard-client";

// Disable static generation for this page since it uses wagmi hooks
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return <DashboardClient />;
}
