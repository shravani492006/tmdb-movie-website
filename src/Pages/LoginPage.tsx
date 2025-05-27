import React, { useState, useEffect } from 'react';
import fetchRandomMovieImages from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { user, login, logout, register, loginWithGoogle} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackgroundImage = async () => {
      const image = await fetchRandomMovieImages();
      setBackgroundImage(image);
    };
    fetchBackgroundImage();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, password);
      navigate('/home');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please log in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      setError(err.message || 'Logout failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Google login failed. Please try again.');
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-xl w-full bg-gray-900 bg-opacity-60 p-10 rounded-lg shadow-xl space-y-2">        <h2 className="text-4xl font-semibold text-white">Welcome Back!</h2>

        <div className="flex justify-between items-center mb-4 space-y-4">
          <p className="text-lg text-white">Let's Get You In</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-4 rounded-lg bg-black text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-4 rounded-lg bg-black text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-6 rounded-lg shadow-lg transition duration-300"
            >
              Login
            </button>
            <button
              type="button"
              onClick={handleRegister}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition duration-300"
            >
              Register
            </button>
          </div>
          <div className="flex flex-col items-center space-y-2 mb-6">
            <p className="text-lg text-white">Quick login via</p>
            <button
              className="px-4 py-2 rounded-full bg-black hover:bg-gray-600 flex items-center justify-center text-white"
              onClick={handleGoogleLogin}
              aria-label="Login with Google"
            >
              <i className="fab fa-google text-xl mr-2"></i>
              Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;