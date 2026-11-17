
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogBrowser from "@/components/CatalogBrowser";

const TVSeries = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <CatalogBrowser
        title="TV SERIES"
        subtitle="Explore series from around the world. Browse trending shows, discover genres and search for your favourites."
        mediaType="tv"
      />
    </main>
    <Footer />
  </div>
);

export default TVSeries;
