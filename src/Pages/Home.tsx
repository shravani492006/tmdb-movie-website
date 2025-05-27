import React, { useState, useEffect } from "react";
import axios from "axios";
import Hero from "../components/Hero.tsx";
import { Award, Clock, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import MovieCarousel from "../components/MovieCarousel.tsx";

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = '7f2f096d8066b9fb6e0fa92eb590fa7e';
  const TRENDING_URL = `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`;
  const UPCOMING_URL = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`;

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const trendingResponse = await axios.get(TRENDING_URL);
        const upcomingResponse = await axios.get(UPCOMING_URL);
        setTrendingMovies(trendingResponse.data.results);
        setUpcomingMovies(upcomingResponse.data.results);
      } catch (err) {
        setError("Failed to fetch movies");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="bg-white text-black min-h-screen">
      <Hero />
      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            {
              icon: TrendingUp,
              label: "Trending",
              path: "/movies?sort=trending",
              color: "bg-yellow-300",
            },
            {
              icon: Star,
              label: "Top Rated",
              path: "/top-rated",
              color: "bg-purple-300",
            },
            {
              icon: Clock,
              label: "Coming Soon",
              path: "/coming-soon",
              color: "bg-blue-300",
            },
            {
              icon: Award,
              label: "Awards",
              path: "/awards",
              color: "bg-red-300",
            },
          ].map((category, index) => (
            <Link
              key={index}
              to={category.path}
              className={`${category.color} p-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-80 transition-opacity`}
            >
              <category.icon className="w-5 h-5 text-black" />
              <span className="font-semibold text-black">{category.label}</span>
            </Link>
          ))}
        </div>

        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
              Trending Now
            </h2>
            <Link
              to="/movies?sort=trending"
              className="text-yellow-600 hover:text-yellow-800 font-medium"
            >
              View All
            </Link>
          </div>
          <MovieCarousel movies={trendingMovies} />
        </section>

        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" />
              Coming Soon
            </h2>
            <Link
              to="/coming-soon"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </Link>
          </div>
          <MovieCarousel movies={upcomingMovies} />
        </section>

        {error && (
          <div className="text-red-500 text-center font-semibold mt-4">
            {error}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
