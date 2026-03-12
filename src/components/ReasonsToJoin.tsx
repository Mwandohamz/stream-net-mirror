import { motion } from "framer-motion";

const reasons = [
  { title: "Watch on your TV", desc: "Stream on Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.", img: "/streaming-subs.jpg", reverse: false },
  { title: "Download your shows", desc: "Save your favourites and always have something to watch offline on your mobile device.", img: "/download-app.jpg", reverse: true },
  { title: "Watch everywhere", desc: "Stream unlimited content on your phone, tablet, laptop, and TV without paying more.", img: "/streaming-subs.jpg", reverse: false },
];

const ReasonsToJoin = () => {
  return (
    <section className="py-8 md:py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl md:text-5xl text-foreground text-center mb-6 md:mb-12">MORE REASONS TO JOIN</h2>

        <div className="space-y-8 md:space-y-16 max-w-5xl mx-auto">
          {reasons.map((r) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`flex flex-col ${r.reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-4 md:gap-8`}
            >
              <div className="flex-1">
                <h3 className="font-display text-xl md:text-4xl text-foreground mb-1 md:mb-3">{r.title}</h3>
                <p className="text-xs md:text-lg text-muted-foreground">{r.desc}</p>
              </div>
              <div className="flex-1">
                <img src={r.img} alt={r.title} className="rounded-xl w-full max-w-xs md:max-w-md mx-auto object-cover shadow-lg" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReasonsToJoin;
