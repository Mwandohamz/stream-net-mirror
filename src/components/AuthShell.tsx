import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LogoShowcase from "@/components/LogoShowcase";
import moviesBackdrop from "@/assets/dashboard-movies.jpg";
import footballBackdrop from "@/assets/dashboard-football.jpg";

interface AuthShellProps {
  children: ReactNode;
  onBack: () => void;
  title: string;
  description: string;
  wide?: boolean;
}

const AuthShell = ({ children, onBack, title, description, wide = false }: AuthShellProps) => (
  <div className="auth-screen min-h-screen bg-background">
    <div className="auth-web-chrome"><Navbar /></div>
    <div className="auth-visual" aria-hidden="true">
      <img src={moviesBackdrop} alt="" className="auth-visual-top" />
      <img src={footballBackdrop} alt="" className="auth-visual-bottom" />
      <div className="auth-visual-shade" />
    </div>

    <main className="auth-scroll relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-start justify-center px-4 pb-12 pt-24 md:items-center md:px-8 md:py-28">
      <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
        <Button variant="ghost" onClick={onBack} className="auth-back mb-3 h-11 gap-2 px-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> Back
        </Button>
        <section className="auth-panel overflow-hidden rounded-lg border border-border/80 bg-card/90 shadow-2xl backdrop-blur-xl">
          <header className="border-b border-border/60 px-5 pb-5 pt-6 text-center sm:px-8">
            <div className="mx-auto mb-3 flex justify-center"><LogoShowcase size="lg" /></div>
            <h1 className="dashboard-heading text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </header>
          <div className="p-5 sm:p-8">{children}</div>
        </section>
      </div>
    </main>
    <div className="auth-web-chrome"><Footer /></div>
  </div>
);

export default AuthShell;