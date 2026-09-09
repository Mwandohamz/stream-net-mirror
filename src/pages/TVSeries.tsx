import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogBrowser from "@/components/CatalogBrowser";
import { series } from "@/data/catalog";

const TVSeries = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <CatalogBrowser
        title="TV SERIES"
        subtitle="The shows everyone is talking about, sorted the way you actually watch them — trending, drama, sci-fi and more."
        items={series}
      />
    </main>
    <Footer />
  </div>
);

export default TVSeries;
