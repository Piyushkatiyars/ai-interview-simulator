import { useState } from 'react';
import { User } from '../App';
import { api, setTokens, ApiError } from '../utils/api';

interface RegisterProps {
  onRegister: (user: User) => void;
  onSwitchToLogin: () => void;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export default function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Register the account
      await api.post(
        '/auth/register',
        {
          email: formData.email,
          username: formData.username,
          full_name: formData.fullName,
          password: formData.password,
          confirm_password: formData.confirmPassword,
        },
        false
      );

      // Immediately log in to get tokens
      const loginResult = await api.post<LoginResponse>(
        '/auth/login',
        { email: formData.email, password: formData.password },
        false
      );
      setTokens(loginResult.access_token, loginResult.refresh_token);
      onRegister(loginResult.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Unable to reach the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Medium', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Strong', color: 'bg-blue-500' };
    return { strength, label: 'Very Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">Start your interview preparation journey</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {serverError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{serverError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  errors.fullName ? 'border-red-500' : 'border-slate-600 focus:border-violet-500'
                }`}
              />
              {errors.fullName && (
                <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  errors.email ? 'border-red-500' : 'border-slate-600 focus:border-violet-500'
                }`}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  errors.username ? 'border-red-500' : 'border-slate-600 focus:border-violet-500'
                }`}
              />
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  errors.password ? 'border-red-500' : 'border-slate-600 focus:border-violet-500'
                }`}
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= passwordStrength.strength ? passwordStrength.color : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs mt-1 ${
                    passwordStrength.strength <= 2 ? 'text-red-400' :
                    passwordStrength.strength <= 3 ? 'text-yellow-400' :
                    'text-emerald-400'
                  }`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-600 focus:border-violet-500'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 mt-1 rounded border-slate-600 bg-slate-900 text-violet-500 focus:ring-violet-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-400">
                I agree to the{' '}
                <a href="#" className="text-violet-400 hover:text-violet-300">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-violet-400 hover:text-violet-300">Privacy Policy</a>
              </label>
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
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center mt-6 text-slate-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-violet-400 hover:text-violet-300 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
