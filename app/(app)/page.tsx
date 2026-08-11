import { getDashboardData } from "@/lib/dashboard-data";
import DashboardView from "./dashboard/DashboardView";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardView {...data} />;
}
