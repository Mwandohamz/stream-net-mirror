import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { trackPageView } from "@/lib/analytics";
import PageTransition from "@/components/PageTransition";
import MembershipBanner from "@/components/MembershipBanner";
import { CurrencyProvider } from "@/context/CurrencyContext";
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
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import MemberDashboard from "./pages/MemberDashboard.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";

// Admin and influencer screens are heavy (charts, tables) and only used by a
// few people — load them on demand instead of in the visitor's first download.
const Dashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const AdminPayments = lazy(() => import("./pages/admin/Payments.tsx"));
const Analytics = lazy(() => import("./pages/admin/Analytics.tsx"));
const Customers = lazy(() => import("./pages/admin/Customers.tsx"));
const AdminUsers = lazy(() => import("./pages/admin/Users.tsx"));
const AdminPlans = lazy(() => import("./pages/admin/Plans.tsx"));
const AdminEmails = lazy(() => import("./pages/admin/Emails.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/Settings.tsx"));
const SupportTickets = lazy(() => import("./pages/admin/SupportTickets.tsx"));
const Influencers = lazy(() => import("./pages/admin/Influencers.tsx"));
const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard.tsx"));
const AdminContent = lazy(() => import("./pages/admin/Content.tsx"));
import Support from "./pages/Support.tsx";
import LiveSports from "./pages/LiveSports.tsx";
import OAuthConsent from "./pages/OAuthConsent.tsx";
import InstallPrompt from "@/components/InstallPrompt";
const Movies = lazy(() => import("./pages/Movies.tsx"));
const TVSeries = lazy(() => import("./pages/TVSeries.tsx"));


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
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/payment" element={<PageTransition><Payment /></PageTransition>} />
        <Route path="/access" element={<PageTransition><Access /></PageTransition>} />
        <Route path="/signin" element={<PageTransition><SignIn /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><SignUp /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/dashboard" element={<SubscriberRoute><MemberDashboard /></SubscriberRoute>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="/admin/customers" element={<AdminRoute><Customers /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
        <Route path="/admin/emails" element={<AdminRoute><AdminEmails /></AdminRoute>} />


        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/support" element={<AdminRoute><SupportTickets /></AdminRoute>} />
        <Route path="/admin/influencers" element={<AdminRoute><Influencers /></AdminRoute>} />
        <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
        <Route path="/influencer/:promoCode" element={<InfluencerDashboard />} />
        <Route path="/live-sports" element={<PageTransition><LiveSports /></PageTransition>} />
        <Route path="/movies" element={<PageTransition><Movies /></PageTransition>} />
        <Route path="/tv-series" element={<PageTransition><TVSeries /></PageTransition>} />
        <Route path="/support" element={<PageTransition><Support /></PageTransition>} />

        <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const StatusStrip = () => {
  const location = useLocation();
  if (
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/influencer") ||
    location.pathname.startsWith("/dashboard")
  ) return null;
  return <MembershipBanner />;
};

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CurrencyProvider>
        <BrowserRouter>
          <PageViewTracker />
          <StatusStrip />
          <AnimatedRoutes />
          <InstallPrompt />
        </BrowserRouter>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
