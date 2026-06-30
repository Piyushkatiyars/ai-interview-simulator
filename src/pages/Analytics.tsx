import { useEffect, useState } from 'react';
import { api } from '../utils/api';

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
  improvement_trend: 'improving' | 'stable' | 'declining' | string;
}

interface PerformanceTrend {
  date: string;
  score: number;
  interview_type: string;
}

interface DashboardData {
  overview: OverviewStats;
  skill_analysis: SkillAnalysis[];
  performance_trends: PerformanceTrend[];
  recommendations: string[];
}

interface ProgressReport {
  period: string;
  interviews_completed: number;
  average_score: number;
  score_improvement: number;
  time_spent_minutes: number;
  skill_breakdown: Record<string, number>;
  top_achievements: string[];
  areas_to_focus: string[];
}

const skillColors: Record<string, string> = {
  'HR & Behavioral': 'from-blue-500 to-cyan-500',
  Python: 'from-yellow-500 to-green-500',
  'Web Development': 'from-purple-500 to-pink-500',
  'Cloud Computing': 'from-cyan-500 to-blue-500',
};

const skillIcons: Record<string, string> = {
  'HR & Behavioral': '👥',
  Python: '🐍',
  'Web Development': '🌐',
  'Cloud Computing': '☁️',
};

export default function Analytics() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<DashboardData | null>(null);
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [dashboard, progress] = await Promise.all([
          api.get<DashboardData>('/analytics/dashboard'),
          api.get<ProgressReport>(`/analytics/progress-report?period=${period}`),
        ]);
        setData(dashboard);
        setReport(progress);
      } catch {
        setError('Could not load analytics data.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [period]);

  const getGrade = (score: number) => {
    if (score >= 9) return { grade: 'A', color: 'text-emerald-400' };
    if (score >= 8) return { grade: 'B', color: 'text-blue-400' };
    if (score >= 7) return { grade: 'C', color: 'text-yellow-400' };
    if (score >= 6) return { grade: 'D', color: 'text-orange-400' };
    return { grade: 'F', color: 'text-red-400' };
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Loading analytics...</p>
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

  const { overview, skill_analysis, performance_trends, recommendations } = data;
  const maxTrendScore = Math.max(10, ...performance_trends.map((t) => t.score));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">Track your interview performance and progress</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1">
          {(['weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === 'weekly' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Total Interviews</p>
          <p className="text-2xl font-bold text-white">{overview.total_interviews}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{overview.completed_interviews}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Avg Score</p>
          <p className={`text-2xl font-bold ${getGrade(overview.average_score).color}`}>
            {overview.average_score}
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Best Score</p>
          <p className="text-2xl font-bold text-emerald-400">{overview.best_score}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Questions</p>
          <p className="text-2xl font-bold text-blue-400">{overview.total_questions_answered}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Streak</p>
          <p className="text-2xl font-bold text-purple-400">{overview.current_streak}d</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Performance Trends</h2>

          {performance_trends.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-slate-400 text-sm">Complete interviews to see your trend over time.</p>
            </div>
          ) : (
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-end justify-between px-2 gap-1">
                {performance_trends.map((point, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1" style={{ height: '100%' }}>
                    <div className="flex-1 w-full flex items-end justify-center">
                      <div
                        className="w-full max-w-[24px] bg-gradient-to-t from-violet-500 to-purple-400 rounded-t"
                        style={{ height: `${(point.score / maxTrendScore) * 100}%` }}
                        title={`${point.interview_type}: ${point.score}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Report */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">
            {period === 'weekly' ? 'This Week' : 'This Month'}
          </h2>

          {report && (
            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-slate-700">
                <p className="text-3xl font-bold text-white">{report.interviews_completed}</p>
                <p className="text-sm text-slate-400">interviews completed</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400 text-sm">Avg Score</span>
                <span className={`font-bold ${getGrade(report.average_score).color}`}>
                  {report.average_score.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400 text-sm">vs. last {period === 'weekly' ? 'week' : 'month'}</span>
                <span className={`font-bold ${report.score_improvement >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {report.score_improvement >= 0 ? '+' : ''}{report.score_improvement.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400 text-sm">Time Spent</span>
                <span className="font-bold text-white">{Math.round(report.time_spent_minutes / 60 * 10) / 10}h</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skill Analysis */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Skill-wise Analysis</h2>

        {skill_analysis.length === 0 ? (
          <p className="text-slate-400 text-sm">Complete interviews across different categories to see a skill breakdown here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skill_analysis.map((skill) => (
              <div
                key={skill.skill_name}
                className="bg-slate-700/30 rounded-xl p-5 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${skillColors[skill.skill_name] || 'from-violet-500 to-purple-500'} flex items-center justify-center text-2xl`}>
                    {skillIcons[skill.skill_name] || '📝'}
                  </div>
                  <span className="text-xl">{getTrendIcon(skill.improvement_trend)}</span>
                </div>

                <h3 className="font-medium text-white mb-1">{skill.skill_name}</h3>
                <p className="text-sm text-slate-400 mb-4">{skill.interview_count} interviews</p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Avg Score</p>
                    <p className={`text-2xl font-bold ${getGrade(skill.average_score).color}`}>
                      {skill.average_score}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    skill.improvement_trend === 'improving'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : skill.improvement_trend === 'declining'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {skill.improvement_trend}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${skillColors[skill.skill_name] || 'from-violet-500 to-purple-500'} rounded-full`}
                      style={{ width: `${skill.average_score * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      {(recommendations.length > 0 || (report && (report.areas_to_focus.length > 0 || report.top_achievements.length > 0))) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {report && report.top_achievements.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">🏆</span>
                <h3 className="text-lg font-semibold text-emerald-400">Achievements</h3>
              </div>
              <ul className="space-y-2">
                {report.top_achievements.map((a, i) => (
                  <li key={i} className="text-slate-300 text-sm">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {report && report.areas_to_focus.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">🎯</span>
                <h3 className="text-lg font-semibold text-yellow-400">Focus Areas</h3>
              </div>
              <ul className="space-y-2">
                {report.areas_to_focus.map((a, i) => (
                  <li key={i} className="text-slate-300 text-sm">{a}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-semibold text-blue-400">Recommendations</h3>
              </div>
              <ul className="space-y-2">
                {recommendations.map((r, i) => (
                  <li key={i} className="text-slate-300 text-sm">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
