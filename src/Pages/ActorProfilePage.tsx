import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Actor {
  id: number;
  name: string;
  profile_path: string;
}

const ActorProfiles = () => {
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<{ [key: number]: string[] }>({});

  useEffect(() => {
    const fetchPopularActors = async () => {
      try {
        const response = await axios.get(
          'https://api.themoviedb.org/3/person/popular?api_key=734a09c1281680980a71703eb69d9571'
        );
        setActors(response.data.results.slice(0, 100));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching popular actors:', error);
        setLoading(false);
      }
    };

    fetchPopularActors();
  }, []);

  useEffect(() => {
    const fetchMoviesForActors = async () => {
      const actorMovies: { [key: number]: string[] } = {};
      for (const actor of actors) {
        try {
          const response = await axios.get(
            `https://api.themoviedb.org/3/person/${actor.id}/movie_credits?api_key=734a09c1281680980a71703eb69d9571`
          );
          actorMovies[actor.id] = response.data.cast.map(
            (movie: { title: string }) => movie.title
          );
        } catch (error) {
          console.error(`Error fetching movies for actor ${actor.id}:`, error);
          actorMovies[actor.id] = [];
        }
      }
      setMovies(actorMovies);
    };

    if (actors.length > 0) {
      fetchMoviesForActors();
    }
  }, [actors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-black">
        <div className="animate-spin h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
        <span className="ml-4 text-lg">Loading Popular Actors...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-white text-black min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center">Popular Actors</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {actors.map((actor) => (
          <Link
            key={actor.id}
            to={`/actor/${actor.id}`}
            className="bg-yellow-100 hover:bg-yellow-200 rounded-lg shadow-lg p-4 flex flex-col items-center no-underline transition-transform transform hover:scale-105"
          >
            <img
              src={
                actor.profile_path
                  ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                  : '/placeholder-profile.jpg'
              }
              alt={actor.name}
              className="w-full h-48 object-cover rounded-lg shadow-md"
            />
            <h2 className="text-xl font-semibold mt-3">{actor.name}</h2>
            <h3 className="mt-2 text-md font-medium">Movies:</h3>
            <ul className="mt-1 list-disc list-inside text-sm text-gray-700">
              {movies[actor.id] && movies[actor.id].length > 0 ? (
                movies[actor.id].slice(0, 3).map((movie, index) => (
                  <li key={index}>{movie}</li>
                ))
              ) : (
                <li>No movies found</li>
              )}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ActorProfiles;
