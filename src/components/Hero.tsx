import React, { useEffect, useState } from "react";
import { Play, Star, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

interface Movie {
  backdrop_path: string | null;
  vote_average: number | null;
  release_date: string | null;
  title: string;
  overview: string | null;
  id: number;
  trailers: { key: string }[];
}

const Hero = () => {
  const [currentMovie, setCurrentMovie] = useState(0);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const API_KEY = '7f2f096d8066b9fb6e0fa92eb590fa7e';
  const TRENDING_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`;

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        const response = await axios.get(TRENDING_URL);
        const movies = response.data.results;

        // Fetch trailers for each movie
        const moviesWithTrailers = await Promise.all(
          movies.map(async (movie: Movie) => {
            const trailerResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}`
            );
            return { ...movie, trailers: trailerResponse.data.results };
          })
        );

        setTrendingMovies(moviesWithTrailers);
      } catch (error) {
        console.error("Failed to fetch trending movies", error);
      }
    };

    fetchTrendingMovies();
    const timer = setInterval(() => {
      setCurrentMovie((prev) => (prev + 1) % trendingMovies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [trendingMovies.length]);

  const movie: Movie | undefined = trendingMovies[currentMovie];

  return (
    <div className="relative h-[90vh] bg-gradient-to-b from-transparent to-white">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 gradient-mask"
        style={{
          backgroundImage: `url('${
            movie?.backdrop_path
              ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
              : ""
          }')`,
          filter: "brightness(90%)",
        }}
      >
        <div className="absolute inset-0 bg-white/30" />
      </div>

      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-yellow-600 font-semibold">
                {movie?.vote_average} Rating
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-gray-800">{movie?.release_date}</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-gray-900 drop-shadow-md">
            {movie?.title}
          </h1>
          <p className="text-gray-800 text-lg mb-8 line-clamp-3 max-w-xl">
            {movie?.overview}
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="#"
              onClick={() =>
                window.open(
                  `https://www.youtube.com/watch?v=${movie?.trailers[0]?.key}`,
                  "_blank"
                )
              }
              className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-yellow-300 transition-all hover:scale-105 duration-300 no-underline shadow-md"
            >
              <Play className="w-5 h-5" />
              Watch Trailer
            </Link>
            <Link
              to={`/movie/${movie?.id}`}
              className="bg-white/70 backdrop-blur-md text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all hover:scale-105 duration-300 no-underline shadow-md"
            >
              More Info
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 right-4 flex gap-2">
          {trendingMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMovie(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentMovie === index
                  ? "bg-yellow-500 w-8"
                  : "bg-gray-400 w-4 hover:bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
