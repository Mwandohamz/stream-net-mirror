/**
 * Curated catalogue used by the Movies and TV Series pages.
 * Posters come from TMDB's public image CDN; nothing is streamed here — every
 * action sends the visitor to create an account and unlock the real links.
 */
export interface CatalogItem {
  title: string;
  year: string;
  rating: string;
  genre: string;
  platform: string;
  poster: string;
  desc: string;
  categories: string[];
}

const img = (p: string) => `https://image.tmdb.org/t/p/w342${p}`;

export const movies: CatalogItem[] = [
  { title: "Oppenheimer", year: "2023", rating: "8.4", genre: "Drama · History", platform: "Netflix", poster: img("/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"), desc: "The story of J. Robert Oppenheimer and the race to build the atomic bomb — a portrait of genius, guilt and the moment the world changed forever.", categories: ["Trending", "Award Winners"] },
  { title: "Dune: Part Two", year: "2024", rating: "8.2", genre: "Sci-Fi · Adventure", platform: "HBO Max", poster: img("/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"), desc: "Paul Atreides unites with the Fremen to wage war against the House Harkonnen, torn between the love of his life and the fate of the universe.", categories: ["Trending", "Sci-Fi"] },
  { title: "Barbie", year: "2023", rating: "7.0", genre: "Comedy · Fantasy", platform: "HBO Max", poster: img("/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg"), desc: "Barbie suffers a crisis that leads her to question her world and her existence — a bright, sharp comedy about being real.", categories: ["Trending", "Comedy"] },
  { title: "John Wick: Chapter 4", year: "2023", rating: "7.7", genre: "Action · Thriller", platform: "Prime Video", poster: img("/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg"), desc: "With the price on his head ever increasing, John Wick takes his fight against the High Table global, hunted from New York to Osaka to Paris.", categories: ["Action", "Trending"] },
  { title: "Spider-Man: Across the Spider-Verse", year: "2023", rating: "8.4", genre: "Animation · Action", platform: "Netflix", poster: img("/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"), desc: "Miles Morales is catapulted across the multiverse, where he encounters a team of Spider-People charged with protecting its very existence.", categories: ["Animation", "Family"] },
  { title: "The Batman", year: "2022", rating: "7.7", genre: "Crime · Mystery", platform: "HBO Max", poster: img("/74xTEgt7R36Fpooo50r9T25onhq.jpg"), desc: "In his second year of fighting crime, Batman uncovers corruption in Gotham that connects to his own family while facing the Riddler.", categories: ["Action", "Crime"] },
  { title: "Top Gun: Maverick", year: "2022", rating: "8.2", genre: "Action · Drama", platform: "Paramount+", poster: img("/62HCnUTziyWcpDaBO2i1DX17ljH.jpg"), desc: "After thirty years, Maverick trains a detachment of graduates for a specialised mission — and confronts the ghosts of his past.", categories: ["Action", "Award Winners"] },
  { title: "Everything Everywhere All at Once", year: "2022", rating: "7.8", genre: "Sci-Fi · Comedy", platform: "Prime Video", poster: img("/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg"), desc: "An ageing Chinese immigrant is swept up in an insane adventure where she alone can save the world by exploring other universes.", categories: ["Award Winners", "Sci-Fi"] },
  { title: "Avatar: The Way of Water", year: "2022", rating: "7.6", genre: "Sci-Fi · Adventure", platform: "Disney+", poster: img("/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg"), desc: "Jake Sully and Neytiri have formed a family and must leave their home to explore the reefs of Pandora when an ancient threat returns.", categories: ["Sci-Fi", "Family"] },
  { title: "Killers of the Flower Moon", year: "2023", rating: "7.5", genre: "Crime · Drama", platform: "Apple TV+", poster: img("/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg"), desc: "Members of the Osage tribe are murdered under mysterious circumstances in the 1920s, sparking a major FBI investigation.", categories: ["Award Winners", "Crime"] },
  { title: "Guardians of the Galaxy Vol. 3", year: "2023", rating: "7.9", genre: "Action · Comedy", platform: "Disney+", poster: img("/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg"), desc: "Peter Quill rallies his team to defend the universe and protect one of their own — a mission that could end the Guardians.", categories: ["Action", "Family"] },
  { title: "The Whale", year: "2022", rating: "7.7", genre: "Drama", platform: "Prime Video", poster: img("/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg"), desc: "A reclusive English teacher attempts to reconnect with his estranged teenage daughter in a raw, intimate drama about second chances.", categories: ["Award Winners", "Drama"] },
  { title: "Mission: Impossible — Dead Reckoning", year: "2023", rating: "7.6", genre: "Action · Thriller", platform: "Paramount+", poster: img("/NNxYkU70HPurnNCSiCjYAmacwm.jpg"), desc: "Ethan Hunt and his team race to track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.", categories: ["Action", "Trending"] },
  { title: "Elemental", year: "2023", rating: "7.5", genre: "Animation · Romance", platform: "Disney+", poster: img("/8riWcADI1ekEiBguVB9vkilhiQm.jpg"), desc: "In a city where fire, water, land and air residents live together, a fiery young woman and a go-with-the-flow guy discover how much they have in common.", categories: ["Animation", "Family"] },
  { title: "The Menu", year: "2022", rating: "7.2", genre: "Thriller · Comedy", platform: "HBO Max", poster: img("/v31MsWhF9WFh7Qooq6xSBbmJxoG.jpg"), desc: "A couple travels to a remote island to eat at an exclusive restaurant where the chef has prepared a lavish — and deadly — menu.", categories: ["Thriller", "Comedy"] },
  { title: "Nope", year: "2022", rating: "6.9", genre: "Horror · Sci-Fi", platform: "Prime Video", poster: img("/AcKVlWaNVVVFQwro3nLXqPljcYA.jpg"), desc: "Residents of a lonely gulch in inland California bear witness to an uncanny and chilling discovery in the sky above them.", categories: ["Thriller", "Sci-Fi"] },
];

export const series: CatalogItem[] = [
  { title: "Stranger Things", year: "2022", rating: "8.7", genre: "Sci-Fi · Thriller", platform: "Netflix", poster: img("/49WJfeN0moxb9IPfGn8AIqMGskD.jpg"), desc: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.", categories: ["Trending", "Sci-Fi"] },
  { title: "The Last of Us", year: "2023", rating: "8.6", genre: "Drama · Thriller", platform: "HBO Max", poster: img("/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg"), desc: "Twenty years after modern civilisation collapsed, a hardened survivor is hired to smuggle a fourteen-year-old girl out of an oppressive quarantine zone.", categories: ["Trending", "Drama"] },
  { title: "House of the Dragon", year: "2024", rating: "8.4", genre: "Fantasy · Drama", platform: "HBO Max", poster: img("/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg"), desc: "The Targaryen dynasty is at the absolute apex of its power, with more than fifteen dragons under its yoke — and a civil war brewing within.", categories: ["Trending", "Fantasy"] },
  { title: "The Bear", year: "2024", rating: "8.4", genre: "Comedy · Drama", platform: "Disney+", poster: img("/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg"), desc: "A young chef from the fine dining world returns to Chicago to run his family's chaotic sandwich shop after a heartbreaking death.", categories: ["Award Winners", "Comedy"] },
  { title: "The Witcher", year: "2023", rating: "8.2", genre: "Fantasy · Action", platform: "Netflix", poster: img("/7vjaCdMw15FEbXyLQTVa04URsPm.jpg"), desc: "Geralt of Rivia, a mutated monster-hunter, struggles to find his place in a world where people often prove more wicked than beasts.", categories: ["Fantasy", "Action"] },
  { title: "Wednesday", year: "2022", rating: "8.1", genre: "Comedy · Mystery", platform: "Netflix", poster: img("/9PFonBhy4cQy7Jz20NpMygczOkv.jpg"), desc: "Wednesday Addams investigates a murder spree while making new friends and foes at Nevermore Academy.", categories: ["Trending", "Mystery"] },
  { title: "Succession", year: "2023", rating: "8.9", genre: "Drama", platform: "HBO Max", poster: img("/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg"), desc: "The Roy family controls the biggest media conglomerate in the world — and their children fight viciously over who inherits it.", categories: ["Award Winners", "Drama"] },
  { title: "Ted Lasso", year: "2023", rating: "8.4", genre: "Comedy · Sport", platform: "Apple TV+", poster: img("/5fhZdwP1DVJ0FyVH6vrFdHwpXIn.jpg"), desc: "An American football coach is hired to manage an English Premier League club despite having no experience — and wins hearts anyway.", categories: ["Comedy", "Award Winners"] },
  { title: "The Mandalorian", year: "2023", rating: "8.5", genre: "Sci-Fi · Adventure", platform: "Disney+", poster: img("/eU1i6eHXlzMOlEq0ku1Rzq7Y4wA.jpg"), desc: "A lone bounty hunter travels the outer reaches of the galaxy, far from the authority of the New Republic, protecting a mysterious child.", categories: ["Sci-Fi", "Family"] },
  { title: "Squid Game", year: "2024", rating: "8.0", genre: "Thriller · Drama", platform: "Netflix", poster: img("/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg"), desc: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games for a tempting prize — with deadly stakes.", categories: ["Trending", "Thriller"] },
  { title: "Money Heist", year: "2021", rating: "8.3", genre: "Crime · Drama", platform: "Netflix", poster: img("/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg"), desc: "A criminal mastermind recruits a band of eight to carry out the biggest heist in recorded history inside the Royal Mint of Spain.", categories: ["Crime", "Thriller"] },
  { title: "Dark", year: "2020", rating: "8.8", genre: "Sci-Fi · Mystery", platform: "Netflix", poster: img("/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg"), desc: "A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery spanning three generations.", categories: ["Sci-Fi", "Mystery"] },
  { title: "The Boys", year: "2024", rating: "8.4", genre: "Action · Sci-Fi", platform: "Prime Video", poster: img("/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg"), desc: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers — and the corporation that protects them.", categories: ["Action", "Trending"] },
  { title: "Severance", year: "2022", rating: "8.4", genre: "Thriller · Sci-Fi", platform: "Apple TV+", poster: img("/lFf6LLrQjYldcZItzOkGmMMigP7.jpg"), desc: "Employees undergo a procedure separating their work and personal memories — until one begins to unravel what the company is hiding.", categories: ["Award Winners", "Sci-Fi"] },
  { title: "Peaky Blinders", year: "2022", rating: "8.5", genre: "Crime · Drama", platform: "Netflix", poster: img("/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg"), desc: "A gangster family epic set in 1900s England, centring on a gang who sew razor blades in the peaks of their caps.", categories: ["Crime", "Drama"] },
  { title: "Ozark", year: "2022", rating: "8.5", genre: "Crime · Thriller", platform: "Netflix", poster: img("/pCGyPVrI9Fzw6RCBxJmEsDOxt3.jpg"), desc: "A financial adviser drags his family to the Missouri Ozarks, where he must launder money for a drug cartel to stay alive.", categories: ["Crime", "Thriller"] },
];

export const categoriesOf = (items: CatalogItem[]) =>
  Array.from(new Set(items.flatMap((i) => i.categories)));
