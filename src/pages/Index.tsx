import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrendingSection from "@/components/TrendingSection";
import OTTPartners from "@/components/OTTPartners";
import FeaturesGrid from "@/components/FeaturesGrid";
import ReasonsToJoin from "@/components/ReasonsToJoin";
import HowItWorks from "@/components/HowItWorks";
import AppDownload from "@/components/AppDownload";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TrendingSection />
      <OTTPartners />
      <FeaturesGrid />
      <ReasonsToJoin />
      <HowItWorks />
      <AppDownload />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
