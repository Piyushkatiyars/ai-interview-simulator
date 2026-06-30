import { useEffect, useState } from 'react';
import { Page, Interview } from '../App';
import { api } from '../utils/api';

interface InterviewsProps {
  onNavigate: (page: Page) => void;
  onStartInterview: (interview: Interview) => void;
}

interface InterviewListResponse {
  interviews: Interview[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function Interviews({ onNavigate, onStartInterview }: InterviewsProps) {
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInterviews = async () => {
      setIsLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: '1', per_page: '50' });
        if (filter !== 'all') params.set('status', filter);
        if (typeFilter !== 'all') params.set('interview_type', typeFilter);
        const result = await api.get<InterviewListResponse>(`/interviews/?${params.toString()}`);
        setInterviews(result.interviews);
      } catch {
        setError('Could not load interviews.');
      } finally {
        setIsLoading(false);
      }
    };
    loadInterviews();
  }, [filter, typeFilter]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/interviews/${id}`);
      setInterviews((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError('Could not delete interview.');
    }
  };

  const handleResume = async (interview: Interview) => {
    onStartInterview(interview);
  };

  const filteredInterviews = interviews;

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      python: '🐍',
      hr: '👥',
      web_development: '🌐',
      cloud_computing: '☁️'
    };
    return icons[type] || '📝';
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      python: 'Python',
      hr: 'HR & Behavioral',
      web_development: 'Web Development',
      cloud_computing: 'Cloud Computing'
    };
    return names[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      created: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    return colors[status] || colors.created;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'text-emerald-400',
      intermediate: 'text-yellow-400',
      advanced: 'text-red-400'
    };
    return colors[difficulty] || 'text-slate-400';
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Interviews</h1>
          <p className="text-slate-400">View and manage all your interview sessions</p>
        </div>
        <button
          onClick={() => onNavigate('new-interview')}
          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>New Interview</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-sm">Status:</span>
          <div className="flex bg-slate-800 rounded-lg p-1">
            {['all', 'completed', 'in_progress', 'created'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-violet-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-sm">Type:</span>
          <div className="flex bg-slate-800 rounded-lg p-1">
            {['all', 'python', 'hr', 'web_development', 'cloud_computing'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-violet-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All' : getTypeIcon(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interview Cards */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading interviews...</div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterviews.map((interview) => (
          <div
            key={interview.id}
            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl">
                {getTypeIcon(interview.interview_type)}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(interview.status)}`}>
                {interview.status.replace('_', ' ')}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{interview.title}</h3>

            <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
              <span>{getTypeName(interview.interview_type)}</span>
              <span>•</span>
              <span className={getDifficultyColor(interview.difficulty)}>
                {interview.difficulty}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-400">Progress</span>
                <span className="text-white font-medium">
                  {interview.answered_questions}/{interview.total_questions}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${(interview.answered_questions / interview.total_questions) * 100}%` }}
                />
              </div>
            </div>

            {/* Score */}
            {interview.status === 'completed' && (
              <div className="flex items-center justify-between mb-4 p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400 text-sm">Score</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getGrade(interview.average_score).color}`}>
                    {interview.average_score.toFixed(1)}
                  </span>
                  <span className={`text-sm ${getGrade(interview.average_score).color}`}>
                    ({getGrade(interview.average_score).grade})
                  </span>
                </div>
              </div>
            )}

            {/* Date */}
            <p className="text-xs text-slate-500 mb-4">
              Created: {formatDate(interview.created_at)}
              {interview.completed_at && ` • Completed: ${formatDate(interview.completed_at)}`}
            </p>

            {/* Actions */}
            <div className="flex space-x-2">
              {interview.status === 'completed' ? (
                <>
                  <button
                    onClick={() => onNavigate('analytics')}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    View Results
                  </button>
                  <button
                    onClick={() => handleDelete(interview.id)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </>
              ) : interview.status === 'in_progress' ? (
                <button
                  onClick={() => handleResume(interview)}
                  className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={() => handleResume(interview)}
                  className="flex-1 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Start Interview
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {!isLoading && !error && filteredInterviews.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <span className="text-4xl">📭</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No interviews found</h3>
          <p className="text-slate-400 mb-6">Try adjusting your filters or create a new interview</p>
          <button
            onClick={() => onNavigate('new-interview')}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium"
          >
            Create Interview
          </button>
        </div>
      )}
    </div>
  );
}
