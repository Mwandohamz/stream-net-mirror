import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ExternalLink, Download, Globe, Smartphone, Monitor,
  MessageCircle, Send, LogOut, Shield, Play, ChevronRight,
  AlertTriangle, CheckCircle2, Info, RefreshCw, Laptop, Lock, Eye, EyeOff, Settings
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";

import netflixLogo from "@/assets/ott/netflix.jpg";
import disneyLogo from "@/assets/ott/disney-plus.jpg";
import hboLogo from "@/assets/ott/hbo-max.jpg";
import hotstarLogo from "@/assets/ott/jiohotstar.jpg";
import appleTvLogo from "@/assets/ott/apple-tv.jpg";
import paramountLogo from "@/assets/ott/paramount.jpg";

const ottPlatforms = [
  { name: "Netflix", logo: netflixLogo },
  { name: "Disney+", logo: disneyLogo },
  { name: "HBO Max", logo: hboLogo },
  { name: "JioHotstar", logo: hotstarLogo },
  { name: "Apple TV+", logo: appleTvLogo },
  { name: "Paramount+", logo: paramountLogo },
];

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useAppSettings();
  const portalUrl = settings.portal_url || "https://net22.cc/home";
  const [userName, setUserName] = useState("");
  const [showPortal, setShowPortal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [showBackupLinks, setShowBackupLinks] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  const [paymentReceipt, setPaymentReceipt] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const streamingLink1 = settings.streaming_link_1 || "";
  const streamingLink2 = settings.streaming_link_2 || "";
  const streamingLink3 = settings.streaming_link_3 || "";

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email || "");
        setUserEmail(session.user.email || "");
        fetchTickets(session.user.id);

        // Fetch payment receipt via subscriber's payment_id FK
        const { data: subscriber } = await supabase
          .from("subscribers")
          .select("payment_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (subscriber?.payment_id) {
          const { data: payment } = await supabase
            .from("payments")
            .select("*")
            .eq("id", subscriber.payment_id)
            .single();
          if (payment) setPaymentReceipt(payment);
        } else {
          // Fallback to email query for manually created accounts
          const email = session.user.email;
          if (email) {
            const { data } = await supabase
              .from("payments")
              .select("*")
              .eq("email", email)
              .eq("status", "completed")
              .order("created_at", { ascending: false })
              .limit(1);
            if (data && data.length > 0) setPaymentReceipt(data[0]);
          }
        }
      }
    });
  }, []);

  const fetchTickets = async (userId: string) => {
    const { data } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setTickets((data || []) as unknown as Ticket[]);
  };

  const fetchTicketMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from("ticket_messages" as any)
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setTicketMessages(prev => ({ ...prev, [ticketId]: (data || []) as unknown as TicketMessage[] }));
  };

  const handleExpandTicket = (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
    } else {
      setExpandedTicket(ticketId);
      fetchTicketMessages(ticketId);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setReplySending(true);
    await supabase.from("ticket_messages" as any).insert({
      ticket_id: ticketId,
      sender_role: "user",
      message: replyText.trim(),
    } as any);
    setReplyText("");
    await fetchTicketMessages(ticketId);
    setReplySending(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from("support_tickets" as any).insert({
        user_id: session.user.id,
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        status: "open",
      } as any);
      setTicketSubject("");
      setTicketMessage("");
      toast({ title: "Ticket submitted!", description: "We'll respond as soon as possible." });
      fetchTickets(session.user.id);
    }
    setTicketLoading(false);
  };

  const handleWhatsApp = () => {
    toast({ title: "Coming Soon", description: "WhatsApp support is not available at the moment." });
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "Your password has been changed successfully." });
      setNewPassword("");
      setConfirmNewPassword("");
      setShowAccountSettings(false);
    }
    setPasswordLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="netflix-title text-2xl md:text-4xl text-foreground">
                WELCOME, {userName.toUpperCase()}!
              </h1>
              <p className="text-sm text-muted-foreground">Your StreamNetMirror membership is active</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              <LogOut size={16} className="mr-1" /> Sign Out
            </Button>
          </div>

          {/* Important Notice */}
          <Card className="bg-accent/10 border-accent/30 border-2">
            <CardContent className="p-4 md:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Info size={20} className="text-accent-foreground shrink-0" />
                <h2 className="netflix-title text-base md:text-lg text-foreground">IMPORTANT — PLEASE READ</h2>
              </div>
              <div className="space-y-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">StreamNetMirror</strong> facilitates easy, cheap, <strong className="text-foreground">lifetime streaming access</strong> by mirroring popular platforms like Netflix, Disney+, HBO Max and more. Think of it as a clone of the most popular streaming services — all in one place, forever free after your one-time payment.
                </p>
                <p>
                  <AlertTriangle size={14} className="inline text-primary mr-1" />
                  <strong className="text-foreground">Links may change or temporarily go down</strong> — especially for <strong className="text-foreground">iOS / WebView / browser users</strong>. If a link stops working, simply <strong className="text-foreground">come back to this dashboard</strong> to get the latest refreshed links.
                </p>
                <p>
                  <RefreshCw size={14} className="inline text-primary mr-1" />
                  Occasional lags or downtime are normal. The service will always remain free and active — we continuously update links and mirrors to keep everything working.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Streaming Portal Access */}
          <Card className="bg-card border-primary/30 border-2">
            <CardContent className="p-5 md:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Play size={20} className="text-primary fill-primary" />
                <h2 className="netflix-title text-xl md:text-2xl text-foreground">START STREAMING</h2>
              </div>

              <div className="bg-secondary/60 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">How to use StreamNetMirror:</h3>
                <ol className="space-y-2 text-xs md:text-sm text-muted-foreground list-decimal list-inside">
                  <li>Click the <span className="text-primary font-semibold">"Launch Streaming Portal"</span> button below</li>
                  <li>You'll be redirected to the official StreamNetMirror portal</li>
                  <li>Sign in using <span className="text-primary font-semibold">Google Authentication</span> for the best experience</li>
                  <li>Browse and stream from 50+ platforms including Netflix, Disney+, HBO Max, and more</li>
                </ol>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  <strong className="text-foreground">For mobile users:</strong> You may be prompted to download the official app.
                  Please accept and grant the necessary permissions to install the application for the best streaming experience.
                </p>
              </div>

              {!showPortal ? (
                <Button
                  onClick={() => setShowPortal(true)}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold text-base gap-2 active:scale-95 transition-transform"
                >
                  <Shield size={18} /> I Understand — Show Portal Access
                </Button>
              ) : (
                <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold text-lg gap-2 active:scale-95 transition-transform">
                    Launch Streaming Portal <ChevronRight size={20} />
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          {/* Official Backup Links */}
          {(streamingLink1 || streamingLink2 || streamingLink3) && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBackupLinks(!showBackupLinks)}
                  className="w-full border-border text-foreground gap-2"
                >
                  <Globe size={16} className="text-primary" />
                  {showBackupLinks ? "Hide" : "Show"} Official Backup Links
                  <ChevronRight size={16} className={`ml-auto transition-transform ${showBackupLinks ? "rotate-90" : ""}`} />
                </Button>
                {showBackupLinks && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">If the main portal is down, try these official backup links:</p>
                    {[
                      { label: "Official Link 1", url: streamingLink1 },
                      { label: "Official Link 2", url: streamingLink2 },
                      { label: "Official Link 3", url: streamingLink3 },
                    ].filter(l => l.url).map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="outline" size="sm" className="w-full border-border text-foreground gap-2 justify-start">
                          <ExternalLink size={14} className="text-primary" />
                          {link.label}
                          <span className="text-xs text-muted-foreground ml-auto truncate max-w-[200px]">{link.url}</span>
                        </Button>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Receipt */}
          {paymentReceipt && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="netflix-title text-lg text-foreground flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  PAYMENT RECEIPT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Name</p>
                    <p className="text-foreground font-medium">{paymentReceipt.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Email</p>
                    <p className="text-foreground font-medium">{paymentReceipt.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Amount</p>
                    <p className="text-foreground font-medium">{paymentReceipt.currency || "ZMW"} {paymentReceipt.amount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Provider</p>
                    <p className="text-foreground font-medium capitalize">{paymentReceipt.provider}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <Badge className="bg-green-500/20 text-green-500 text-[10px]">{paymentReceipt.status}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Date</p>
                    <p className="text-foreground font-medium">{new Date(paymentReceipt.created_at).toLocaleDateString()}</p>
                  </div>
                  {paymentReceipt.transaction_id && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground">Transaction ID</p>
                      <p className="text-foreground font-mono text-xs">{paymentReceipt.transaction_id}</p>
                    </div>
                  )}
                  {paymentReceipt.promo_code && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground">Promo Code Applied</p>
                      <p className="text-primary font-medium">{paymentReceipt.promo_code} ({paymentReceipt.discount_applied}% off)</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platforms grid */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">PLATFORMS YOU CAN ACCESS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {ottPlatforms.map((p) => (
                  <div key={p.name} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden bg-secondary">
                      <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{p.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-3">+ 44 more streaming platforms available</p>
            </CardContent>
          </Card>

          {/* Download Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">DOWNLOAD & ACCESS</CardTitle>
              <p className="text-xs text-muted-foreground">Choose the best option for your device</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center border-2 border-primary/30 relative">
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px]">
                    RECOMMENDED FOR ANDROID
                  </Badge>
                  <Smartphone size={24} className="text-primary mx-auto mb-2 mt-2" />
                  <p className="text-foreground font-medium text-sm">Android APK</p>
                  <p className="text-xs text-muted-foreground mb-3">Best experience — direct download</p>
                  {settings.apk_file_name ? (
                    <a
                      href={supabase.storage.from("app-files").getPublicUrl(settings.apk_file_name).data.publicUrl}
                      download
                    >
                      <Button size="sm" className="w-full bg-primary text-primary-foreground gap-1">
                        <Download size={14} /> Download APK
                      </Button>
                    </a>
                  ) : (
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="w-full bg-primary text-primary-foreground gap-1">
                        <Download size={14} /> Download
                      </Button>
                    </a>
                  )}
                </div>

                <div className="bg-secondary rounded-lg p-4 text-center border-2 border-accent/30 relative">
                  <Badge variant="secondary" className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px]">
                    RECOMMENDED FOR iPHONE / LAPTOP
                  </Badge>
                  <Laptop size={24} className="text-primary mx-auto mb-2 mt-2" />
                  <p className="text-foreground font-medium text-sm">Web Browser</p>
                  <p className="text-xs text-muted-foreground mb-3">Stream on any browser</p>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                      <Globe size={14} /> Open in Browser
                    </Button>
                  </a>
                </div>

                <div className="bg-secondary rounded-lg p-4 text-center">
                  <Monitor size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-foreground font-medium text-sm">iOS WebView</p>
                  <p className="text-xs text-muted-foreground mb-3">Via DODO / iOSMirror</p>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                      <ExternalLink size={14} /> Learn More
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <Button
                variant="outline"
                onClick={() => setShowAccountSettings(!showAccountSettings)}
                className="w-full border-border text-foreground gap-2"
              >
                <Settings size={16} className="text-primary" />
                {showAccountSettings ? "Hide" : "Show"} Account Settings
                <ChevronRight size={16} className={`ml-auto transition-transform ${showAccountSettings ? "rotate-90" : ""}`} />
              </Button>
              {showAccountSettings && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Email (read-only)</Label>
                    <Input value={userEmail} readOnly className="bg-secondary border-border text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">New Password</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="pl-9 pr-10 bg-secondary border-border text-foreground"
                        type={showPassword ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Confirm New Password</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="pl-9 bg-secondary border-border text-foreground"
                        type={showPassword ? "text" : "password"}
                      />
                    </div>
                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                      <p className="text-xs text-destructive">Passwords don't match</p>
                    )}
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading || newPassword.length < 6 || newPassword !== confirmNewPassword}
                    className="bg-primary text-primary-foreground hover:bg-primary/80"
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Support */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">CUSTOMER SUPPORT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border text-foreground gap-2"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle size={16} /> WhatsApp Support
                </Button>
                <a href="mailto:shuvaegonera@gmail.com" className="flex-1">
                  <Button variant="outline" className="w-full border-border text-foreground gap-2">
                    <Send size={16} /> Email Support
                  </Button>
                </a>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  Submit a Support Ticket
                </h4>
                <p className="text-xs text-muted-foreground">Having issues? Submit a ticket and we'll respond immediately.</p>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Subject</Label>
                  <Input
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="bg-secondary border-border text-foreground"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Message</Label>
                  <Textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="bg-secondary border-border text-foreground min-h-[80px]"
                    maxLength={1000}
                  />
                </div>
                <Button
                  onClick={handleSubmitTicket}
                  disabled={!ticketSubject.trim() || !ticketMessage.trim() || ticketLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/80"
                >
                  {ticketLoading ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>

              {tickets.length > 0 && (
                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">My Tickets</h4>
                  <div className="space-y-2">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-secondary rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleExpandTicket(ticket.id)}
                          className="w-full p-3 flex items-center justify-between text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">{ticket.subject}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={ticket.status === "open" ? "default" : ticket.status === "closed" ? "secondary" : "outline"} className="text-[10px] shrink-0 ml-2">
                            {ticket.status}
                          </Badge>
                        </button>

                        {expandedTicket === ticket.id && (
                          <div className="border-t border-border p-3 space-y-3">
                            <div className="bg-background rounded p-2">
                              <p className="text-[10px] text-muted-foreground mb-1">You (original message):</p>
                              <p className="text-xs text-foreground">{ticket.message}</p>
                            </div>

                            {(ticketMessages[ticket.id] || []).map((msg) => (
                              <div
                                key={msg.id}
                                className={`rounded p-2 ${msg.sender_role === "admin" ? "bg-primary/10 border border-primary/20" : "bg-background"}`}
                              >
                                <p className="text-[10px] text-muted-foreground mb-1">
                                  {msg.sender_role === "admin" ? "Support Team" : "You"} — {new Date(msg.created_at).toLocaleString()}
                                </p>
                                <p className="text-xs text-foreground">{msg.message}</p>
                              </div>
                            ))}

                            {ticket.status !== "closed" && (
                              <div className="flex gap-2">
                                <Input
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Type a reply..."
                                  className="bg-background border-border text-foreground text-xs"
                                  onKeyDown={(e) => e.key === "Enter" && handleSendReply(ticket.id)}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSendReply(ticket.id)}
                                  disabled={replySending || !replyText.trim()}
                                  className="bg-primary text-primary-foreground shrink-0"
                                >
                                  <Send size={14} />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default MemberDashboard;
