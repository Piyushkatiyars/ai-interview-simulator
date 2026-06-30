import { useEffect, useState } from 'react';
import { User } from '../App';
import { api, ApiError, clearTokens } from '../utils/api';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

interface OverviewStats {
  total_interviews: number;
  completed_interviews: number;
  average_score: number;
  best_score: number;
  total_questions_answered: number;
  current_streak: number;
}

export default function Profile({ user, onUpdateUser }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    bio: '',
  });
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const achievements = [
    { id: 1, title: 'First Interview', description: 'Complete your first interview', icon: '🎯', completed: (stats?.completed_interviews ?? 0) >= 1 },
    { id: 2, title: '5 Day Streak', description: 'Practice for 5 consecutive days', icon: '🔥', completed: (stats?.current_streak ?? 0) >= 5 },
    { id: 3, title: 'Perfect Score', description: 'Get 10/10 on any question', icon: '⭐', completed: (stats?.best_score ?? 0) >= 10 },
    { id: 4, title: 'Python Master', description: 'Complete 10 Python interviews', icon: '🐍', completed: false },
    { id: 5, title: 'Well Rounded', description: 'Practice all interview types', icon: '🎭', completed: false },
    { id: 6, title: '10 Interviews', description: 'Complete 10 interviews total', icon: '⚡', completed: (stats?.completed_interviews ?? 0) >= 10 }
  ];

  useEffect(() => {
    const loadStats = async () => {
      try {
        const overview = await api.get<OverviewStats>('/analytics/overview');
        setStats(overview);
      } catch {
        // Non-critical, just leave stats blank
      }
    };
    loadStats();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const updated = await api.put<User>('/auth/me', {
        full_name: formData.full_name,
        bio: formData.bio,
      });
      onUpdateUser(updated);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_new_password: passwordForm.confirmPassword,
      });
      setPasswordSuccess('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Could not change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/auth/me');
      clearTokens();
      window.location.reload();
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isEditing
                    ? 'bg-slate-700 text-white'
                    : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                }`}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="flex items-start space-x-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-4xl text-white font-bold">
                  {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white text-sm hover:bg-violet-600 transition-colors">
                    📷
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{user.full_name}</h3>
                <p className="text-slate-400">@{user.username}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-3 py-1 bg-violet-500/20 text-violet-400 text-xs font-medium rounded-full">
                    {user.email}
                  </span>
                  {stats && stats.current_streak > 0 && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                      🔥 {stats.current_streak} day streak
                    </span>
                  )}
                </div>
              </div>
            </div>

            {saveError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{saveError}</p>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    placeholder="Tell us a bit about yourself"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <p className="text-sm text-slate-400">Full Name</p>
                    <p className="text-white font-medium">{user.full_name}</p>
                  </div>
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <p className="text-sm text-slate-400">Username</p>
                    <p className="text-white font-medium">@{user.username}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <p className="text-sm text-slate-400">Bio</p>
                  <p className="text-white">{formData.bio || 'No bio added yet.'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Change Password</h2>
            <div className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">{passwordError}</p>
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-emerald-400 text-sm">{passwordSuccess}</p>
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="px-6 py-3 bg-violet-500/20 text-violet-400 rounded-xl font-medium hover:bg-violet-500/30 transition-colors disabled:opacity-50"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400">Interviews</span>
                <span className="text-white font-bold">{stats?.total_interviews ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400">Avg Score</span>
                <span className="text-blue-400 font-bold">{stats?.average_score ?? 0}/10</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400">Questions</span>
                <span className="text-white font-bold">{stats?.total_questions_answered ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400">Best Score</span>
                <span className="text-purple-400 font-bold">{stats?.best_score ?? 0}/10</span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Achievements</h2>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative p-3 rounded-xl text-center transition-all ${
                    achievement.completed
                      ? 'bg-violet-500/20 border border-violet-500/30'
                      : 'bg-slate-700/30 opacity-50'
                  }`}
                  title={achievement.description}
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  {achievement.completed && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-4 text-center">
              {achievements.filter(a => a.completed).length}/{achievements.length} unlocked
            </p>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
            <p className="text-sm text-slate-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="text-sm text-red-300">Are you sure? This cannot be undone.</p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors"
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
