import { getDashboardData } from "@/lib/dashboard-data";
import DashboardView from "./DashboardView";

export default async function OperationalDashboardPage() {
  const data = await getDashboardData();
  return <DashboardView {...data} />;
}
