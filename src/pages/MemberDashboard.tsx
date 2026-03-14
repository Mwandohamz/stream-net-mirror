import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ExternalLink, Download, Globe, Smartphone, Monitor,
  MessageCircle, Send, LogOut, Shield, Play, ChevronRight,
  AlertTriangle, CheckCircle2
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email || "");
      }
    });
  }, []);

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
    }
    setTicketLoading(false);
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
                <a
                  href="https://net22.cc/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold text-lg gap-2 active:scale-95 transition-transform">
                    Launch Streaming Portal <ChevronRight size={20} />
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

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
              <CardTitle className="netflix-title text-lg text-foreground">DOWNLOAD THE APP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <Smartphone size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-foreground font-medium text-sm">Android APK</p>
                  <p className="text-xs text-muted-foreground mb-3">Direct download from portal</p>
                  <a href="https://net22.cc/home" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                      <Download size={14} /> Download
                    </Button>
                  </a>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <Monitor size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-foreground font-medium text-sm">iOS WebView</p>
                  <p className="text-xs text-muted-foreground mb-3">Via DODO / iOSMirror</p>
                  <a href="https://net22.cc/home" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                      <ExternalLink size={14} /> Learn More
                    </Button>
                  </a>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <Globe size={24} className="text-primary mx-auto mb-2" />
                  <p className="text-foreground font-medium text-sm">Web Browser</p>
                  <p className="text-xs text-muted-foreground mb-3">Stream directly</p>
                  <a href="https://net22.cc/home" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="w-full border-border text-foreground gap-1">
                      <Globe size={14} /> Open
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Support */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="netflix-title text-lg text-foreground">CUSTOMER SUPPORT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://wa.me/260000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-border text-foreground gap-2">
                    <MessageCircle size={16} /> WhatsApp Support
                  </Button>
                </a>
                <a href="mailto:onlineplagiarismremover@gmail.com" className="flex-1">
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
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default MemberDashboard;
