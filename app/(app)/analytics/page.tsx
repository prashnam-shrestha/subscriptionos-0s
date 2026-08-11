import { getRevenueAnalytics } from "@/lib/analytics";
import AnalyticsView from "./AnalyticsView";

export default async function AnalyticsPage() {
  const data = await getRevenueAnalytics();
  return <AnalyticsView data={data} />;
}
