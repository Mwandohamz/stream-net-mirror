import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, Monitor, Globe, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(0 85% 50%)", "hsl(270 60% 55%)", "hsl(200 80% 50%)", "hsl(120 60% 45%)", "hsl(40 90% 55%)"];

const Analytics = () => {
  const [stats, setStats] = useState({ totalViews: 0, uniqueSessions: 0, bounceRate: 0, avgPagesPerSession: 0 });
  const [pageData, setPageData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data: views } = await supabase.from("page_views").select("*").order("created_at", { ascending: false });
    const allViews = views || [];

    const sessions = new Map<string, any[]>();
    allViews.forEach((v: any) => {
      const sid = v.session_id || "unknown";
      if (!sessions.has(sid)) sessions.set(sid, []);
      sessions.get(sid)!.push(v);
    });

    const bounces = Array.from(sessions.values()).filter((s) => s.length === 1).length;
    const bounceRate = sessions.size > 0 ? Math.round((bounces / sessions.size) * 100) : 0;
    const avgPages = sessions.size > 0 ? Math.round((allViews.length / sessions.size) * 10) / 10 : 0;

    setStats({
      totalViews: allViews.length,
      uniqueSessions: sessions.size,
      bounceRate,
      avgPagesPerSession: avgPages,
    });

    // Page breakdown
    const pageCounts = new Map<string, number>();
    allViews.forEach((v: any) => {
      const page = v.page || "unknown";
      pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
    });
    setPageData(
      Array.from(pageCounts.entries())
        .map(([page, count]) => ({ page: page.replace(/^\//, "") || "home", count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );

    // Device breakdown from user_agent
    const devices = { Mobile: 0, Desktop: 0, Tablet: 0, Other: 0 };
    allViews.forEach((v: any) => {
      const ua = (v.user_agent || "").toLowerCase();
      if (/mobile|android|iphone/.test(ua)) devices.Mobile++;
      else if (/tablet|ipad/.test(ua)) devices.Tablet++;
      else if (/windows|macintosh|linux/.test(ua)) devices.Desktop++;
      else devices.Other++;
    });
    setDeviceData(Object.entries(devices).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })));

    // Daily views (last 14 days)
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toISOString().split("T")[0];
      return {
        date: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        views: allViews.filter((v: any) => v.created_at?.startsWith(dateStr)).length,
      };
    });
    setDailyData(last14);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="netflix-title text-3xl text-foreground">ANALYTICS</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Total Views" value={stats.totalViews} icon={Eye} />
          <StatCard title="Unique Sessions" value={stats.uniqueSessions} icon={Users} />
          <StatCard title="Bounce Rate" value={`${stats.bounceRate}%`} icon={TrendingDown} />
          <StatCard title="Pages/Session" value={stats.avgPagesPerSession} icon={Globe} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">DAILY VIEWS (14 DAYS)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
                  <XAxis dataKey="date" stroke="hsl(0 0% 60%)" fontSize={10} />
                  <YAxis stroke="hsl(0 0% 60%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8, color: "hsl(0 0% 95%)" }} />
                  <Bar dataKey="views" fill="hsl(0 85% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">DEVICES</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 18%)", borderRadius: 8, color: "hsl(0 0% 95%)" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Pages */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="netflix-title text-lg text-foreground">TOP PAGES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pageData.map((p) => (
                <div key={p.page} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-foreground">/{p.page}</span>
                  <span className="text-sm text-muted-foreground font-medium">{p.count} views</span>
                </div>
              ))}
              {pageData.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
