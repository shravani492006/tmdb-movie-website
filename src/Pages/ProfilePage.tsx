import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.tsx';
import { getAuth, signOut } from 'firebase/auth';
import { db, storage } from '../firebase.ts';
import { doc, setDoc, deleteDoc, getDoc, collection, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import ReviewList from '../components/ReviewList.tsx';
import axios from 'axios';
import { User } from 'lucide-react';

type UserWithProfile = {
  profilePicture?: string;
  preferences?: string;
  username?: string;
  uid?: string;
} & import('firebase/auth').User;

const genreToId: { [key: string]: number } = {
  'Action': 28,
  'Comedy': 35,
  'Drama': 18,
  'Fantasy': 14,
  'Horror': 27,
  'Mystery': 9648,
  'Romance': 10749,
  'Science Fiction': 878,
  'Thriller': 53,
  'Western': 37,
};

const BASE_POSTER_URL = 'https://image.tmdb.org/t/p/original/';
const TMDB_API_KEY = '7f2f096d8066b9fb6e0fa92eb590fa7e';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const getStarRating = (rating: number) => {
  const stars: JSX.Element[] = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className="text-yellow-400">
        {i <= rating ? '★' : '☆'}
      </span>
    );
  }
  return stars;
};

const ProfilePage = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user as UserWithProfile | undefined;
  const [username, setUsername] = useState(user?.username || '');
  const [profilePicture, setProfilePicture] = useState<string | File>(user?.profilePicture || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(user?.preferences ? user.preferences.split(',') : []);
  const [ratedMovies, setRatedMovies] = useState<{ id: string; title: string; posterPath: string; rating: number }[]>([]);
  const [watchlist, setWatchlist] = useState<{ id: string; title: string; posterPath: string }[]>([]);
  const [recommendations, setRecommendations] = useState<{ id: string; title: string; posterPath: string }[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileTooLarge, setIsFileTooLarge] = useState(false);

  const navigate = useNavigate();

  // Fetch movie recommendations from TMDB API
  const fetchRecommendations = async (genres: string[]) => {
    const genreIds = genres
      .filter((genre) => genreToId[genre])
      .map((genre) => genreToId[genre])
      .join(',');

    try {
      const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          with_genres: genreIds,
          page: 1,
        },
      });

      return response.data.results.map((movie: any) => ({
        id: movie.id.toString(),
        title: movie.title,
        posterPath: `${BASE_POSTER_URL}${movie.poster_path}`,
      }));
    } catch (error) {
      console.error('Error fetching movie recommendations:', error);
      return [];
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUsername(userData.username || '');
          setProfilePicture(userData.profilePicture || '');
          setSelectedGenres(userData.preferences ? userData.preferences.split(',') : []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();

    const watchlistRef = collection(db, `users/${user.uid}/watchlist`);
    const unsubscribeWatchlist = onSnapshot(watchlistRef, (snapshot: QuerySnapshot<DocumentData>) => {
      const updatedWatchlist = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        posterPath: `${BASE_POSTER_URL}${doc.data().posterPath}`,
      }));
      setWatchlist(updatedWatchlist);
    });

    const ratingsRef = collection(db, `users/${user.uid}/ratings`);
    const unsubscribeRatings = onSnapshot(ratingsRef, (snapshot: QuerySnapshot<DocumentData>) => {
      const moviesMap = new Map<string, { id: string; title: string; posterPath: string; rating: number }>();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (!moviesMap.has(data.title)) {
          moviesMap.set(data.title, {
            id: doc.id,
            title: data.title,
            posterPath: `${BASE_POSTER_URL}${data.posterPath}`,
            rating: data.rating,
          });
        }
      });
      setRatedMovies(Array.from(moviesMap.values()));
    });

    return () => {
      unsubscribeWatchlist();
      unsubscribeRatings();
    };
  }, [user?.uid]);

  useEffect(() => {
    const fetchAndSetRecommendations = async () => {
      if (selectedGenres.length === 0) {
        setRecommendations([]);
        return;
      }
      const recs = await fetchRecommendations(selectedGenres);
      setRecommendations(recs.slice(0, 6));
    };
    fetchAndSetRecommendations();
  }, [selectedGenres]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    if (!file.type.startsWith('image/')) {
      setIsFileTooLarge(true);
      return;
    }
    if (file.size > 1048576) {
      setIsFileTooLarge(true);
      return;
    }
    setIsFileTooLarge(false);
    setProfilePicture(file);
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setIsLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      let imageUrl = profilePicture;

      if (profilePicture instanceof File) {
        const storageRef = ref(storage, `users/${user.uid}/profilePicture`);
        const snapshot = await uploadBytes(storageRef, profilePicture);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await setDoc(
        userRef,
        {
          username,
          profilePicture: imageUrl,
          preferences: selectedGenres.join(','),
        },
        { merge: true }
      );

      setProfilePicture(imageUrl);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error updating profile, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => navigate('/login'))
      .catch((error) => console.error('Error logging out:', error));
  };

  const handleMovieClick = (id: string) => {
    navigate(`/movie/${id}`);
  };

  const handleRemoveFromWatchlist = async (movieId: string) => {
    if (!user?.uid) return;
    const movieRef = doc(db, `users/${user.uid}/watchlist`, movieId);
    await deleteDoc(movieRef);
  };

  return (
    <div className="profile-page bg-white text-black min-h-screen p-6 flex flex-col lg:flex-row gap-6">
      <div className="left-section w-full lg:w-2/3 pr-0 lg:pr-6">
        <h1 className="text-4xl font-bold mb-8 text-blue-600">Profile Page</h1>

        {isFileTooLarge && (
          <div className="error-message text-red-500 mb-4">
            The file size exceeds the limit of 1MB or is not an image. Please upload a smaller valid image.
          </div>
        )}

        <div className="profile-header flex items-center gap-6 mb-8 flex-col lg:flex-row">
          {typeof profilePicture === 'string' && profilePicture ? (
            <img
              src={`${profilePicture}?${new Date().getTime()}`}
              alt="Profile"
              className="w-36 h-36 rounded-full border-4 border-black object-cover"
            />
          ) : profilePicture instanceof File ? (
            <img
              src={URL.createObjectURL(profilePicture)}
              alt="Profile Preview"
              className="w-36 h-36 rounded-full border-4 border-black object-cover"
            />
          ) : (
            <div className="w-36 h-36 rounded-full border-4 border-black flex justify-center items-center">
              <User className="w-24 h-24 text-gray-400" />
            </div>
          )}

          <div className="flex flex-col gap-4 w-full lg:w-auto">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Edit Username"
              className="bg-gray-200 border border-gray-400 text-black p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="file-input file-input-bordered w-full max-w-xs text-black"
            />
          </div>
        </div>

        <div className="genre-preferences mb-8">
          <h2 className="text-2xl font-semibold mb-4">Select your favorite genres</h2>
          <div className="genres grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Object.keys(genreToId).map((genre) => (
              <button
                key={genre}
                className={`px-3 py-2 rounded-full text-sm ${
                  selectedGenres.includes(genre) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'
                }`}
                onClick={() => {
                  setSelectedGenres((prev) =>
                    prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
                  );
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons flex gap-6 mb-8">
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="btn btn-primary bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            {showRecommendations ? 'Hide Recommendations' : 'Show Recommendations'}
          </button>

          <button
            onClick={handleSave}
            className={`btn btn-primary bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-secondary bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Rated Movies Section */}
        <div className="rated-movies mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rated Movies</h2>
          {ratedMovies.length === 0 ? (
            <p>No rated movies found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ratedMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="movie-card cursor-pointer"
                  onClick={() => handleMovieClick(movie.id)}
                >
                  <img
                    src={movie.posterPath}
                    alt={movie.title}
                    className="w-full h-auto rounded-lg mb-2"
                  />
                  <p className="text-lg font-semibold truncate">{movie.title}</p>
                  <p className="text-yellow-400 text-xl">{getStarRating(movie.rating)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      

      <div className="right-section w-full lg:w-1/3 bg-gray-100 rounded-lg p-4 overflow-y-auto max-h-[80vh]">
        <h2 className="text-2xl font-semibold mb-6">Your Reviews</h2>
        {/* Pass userId so it shows reviews by this user */}
        <ReviewList userId={user?.uid || ''} />
      </div>
      {showRecommendations && (
        <div className="recommendations w-full lg:w-1/3 bg-gray-100 rounded-lg p-4 overflow-y-auto max-h-[80vh]">
          <h2 className="text-2xl font-semibold mb-6">Recommended Movies</h2>
          {recommendations.length === 0 ? (
            <p>No recommendations available based on your selected genres.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {recommendations.map((movie) => (
                <div
                  key={movie.id}
                  className="movie-card cursor-pointer"
                  onClick={() => handleMovieClick(movie.id)}
                >
                  <img
                    src={movie.posterPath}
                    alt={movie.title}
                    className="w-full h-auto rounded-lg mb-2"
                  />
                  <p className="text-lg font-semibold truncate">{movie.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
