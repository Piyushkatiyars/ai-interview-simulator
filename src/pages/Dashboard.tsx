import { useEffect, useState } from 'react';
import { Page } from '../App';
import { api } from '../utils/api';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

interface OverviewStats {
  total_interviews: number;
  completed_interviews: number;
  average_score: number;
  best_score: number;
  total_questions_answered: number;
  current_streak: number;
}

interface SkillAnalysis {
  skill_name: string;
  interview_count: number;
  average_score: number;
  best_score: number;
  improvement_trend: string;
  last_practiced: string | null;
}

interface RecentInterviewSummary {
  id: number;
  title: string;
  interview_type: string;
  score: number;
  grade: string;
  completed_at: string | null;
  duration_minutes: number | null;
}

interface DashboardData {
  overview: OverviewStats;
  skill_analysis: SkillAnalysis[];
  recent_interviews: RecentInterviewSummary[];
  recommendations: string[];
}

const skillColors: Record<string, string> = {
  Python: 'from-yellow-400 to-yellow-600',
  'HR & Behavioral': 'from-blue-400 to-blue-600',
  'Web Development': 'from-purple-400 to-purple-600',
  'Cloud Computing': 'from-cyan-400 to-cyan-600',
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await api.get<DashboardData>('/analytics/dashboard');
        setData(result);
      } catch {
        setError('Could not load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      python: '🐍',
      hr: '👥',
      web_development: '🌐',
      cloud_computing: '☁️'
    };
    return icons[type] || '📝';
  };

  const getGrade = (score: number) => {
    if (score >= 9.5) return { grade: 'A+', color: 'text-emerald-400' };
    if (score >= 9) return { grade: 'A', color: 'text-emerald-400' };
    if (score >= 8.5) return { grade: 'B+', color: 'text-blue-400' };
    if (score >= 8) return { grade: 'B', color: 'text-blue-400' };
    if (score >= 7.5) return { grade: 'C+', color: 'text-yellow-400' };
    if (score >= 7) return { grade: 'C', color: 'text-yellow-400' };
    if (score >= 6) return { grade: 'D', color: 'text-orange-400' };
    return { grade: 'F', color: 'text-red-400' };
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-red-400">{error || 'Something went wrong.'}</p>
      </div>
    );
  }

  const { overview, skill_analysis, recent_interviews, recommendations } = data;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
        <p className="text-slate-400">Track your progress and continue practicing</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{overview.total_interviews}</h3>
          <p className="text-slate-400 text-sm">Total Interviews</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{overview.completed_interviews}</h3>
          <p className="text-slate-400 text-sm">Completed</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            {overview.average_score > 0 && (
              <span className={`text-xs font-medium ${getGrade(overview.average_score).color} bg-blue-500/20 px-2 py-1 rounded-full`}>
                Grade {getGrade(overview.average_score).grade}
              </span>
            )}
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{overview.average_score}</h3>
          <p className="text-slate-400 text-sm">Average Score</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{overview.current_streak}</h3>
          <p className="text-slate-400 text-sm">Day Streak</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Interviews */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Interviews</h2>
            <button
              onClick={() => onNavigate('interviews')}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              View All →
            </button>
          </div>

          {recent_interviews.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 mb-4">You haven't completed any interviews yet.</p>
              <button
                onClick={() => onNavigate('new-interview')}
                className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Start Your First Interview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recent_interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-600/50 flex items-center justify-center text-2xl">
                      {getTypeIcon(interview.interview_type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{interview.title}</h3>
                      <span className="text-xs text-slate-400">
                        {interview.completed_at ? new Date(interview.completed_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-2xl font-bold ${getGrade(interview.score).color}`}>
                      {interview.score.toFixed(1)}
                    </span>
                    <p className="text-xs text-slate-400">
                      Grade {interview.grade}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Progress */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Skill Progress</h2>

          {skill_analysis.length === 0 ? (
            <p className="text-slate-400 text-sm">Complete an interview to see skill breakdowns here.</p>
          ) : (
            <div className="space-y-6">
              {skill_analysis.map((skill) => (
                <div key={skill.skill_name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{skill.skill_name}</span>
                    <span className="text-sm font-bold text-white">{skill.average_score.toFixed(1)}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${skillColors[skill.skill_name] || 'from-violet-400 to-violet-600'} rounded-full transition-all duration-500`}
                      style={{ width: `${skill.average_score * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{skill.interview_count} interviews</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onNavigate('new-interview')}
            className="w-full mt-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>➕</span>
            <span>Start New Interview</span>
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">💡 Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-slate-300 text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
