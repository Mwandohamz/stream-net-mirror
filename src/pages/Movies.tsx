
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogBrowser from "@/components/CatalogBrowser";

const Movies = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <CatalogBrowser
        title="MOVIES"
        subtitle="Discover movies from around the world. Search, explore genres and find your next watch."
        mediaType="movie"
      />
    </main>
    <Footer />
  </div>
);

export default Movies;
