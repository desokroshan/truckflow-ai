import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Package, Clock, DollarSign } from "lucide-react";

interface Metrics {
  callsToday: number;
  loadsProcessed: number;
  pendingApproval: number;
  revenue: number;
}

export default function StatusOverview() {
  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });

  const statsCards = [
    {
      title: "Calls Today",
      value: metrics?.callsToday || 0,
      icon: Phone,
      color: "bg-blue-100 text-primary",
      change: "+8% from yesterday",
      changeColor: "text-success",
    },
    {
      title: "Loads Processed", 
      value: metrics?.loadsProcessed || 0,
      icon: Package,
      color: "bg-green-100 text-success",
      change: "75% conversion rate",
      changeColor: "text-success",
    },
    {
      title: "Pending Approval",
      value: metrics?.pendingApproval || 0,
      icon: Clock,
      color: "bg-amber-100 text-warning",
      change: "Avg response: 15min",
      changeColor: "text-slate-600",
    },
    {
      title: "Revenue",
      value: `$${(metrics?.revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-100 text-purple-600",
      change: "+12% this week",
      changeColor: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <Card key={index} className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Expedite Transport Operations</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={stat.changeColor}>{stat.change}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}