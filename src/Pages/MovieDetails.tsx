import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, Calendar, Clock, Bookmark, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../firebase.ts';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

interface Genre {
  id: number;
  name: string;
}

interface CastMember {
  id: number;
  name: string;
  profile_path: string | null;
}

interface Review {
  id: string;
  author: string;
  content: string;
  likes?: number;
  dislikes?: number;
}

interface Trailer {
  id: string;
  key: string;
  name: string;
  site: string;
}

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  language: string;
  director: string;
  boxOffice: number;
  release_date: string;
  genres: Genre[];
  runtime: number;
  vote_average: number;
  poster_path: string | null;
  cast: CastMember[] | null;
  reviews: Review[];
  trailers: Trailer[];
  images: { file_path: string }[];
  streamingLinks: { provider_name: string; url: string }[];
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = id ?? '';
  const { user } = useAuth();

  const [userReview, setUserReview] = useState('');
  const [userRating, setUserRating] = useState<number | null>(null);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = '7f2f096d8066b9fb6e0fa92eb590fa7e';

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}`,
          {
            params: {
              api_key: API_KEY,
              append_to_response: 'credits,reviews,videos,images,watch/providers',
            },
          }
        );

        const movieData = response.data;

        const director =
          movieData.credits?.crew?.find((member: any) => member.job === 'Director')
            ?.name ?? 'Unknown Director';

        const streamingLinks = movieData['watch/providers']?.results?.US?.flatrate ?? [];

        setMovieDetails({
          id: movieData.id,
          title: movieData.title,
          language: movieData.original_language,
          director,
          boxOffice: movieData.revenue ?? 0,
          overview: movieData.overview,
          release_date: movieData.release_date,
          genres: movieData.genres,
          runtime: movieData.runtime,
          poster_path: movieData.poster_path,
          vote_average: movieData.vote_average,
          cast:
            movieData.credits?.cast
              ?.slice(0, 4)
              .map((member: any) => ({
                id: member.id,
                name: member.name,
                profile_path: member.profile_path,
              })) ?? null,
          reviews:
            movieData.reviews?.results?.map((review: any) => ({
              id: review.id,
              author: review.author,
              content: review.content,
              likes: review.likes ?? 0,
              dislikes: review.dislikes ?? 0,
            })) ?? [],
          trailers: movieData.videos?.results ?? [],
          images: movieData.images?.backdrops ?? [],
          streamingLinks,
        });
      } catch (err) {
        setError('Failed to fetch movie details');
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  const handleUpvote = (index: number) => {
    setMovieDetails((prev) =>
      prev
        ? {
            ...prev,
            reviews: prev.reviews.map((review, idx) =>
              idx === index
                ? { ...review, likes: (review.likes ?? 0) + 1 }
                : review
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
              idx === index
                ? { ...review, dislikes: (review.dislikes ?? 0) + 1 }
                : review
            ),
          }
        : null
    );
  };

  const handleAddToWatchlist = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert('Please log in to add to watchlist');
      return;
    }

    try {
      const watchlistCollectionRef = collection(db, 'users', currentUser.uid, 'watchlist');
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
      alert('Failed to add movie to watchlist.');
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
      if (!movieId) throw new Error('Movie ID is undefined');

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
      alert('Failed to submit rating.');
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
      alert('Failed to submit review.');
    }
  };

  if (loading)
    return (
      <div className="text-center">
        <div className="loader"></div>
        <p className="text-xl text-gray-700">Loading movie details...</p>
      </div>
    );

  if (error) return <p className="text-center text-red-600">{error}</p>;

  const watchOnlineLink = movieDetails?.streamingLinks?.[0]?.url ?? '';

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
              {movieDetails?.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w500/${movieDetails.poster_path}`}
                  alt={movieDetails.title}
                  className="w-48 h-72 object-cover rounded-lg overflow-hidden shadow-xl transition-transform transform hover:scale-105"
                />
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{movieDetails?.vote_average.toFixed(1)}</span>
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
                <span className="font-semibold">Genres:</span> {movieDetails?.genres.map((g) => g.name).join(', ')}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Box Office:</span> ${movieDetails?.boxOffice.toLocaleString()}
              </p>

              <button
                onClick={handleAddToWatchlist}
                className="flex items-center gap-2 rounded bg-yellow-400 hover:bg-yellow-500 px-5 py-3 text-gray-900 font-semibold"
              >
                <Bookmark />
                Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cast */}
      <section className="container mx-auto px-4 mt-10">
        <h3 className="text-2xl font-bold mb-6">Top Cast</h3>
        {movieDetails?.cast && movieDetails.cast.length > 0 ? (
          <Swiper
            slidesPerView={4}
            spaceBetween={10}
            breakpoints={{
              640: { slidesPerView: 4, spaceBetween: 20 },
              768: { slidesPerView: 5, spaceBetween: 40 },
              1024: { slidesPerView: 6, spaceBetween: 50 },
            }}
          >
            {movieDetails.cast.map((member) => (
              <SwiperSlide key={member.id}>
                <img
                  src={
                    member.profile_path
                      ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                      : 'https://via.placeholder.com/185x278?text=No+Image'
                  }
                  alt={member.name}
                  className="rounded-lg shadow-lg"
                />
                <p className="mt-2 text-center font-semibold">{member.name}</p>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <p>No cast information available.</p>
        )}
      </section>

      {/* User Ratings */}
      <section className="container mx-auto px-4 mt-10">
        <h3 className="text-2xl font-semibold mb-4">Rate this Movie</h3>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-8 h-8 cursor-pointer transition-colors ${
                userRating !== null && userRating >= star ? 'text-yellow-400' : 'text-gray-300'
              }`}
              onClick={() => setUserRating(star)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setUserRating(star);
              }}
              role="button"
              tabIndex={0}
              aria-label={`${star} star`}
            />
          ))}
          <button
            onClick={handleRatingSubmit}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded"
          >
            Submit Rating
          </button>
        </div>
      </section>

      {/* User Reviews */}
      <section className="container mx-auto px-4 mt-10">
        <h3 className="text-2xl font-semibold mb-4">Write a Review</h3>
        <textarea
          value={userReview}
          onChange={(e) => setUserReview(e.target.value)}
          placeholder="Write your review here..."
          className="w-full rounded border border-gray-300 p-3 mb-4"
          rows={4}
        />
        <button
          onClick={handleReviewSubmit}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-3 rounded"
        >
          Submit Review
        </button>
      </section>

      {/* Reviews List */}
      <section className="container mx-auto px-4 mt-10">
        <h3 className="text-2xl font-semibold mb-6">User Reviews</h3>
        {movieDetails?.reviews.length ? (
          movieDetails.reviews.map((review, index) => (
            <div
              key={review.id}
              className="border-b border-gray-300 py-4 flex flex-col gap-2"
            >
              <p className="font-semibold">{review.author}</p>
              <p>{review.content}</p>
              <div className="flex gap-4 text-yellow-500">
                <button
                  onClick={() => handleUpvote(index)}
                  aria-label="Upvote review"
                  className="flex items-center gap-1 hover:text-yellow-600"
                >
                  <ThumbsUp /> {review.likes ?? 0}
                </button>
                <button
                  onClick={() => handleDownvote(index)}
                  aria-label="Downvote review"
                  className="flex items-center gap-1 hover:text-yellow-600"
                >
                  <ThumbsDown /> {review.dislikes ?? 0}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No reviews yet. Be the first to review!</p>
        )}
      </section>

      {/* Trailers */}
      <section className="container mx-auto px-4 mt-10">
        <h3 className="text-2xl font-bold mb-6">Trailers</h3>
        <Swiper
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 1, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 40 },
            1024: { slidesPerView: 3, spaceBetween: 50 },
          }}
        >
          {movieDetails?.trailers
            .filter((trailer) => trailer.site === 'YouTube')
            .map((trailer) => (
              <SwiperSlide key={trailer.id}>
                <iframe
                  width="100%"
                  height="250"
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={trailer.name}
                  allowFullScreen
                  frameBorder="0"
                />
              </SwiperSlide>
            ))}
        </Swiper>
      </section>

      {/* Watch Online */}
      {watchOnlineLink && (
        <section className="container mx-auto px-4 mt-10 mb-10">
          <h3 className="text-2xl font-bold mb-4">Watch Online</h3>
          <a
            href={watchOnlineLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-500 underline font-semibold"
          >
            Watch on Streaming Provider
          </a>
        </section>
      )}
    </div>
  );
};

export default MovieDetails;
