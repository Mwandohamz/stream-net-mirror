import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, CreditCard, BarChart3, Users, Settings, LogOut, Megaphone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, badgeKey: null },
  { title: "Payments", url: "/admin/payments", icon: CreditCard, badgeKey: "payments" },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3, badgeKey: null },
  { title: "Customers", url: "/admin/customers", icon: Users, badgeKey: "customers" },
  { title: "Support", url: "/admin/support", icon: MessageSquare, badgeKey: "tickets" },
  { title: "Influencers", url: "/admin/influencers", icon: Megaphone, badgeKey: null },
  { title: "Settings", url: "/admin/settings", icon: Settings, badgeKey: null },
] as const;

const SUCCESS_PAYMENT_STATUSES = ["completed", "success", "succeeded"];

const SEEN_KEYS = {
  payments: "admin_seen_payments_at",
  customers: "admin_seen_customers_at",
  tickets: "admin_seen_tickets_at",
} as const;

const getSeenAt = (key: string) => {
  if (typeof window === "undefined") return new Date(0).toISOString();
  return localStorage.getItem(key) || new Date(0).toISOString();
};

const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const [badges, setBadges] = useState<Record<string, number>>({});

  const markSeenForCurrentPage = useCallback((pathname: string) => {
    if (typeof window === "undefined") return;

    const now = new Date().toISOString();

    if (pathname.startsWith("/admin/payments")) {
      localStorage.setItem(SEEN_KEYS.payments, now);
      setBadges((prev) => ({ ...prev, payments: 0 }));
    }

    if (pathname.startsWith("/admin/customers")) {
      localStorage.setItem(SEEN_KEYS.customers, now);
      setBadges((prev) => ({ ...prev, customers: 0 }));
    }

    if (pathname.startsWith("/admin/support")) {
      localStorage.setItem(SEEN_KEYS.tickets, now);
      setBadges((prev) => ({ ...prev, tickets: 0 }));
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    try {
      await supabase.functions.invoke("assign-admin-role");

      const [
        { count: newPayments, error: paymentsErr },
        { count: newTickets, error: ticketsErr },
        { count: newCustomers, error: customersErr },
      ] = await Promise.all([
        supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .in("status", [...SUCCESS_PAYMENT_STATUSES, "COMPLETED", "SUCCESS", "SUCCEEDED"])
          .gt("created_at", getSeenAt(SEEN_KEYS.payments)),
        supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
          .gt("created_at", getSeenAt(SEEN_KEYS.tickets)),
        supabase
          .from("subscribers")
          .select("id", { count: "exact", head: true })
          .gt("created_at", getSeenAt(SEEN_KEYS.customers)),
      ]);

      if (paymentsErr || ticketsErr || customersErr) {
        console.error("Badge fetch error:", paymentsErr || ticketsErr || customersErr);
      }

      setBadges({
        payments: newPayments || 0,
        tickets: newTickets || 0,
        customers: newCustomers || 0,
      });
    } catch (err) {
      console.error("Badge fetch error:", err);
    }
  }, []);

  useEffect(() => {
    markSeenForCurrentPage(location.pathname);
    void fetchBadges();
  }, [location.pathname, markSeenForCurrentPage, fetchBadges]);

  useEffect(() => {
    void fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="netflix-title text-lg text-primary px-3 py-4">
            {!collapsed && "NETMIRROR ADMIN"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50 relative"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.badgeKey && badges[item.badgeKey] > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {badges[item.badgeKey]}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sign Out"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm text-muted-foreground">Admin Dashboard</span>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
