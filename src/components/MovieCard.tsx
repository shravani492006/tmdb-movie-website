import { Star } from "lucide-react";
import React, { useState } from "react";

const genreMapping = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
};

const MovieCard = ({ title, vote_average, backdrop_path, release_date, genre_ids, id }) => {
    const [trailerUrl, setTrailerUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    const handleMouseEnter = async () => {
        setIsPlaying(true);
        const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=YOUR_API_KEY`);
        const data = await response.json().catch(() => null);
        if (data && data.results) {
            const trailer = data.results.find(video => video.type === 'Trailer');
            if (trailer) {
                setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
            }
        }
    };

    const image = `https://image.tmdb.org/t/p/original${backdrop_path}`;
    const year = release_date ? new Date(release_date).getFullYear() : 'N/A';
    const rating = vote_average ? vote_average.toFixed(1) : 'N/A';

    const handleMouseLeave = () => {
        setIsPlaying(false);
        setTrailerUrl('');
    };

    return (
        <div
            className="bg-white/90 rounded-xl overflow-hidden movie-card-hover backdrop-blur-sm shadow-md"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-sm border border-gray-200">
                <div className="relative aspect-video group">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300 rounded-t-xl"
                    />
                    <div className="absolute top-4 right-4 bg-white/70 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-600 font-medium">{rating}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-1 flex-wrap max-w-[70%]">
                        {genre_ids.map((id) => (
                            <span
                                key={id}
                                className="px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-800 select-none"
                            >
                                {genreMapping[id]}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 text-sm">{year}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
