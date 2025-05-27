import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';

const LoginModal: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      setError('');
      alert('Login successful!');
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-yellow-500"
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-yellow-500"
          placeholder="Enter your password"
          required
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-md"
      >
        Login
      </button>
    </form>
  );
};

export default LoginModal;
