import { useEffect, useState } from "react";
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
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchBadges = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [
        { count: todayPayments },
        { count: openTickets },
        { count: totalCustomers },
      ] = await Promise.all([
        supabase.from("payments").select("*", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("subscribers").select("*", { count: "exact", head: true }),
      ]);
      setBadges({
        payments: todayPayments || 0,
        tickets: openTickets || 0,
        customers: totalCustomers || 0,
      });
    } catch (err) {
      console.error("Badge fetch error:", err);
    }
  };

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
