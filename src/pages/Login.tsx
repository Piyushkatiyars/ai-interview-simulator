import { useState } from 'react';
import { User } from '../App';
import { api, setTokens, ApiError } from '../utils/api';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export default function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.post<LoginResponse>(
        '/auth/login',
        { email, password },
        false
      );
      setTokens(result.access_token, result.refresh_token);
      onLogin(result.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AI Interview Simulator</h1>
          <p className="text-slate-400 mt-2">Welcome back! Please sign in to continue.</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@example.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500" />
                <span className="text-sm text-slate-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-violet-400 hover:text-violet-300">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
                isLoading
                  ? 'bg-violet-500/50 text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-center text-xs text-slate-500">
              Connects to the FastAPI backend at localhost:8000
            </p>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center mt-6 text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-violet-400 hover:text-violet-300 font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
