import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Movie {
  title: string;
  release_date: string;
}

interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  movies: Movie[];
}

const FavoriteActorPage: React.FC = () => {
  const [favoriteActors, setFavoriteActors] = useState<Actor[]>([]);

  useEffect(() => {
    const storedFavorites = JSON.parse(localStorage.getItem("favoriteActors") || "[]");
    setFavoriteActors(storedFavorites);
  }, []);

  if (!favoriteActors.length) {
    return (
      <div className="text-center mt-12 text-black bg-white min-h-screen flex flex-col justify-center items-center px-4">
        <h1 className="text-3xl font-bold mb-4">No Favorite Actors Found</h1>
        <p className="text-lg">Add your favorite actors to see them here.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-8 px-4 py-8 bg-white text-black min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center">Favorite Actors</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {favoriteActors.map((actor) => (
          <div
            key={actor.id}
            className="p-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all bg-yellow-100 flex flex-col items-center"
          >
            <img
              src={
                actor.profile_path
                  ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                  : "/placeholder-profile.jpg"
              }
              alt={actor.name}
              className="w-full h-48 object-cover rounded-lg shadow-md"
            />
            <h2 className="mt-3 text-xl font-semibold">{actor.name}</h2>
            <p className="text-md font-medium mt-1 text-gray-700">
              {actor.known_for_department}
            </p>
            <Link
              to={`/actor/${actor.id}`}
              className="mt-4 text-yellow-600 hover:text-yellow-800 font-semibold"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoriteActorPage;
