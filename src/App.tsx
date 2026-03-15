import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";
import PageTransition from "@/components/PageTransition";
import AdminRoute from "@/components/admin/AdminRoute";
import SubscriberRoute from "@/components/SubscriberRoute";
import Index from "./pages/Index.tsx";
import Payment from "./pages/Payment.tsx";
import Access from "./pages/Access.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import NotFound from "./pages/NotFound.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import MemberDashboard from "./pages/MemberDashboard.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import AdminPayments from "./pages/admin/Payments.tsx";
import Analytics from "./pages/admin/Analytics.tsx";
import Customers from "./pages/admin/Customers.tsx";
import AdminSettings from "./pages/admin/Settings.tsx";
import SupportTickets from "./pages/admin/SupportTickets.tsx";
import Influencers from "./pages/admin/Influencers.tsx";
import InfluencerDashboard from "./pages/InfluencerDashboard.tsx";

const queryClient = new QueryClient();

const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/payment" element={<PageTransition><Payment /></PageTransition>} />
        <Route path="/access" element={<PageTransition><Access /></PageTransition>} />
        <Route path="/signin" element={<PageTransition><SignIn /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
        <Route path="/dashboard" element={<SubscriberRoute><MemberDashboard /></SubscriberRoute>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="/admin/customers" element={<AdminRoute><Customers /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/support" element={<AdminRoute><SupportTickets /></AdminRoute>} />
        <Route path="/admin/influencers" element={<AdminRoute><Influencers /></AdminRoute>} />
        <Route path="/influencer/:promoCode" element={<InfluencerDashboard />} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageViewTracker />
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
