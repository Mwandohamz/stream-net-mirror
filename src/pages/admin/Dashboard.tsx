import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminQuery, useAdminRefresh, fetchAdminMetrics } from "@/hooks/useAdminQuery";

import StatCard from "@/components/admin/StatCard";
import { DollarSign, CreditCard, TrendingUp, BarChart3, HelpCircle, ChevronDown, ChevronRight, RefreshCw, MessageSquare, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyAmount, formatUsd } from "@/lib/currency";

const SUCCESS_PAYMENT_STATUSES = ["completed", "success", "succeeded"];

const EMPTY_STATS = {
  totalRevenue: 0,
  totalRevenueUsd: 0,
  organicRevenue: 0,
  influencerRevenue: 0,
  totalPayments: 0,
  completedPayments: 0,
  todayPayments: 0,
  totalPageViews: 0,
  uniqueSessions: 0,
  conversionRate: 0,
  totalSubscribers: 0,
  openTickets: 0,
};

const Dashboard = () => {
  const [showGuide, setShowGuide] = useState(false);
  const refresh = useAdminRefresh();

  const { data, isFetching } = useAdminQuery(["admin", "overview"], () =>
    fetchAdminMetrics<{ stats: typeof EMPTY_STATS; days: any[]; recentPayments: any[] }>("overview")
  );

  const stats = data?.stats ?? EMPTY_STATS;
  const revenueData = data?.days ?? [];
  const viewsData = data?.days ?? [];
  const recentPayments = data?.recentPayments ?? [];
  const refreshing = isFetching;
  const fetchStats = () => refresh(["admin", "overview"]);


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="netflix-title text-3xl text-foreground">DASHBOARD OVERVIEW</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchStats()}
              disabled={refreshing}
              className="border-border text-foreground gap-1"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuide(!showGuide)}
              className="border-border text-foreground gap-1"
            >
              <HelpCircle size={14} />
              {showGuide ? "Hide Guide" : "Admin Guide"}
              {showGuide ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </Button>
          </div>
        </div>

        {showGuide && (
          <Card className="bg-accent/5 border-accent/20 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="netflix-title text-lg text-foreground">📖 HOW TO MANAGE STREAMNETMIRROR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-foreground font-semibold mb-1">🎯 User Access Flow</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li>User visits <code className="text-primary">/payment</code> and pays via mobile money (pawaPay)</li>
                  <li>Payment is recorded in the database automatically</li>
                  <li>User signs up at <code className="text-primary">/signup</code> using the <strong>same email</strong> they paid with</li>
                  <li>They verify their email, then sign in at <code className="text-primary">/signin</code></li>
                  <li>They access the streaming portal at <code className="text-primary">/dashboard</code></li>
                </ol>
              </div>

              <div>
                <h3 className="text-foreground font-semibold mb-1">🎫 Support Tickets</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Go to <strong className="text-foreground">Support</strong> in the sidebar to view all tickets</li>
                  <li>Tickets from <strong>Guest users</strong> (not logged in) show a yellow "Guest" badge</li>
                  <li>Tickets from <strong>logged-in subscribers</strong> show their account info</li>
                  <li>Click a ticket to expand it, view the conversation, and reply</li>
                  <li>Use <strong className="text-primary">"Grant Access"</strong> button to manually create an account with a temporary password</li>
                  <li>Copy the temp password and send it to the user (e.g. via WhatsApp or email)</li>
                  <li>Close tickets when resolved; reopen if needed</li>
                </ul>
              </div>

              <div>
                <h3 className="text-foreground font-semibold mb-1">💰 Payments</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Go to <strong className="text-foreground">Payments</strong> to see all payment records</li>
                  <li>Search by name, email, phone, or transaction ID</li>
                  <li>Use <strong>"Export CSV"</strong> to download all payment data</li>
                  <li>Payment statuses: <span className="text-primary">completed</span> = successful, <span className="text-muted-foreground">pending</span> = awaiting, <span className="text-destructive">failed</span> = rejected</li>
                </ul>
              </div>

              <div>
                <h3 className="text-foreground font-semibold mb-1">👥 Customers</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Shows unique customers with completed payments</li>
                  <li>Includes country, currency, promo code, and discount info</li>
                </ul>
              </div>

              <div>
                <h3 className="text-foreground font-semibold mb-1">📊 Analytics</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tracks page views and unique sessions across the site</li>
                  <li>Conversion rate = (completed payments ÷ unique sessions) × 100</li>
                </ul>
              </div>

              <div>
                <h3 className="text-foreground font-semibold mb-1">🤝 Influencers</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Create influencer promo codes with custom discount % and revenue share %</li>
                  <li>Influencers log in at <code className="text-primary">/influencer/PROMO_CODE</code> to see their stats</li>
                </ul>
              </div>

              <div>
                <h3 className="text-foreground font-semibold mb-1">⚙️ Settings</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Pricing:</strong> Change the base price in ZMW</li>
                  <li><strong>Portal URL:</strong> Update the main streaming portal link</li>
                  <li><strong>Official Links:</strong> Set up to 3 backup streaming links</li>
                  <li><strong>APK:</strong> Upload the Android app file</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Total Revenue" value={formatCurrencyAmount(stats.totalRevenue, "ZMW")} icon={DollarSign} description={`≈ ${formatUsd(stats.totalRevenueUsd)}`} />
          <StatCard title="Organic Revenue" value={formatCurrencyAmount(Number(stats.organicRevenue), "ZMW")} icon={DollarSign} description="No promo code" />
          <StatCard title="Promo Revenue" value={formatCurrencyAmount(Number(stats.influencerRevenue), "ZMW")} icon={TrendingUp} description="Via influencers" />
          <StatCard title="Total Payments" value={stats.totalPayments} icon={CreditCard} description="All statuses" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Today's Payments" value={stats.todayPayments} icon={TrendingUp} description="Payments today" />
          <StatCard title="Subscribers" value={stats.totalSubscribers} icon={UserPlus} description="Active accounts" />
          <StatCard title="Open Tickets" value={stats.openTickets} icon={MessageSquare} description="Need attention" />
          <StatCard title="Conversion" value={`${stats.conversionRate}%`} icon={BarChart3} description="Visitors → Paid" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">REVENUE (7 DAYS)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sessions" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="netflix-title text-lg text-foreground">RECENT PAYMENTS</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      {refreshing ? "Loading..." : "No payments found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPayments.map((p: any) => {
                    const normalizedStatus = String(p.status || "").toLowerCase();
                    const isSuccess = SUCCESS_PAYMENT_STATUSES.includes(normalizedStatus);

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.phone}</TableCell>
                        <TableCell className="text-foreground font-medium">{p.currency || "ZMW"} {p.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={isSuccess ? "default" : "secondary"}
                            className={
                              isSuccess
                                ? "bg-primary/20 text-primary border-primary/30"
                                : normalizedStatus === "pending"
                                  ? "bg-muted text-muted-foreground border-border"
                                  : "bg-destructive/20 text-destructive border-destructive/30"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(p.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
