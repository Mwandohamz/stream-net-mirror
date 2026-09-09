import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogBrowser from "@/components/CatalogBrowser";
import { movies } from "@/data/catalog";

const Movies = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <CatalogBrowser
        title="MOVIES"
        subtitle="Blockbusters, award winners and family nights — browse by category or search for the film you want."
        items={movies}
      />
    </main>
    <Footer />
  </div>
);

export default Movies;
