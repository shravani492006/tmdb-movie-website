
import { Star, Trophy } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Toprated = () => {
  const movies = [
    {
      id: 278,
      title: "The Shawshank Redemption",
      rating: 9.3,
      image:
        "https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_.jpg",
      year: 1994,
      votes: "2.8M",
      rank: 1,
    },
    
    {
      id: 1022256,
    title: "Selena Gomez: My Mind & Me",
    rating: 8.5,
    image:
      "https://image.tmdb.org/t/p/w500//usJxHVxT70lAA7AynnZlmPth7R3.jpg",
    year: 2022,
    votes: "N/A",
    rank: 2,
    },
    {
       id: 19404,
      title: "Dilwale Dulhania Le Jayenge",
      rating: 8.0,
      image:
        "https://image.tmdb.org/t/p/w500//rfcy6Gd3PbFIqwZX5U8xnbv7jOc.jpg",
      year: 1995,
      votes: "100K",
      rank: 3,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8" style={{ backgroundColor: "#ffffff", color: "#000000" }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-8"
      >
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h1 className="text-3xl font-bold" style={{ color: "#000000" }}>
          Top Rated Movies
        </h1>
      </motion.div>
      <div className="space-y-6">
        {movies.map((movie, index) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={`/movie/${movie.id}`}>
              <div
                className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                style={{ backgroundColor: "#f9f9f9", color: "#000000" }}
              >
                <div className="flex">
                  <div
                    className="w-16 flex items-center justify-center font-bold text-xl"
                    style={{ backgroundColor: "#ffeb3b", color: "#000000" }}
                  >
                    #{movie.rank}
                  </div>
                  <div className="relative w-48">
                    <img
                      src={movie.image}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold" style={{ color: "#000000" }}>
                        {movie.title}
                      </h2>
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-full"
                        style={{ backgroundColor: "#f0f0f0", color: "#000000" }}
                      >
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{movie.rating}</span>
                      </div>
                    </div>
                    <div style={{ color: "#666666" }}>
                      <span>{movie.year}</span>
                      <span className="mx-2">•</span>
                      <span>{movie.votes} votes</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Toprated;
