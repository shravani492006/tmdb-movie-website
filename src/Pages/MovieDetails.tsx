
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, Calendar, Clock, Play, Heart, Globe, DollarSign, Bookmark, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../firebase.ts';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, orderBy, setDoc, doc } from 'firebase/firestore';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  language: string;
  director: string;
  boxOffice: string;
  release_date: string;
  genres: { id: number; name: string }[];
  runtime: number;
  vote_average: number;
  poster_path: string;
  cast: { id: number; name: string; profile_path: string }[] | null;
  reviews: { id: string; author: string; content: string; likes?: number; dislikes?: number }[];
  trailers: any;
  images: { backdrops: { file_path: string }[] };
  streamingLinks: any;
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = id;
  const { user } = useAuth();
  const [userReview, setUserReview] = useState('');
  const [userRating, setUserRating] = useState<number | null>(null);
  const [movieReviews, setMovieReviews] = useState<{ author: string; content: string; likes?: number; dislikes?: number }[]>([]);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('mostHelpful');
  const [sortedReviews, setSortedReviews] = useState(movieDetails?.reviews);

  const API_KEY = '7f2f096d8066b9fb6e0fa92eb590fa7e';
  const API_URL = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,reviews,videos,images,watch/providers`;

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await axios.get(API_URL);
        const movieData = response.data;
        const director = movieData.credits?.crew?.find((member: any) => member.job === 'Director')?.name || 'Unknown Director';
        const streamingLinks = movieData['watch/providers']?.results?.US?.flatrate || [];

        setMovieDetails({
          id: movieData.id,
          title: movieData.title,
          language: movieData.original_language,
          director: director,
          boxOffice: movieData.revenue,
          overview: movieData.overview,
          release_date: movieData.release_date,
          genres: movieData.genres,
          runtime: movieData.runtime,
          poster_path: movieData.poster_path,
          vote_average: movieData.vote_average,
          cast: movieData.credits?.cast?.slice(0, 4).map((member: any) => ({
            id: member.id,
            name: member.name,
            profile_path: member.profile_path,
          })) || null,
          reviews: movieData.reviews?.results.map((review: any) => ({
            id: review.id,
            author: review.author,
            content: review.content,
          })) || [],
          trailers: movieData.videos?.results || [],
          images: movieData.images?.backdrops || [],
          streamingLinks: streamingLinks,
        });
      } catch (err) {
        setError('Failed to fetch movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [API_URL, movieId]);

  const handleUpvote = (index: number) => {
    setMovieDetails((prev) =>
      prev
        ? {
            ...prev,
            reviews: prev.reviews.map((review, idx) =>
              idx === index ? { ...review, likes: (review.likes || 0) + 1 } : review
            ),
          }
        : null
    );
  };

  const handleDownvote = (index: number) => {
    setMovieDetails((prev) =>
      prev
        ? {
            ...prev,
            reviews: prev.reviews.map((review, idx) =>
              idx === index ? { ...review, dislikes: (review.dislikes || 0) + 1 } : review
            ),
          }
        : null
    );
  };

  const handleAddToWatchlist = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userId = user.uid;

      try {
        const watchlistCollectionRef = collection(db, 'users', userId, 'watchlist');
        await addDoc(watchlistCollectionRef, {
          movieId: movieDetails?.id,
          title: movieDetails?.title,
          releaseDate: movieDetails?.release_date,
          genres: movieDetails?.genres.map((genre) => genre.name),
          posterPath: movieDetails?.poster_path,
        });
        alert('Movie added to watchlist!');
      } catch (error) {
        console.error('Error adding to watchlist: ', error);
      }
    } else {
      console.log('No user is logged in');
    }
  };

  const handleRatingSubmit = async () => {
    if (!user) {
      alert('Please log in to rate this movie');
      return;
    }
    if (userRating === null || userRating < 0 || userRating > 5) {
      alert('Rating must be between 0 and 5');
      return;
    }

    try {
      const userId = user.uid;
      if (!movieId) {
        throw new Error('Movie ID is undefined');
      }
      const ratingDocRef = doc(db, `users/${userId}/ratings`, movieId);
      await setDoc(ratingDocRef, {
        movieId: movieDetails?.id,
        title: movieDetails?.title,
        rating: userRating,
        timestamp: new Date(),
      });
      alert('Rating submitted!');
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      alert('Please log in to submit a review');
      return;
    }

    if (!userReview.trim()) {
      alert('Review cannot be empty');
      return;
    }

    try {
      const userId = user.uid;
      const reviewsRef = collection(db, 'users', userId, 'reviews');
      await addDoc(reviewsRef, {
        author: user.displayName || 'Anonymous',
        content: userReview,
        title: movieDetails?.title,
        timestamp: new Date(),
      });

      setUserReview('');
      alert('Review submitted!');
    } catch (error) {
      console.error('Error submitting review: ', error);
    }
  };

  if (loading) return <p className="text-center text-xl text-gray-700">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  const watchOnlineLink = movieDetails?.streamingLinks?.[0]?.url || '';

  if (loading) {
    return (
      <div className="text-center">
        <div className="loader"></div>
        <p className="text-xl text-gray-700">Loading movie details...</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 p-4">

      <div className="relative h-[60vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original/${movieDetails?.poster_path})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex items-end pb-12">
          <div className="grid md:grid-cols-3 gap-8 items-end">
            <div className="hidden md:block">
              <img
                src={`https://image.tmdb.org/t/p/w500/${movieDetails?.poster_path}`}
                alt={movieDetails?.title}
                className="w-48 h-72 object-cover rounded-lg overflow-hidden shadow-xl transition-transform transform hover:scale-105"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{movieDetails?.vote_average?.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Calendar className="w-5 h-5" />
                  <span>{movieDetails?.release_date}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Clock className="w-5 h-5" />
                  <span>{movieDetails?.runtime} min</span>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-4">{movieDetails?.title}</h2>
              <p className="mb-4">{movieDetails?.overview}</p>
              <p className="mb-4">
                <span className="font-semibold">Director:</span> {movieDetails?.director}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Language:</span> {movieDetails?.language}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Genres:</span> {movieDetails?.genres.map(g => g.name).join(', ')}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Box Office:</span> ${movieDetails?.boxOffice?.toLocaleString()}
              </p>

              <button
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-md transition"
                onClick={handleAddToWatchlist}
              >
                <Bookmark className="w-5 h-5" />
                Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Streaming links */}
      <div className="mt-8">
        <h3 className="text-2xl font-semibold mb-2">Watch Online</h3>
        {watchOnlineLink ? (
          <a
            href={watchOnlineLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Stream this movie
          </a>
        ) : (
          <p>No streaming links available.</p>
        )}
      </div>

      {/* Cast */}
      <div className="mt-8">
        <h3 className="text-2xl font-semibold mb-4">Cast</h3>
        <div className="flex gap-6 overflow-x-auto">
          {movieDetails?.cast?.map((cast) => (
            <div key={cast.id} className="flex flex-col items-center w-28">
              <img
                src={`https://image.tmdb.org/t/p/w185${cast.profile_path}`}
                alt={cast.name}
                className="rounded-full w-20 h-20 object-cover mb-2 shadow-lg"
              />
              <p className="text-center text-sm font-medium">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Ratings */}
      <div className="mt-8">
        <h3 className="text-2xl font-semibold mb-4">Rate this Movie</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={0}
            max={10}
            value={userRating ?? ''}
            onChange={(e) => setUserRating(parseInt(e.target.value))}
            placeholder="0 to 5"
            className="border border-gray-300 rounded px-3 py-2 w-20"
          />
          <button
            onClick={handleRatingSubmit}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded"
          >
            Submit Rating
          </button>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-8">
        <h3 className="text-2xl font-semibold mb-4">User Reviews</h3>

        <textarea
          value={userReview}
          onChange={(e) => setUserReview(e.target.value)}
          placeholder="Write your review here..."
          className="w-full border border-gray-300 rounded p-3 mb-4 resize-none"
          rows={4}
        />
        <button
          onClick={handleReviewSubmit}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded"
        >
          Submit Review
        </button>

        <div className="mt-6 space-y-6">
          {movieDetails?.reviews.map((review, index) => (
            <div
              key={review.id}
              className="bg-gray-100 p-4 rounded shadow hover:shadow-md transition"
            >
              <p className="font-semibold mb-2">{review.author}</p>
              <p className="mb-2">{review.content}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleUpvote(index)}
                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>{review.likes || 0}</span>
                </button>
                <button
                  onClick={() => handleDownvote(index)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span>{review.dislikes || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trailer Carousel */}
      {movieDetails?.trailers?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold mb-4">Trailers</h3>
          <Swiper slidesPerView={1} spaceBetween={10} pagination={{ clickable: true }}>
            {movieDetails?.trailers?.map((trailer: any) => (
              <SwiperSlide key={trailer.id}>
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={trailer.name}
                  allowFullScreen
                ></iframe>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
