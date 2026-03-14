import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { DollarSign, CreditCard, Users, TrendingUp, Eye, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    organicRevenue: 0,
    influencerRevenue: 0,
    totalPayments: 0,
    todayPayments: 0,
    totalPageViews: 0,
    uniqueSessions: 0,
    conversionRate: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [viewsData, setViewsData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split("T")[0];

    const [paymentsRes, todayRes, viewsRes, sessionsRes] = await Promise.all([
      supabase.from("payments").select("*"),
      supabase.from("payments").select("*").gte("created_at", today),
      supabase.from("page_views").select("id"),
      supabase.from("page_views").select("session_id"),
    ]);

    const payments = paymentsRes.data || [];
    const todayPayments = todayRes.data || [];
    const totalViews = viewsRes.data?.length || 0;
    const uniqueSessions = new Set((sessionsRes.data || []).map((v: any) => v.session_id)).size;
    const completedPayments = payments.filter((p: any) => p.status === "completed");
    const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const organicRevenue = completedPayments.filter((p: any) => !p.promo_code).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const influencerRevenue = completedPayments.filter((p: any) => !!p.promo_code).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const conversionRate = uniqueSessions > 0 ? ((completedPayments.length / uniqueSessions) * 100) : 0;

    setStats({
      totalRevenue,
      totalPayments: payments.length,
      todayPayments: todayPayments.length,
      totalPageViews: totalViews,
      uniqueSessions,
      conversionRate: Math.round(conversionRate * 10) / 10,
    });

    // Build revenue chart data (last 7 days)
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayPayments = completedPayments.filter((p: any) => p.created_at?.startsWith(dateStr));
      return {
        date: d.toLocaleDateString("en", { weekday: "short" }),
        revenue: dayPayments.reduce((s: number, p: any) => s + Number(p.amount), 0),
        count: dayPayments.length,
      };
    });
    setRevenueData(last7);

    // Build views chart data (last 7 days)
    const allViews = (viewsRes.data as any[]) || [];
    // We only have IDs so we need to re-fetch with timestamps for chart
    const { data: viewsFull } = await supabase.from("page_views").select("created_at, session_id");
    const viewsArr = viewsFull || [];
    const viewsLast7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayViews = viewsArr.filter((v: any) => v.created_at?.startsWith(dateStr));
      return {
        date: d.toLocaleDateString("en", { weekday: "short" }),
        views: dayViews.length,
        sessions: new Set(dayViews.map((v: any) => v.session_id)).size,
      };
    });
    setViewsData(viewsLast7);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="netflix-title text-3xl text-foreground">DASHBOARD OVERVIEW</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard title="Total Revenue" value={`ZMW ${stats.totalRevenue}`} icon={DollarSign} description="Completed payments" />
          <StatCard title="Total Payments" value={stats.totalPayments} icon={CreditCard} description="All time" />
          <StatCard title="Today" value={stats.todayPayments} icon={TrendingUp} description="Payments today" />
          <StatCard title="Page Views" value={stats.totalPageViews} icon={Eye} description="All time" />
          <StatCard title="Sessions" value={stats.uniqueSessions} icon={Users} description="Unique visitors" />
          <StatCard title="Conversion" value={`${stats.conversionRate}%`} icon={BarChart3} description="Visitors → Customers" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">REVENUE (7 DAYS)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                  <XAxis dataKey="date" stroke="hsl(0 0% 60%)" fontSize={12} />
                  <YAxis stroke="hsl(0 0% 60%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8, color: "hsl(0 0% 95%)" }} />
                  <Bar dataKey="revenue" fill="hsl(0 85% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">TRAFFIC (7 DAYS)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                  <XAxis dataKey="date" stroke="hsl(0 0% 60%)" fontSize={12} />
                  <YAxis stroke="hsl(0 0% 60%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8, color: "hsl(0 0% 95%)" }} />
                  <Line type="monotone" dataKey="views" stroke="hsl(0 85% 50%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sessions" stroke="hsl(270 60% 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
