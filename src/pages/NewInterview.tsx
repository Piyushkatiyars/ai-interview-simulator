import { useState } from 'react';
import { Page, Interview } from '../App';
import { api, ApiError } from '../utils/api';

interface NewInterviewProps {
  onNavigate: (page: Page) => void;
  onStartInterview: (interview: Interview) => void;
}

interface InterviewType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function NewInterview({ onNavigate, onStartInterview }: NewInterviewProps) {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('intermediate');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const interviewTypes: InterviewType[] = [
    {
      id: 'hr',
      name: 'HR & Behavioral',
      description: 'Soft skills, teamwork, leadership, and situational questions',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'python',
      name: 'Python Programming',
      description: 'Python fundamentals, data structures, OOP, and best practices',
      icon: '🐍',
      color: 'from-yellow-500 to-green-500'
    },
    {
      id: 'web_development',
      name: 'Web Development',
      description: 'HTML, CSS, JavaScript, React, APIs, and web technologies',
      icon: '🌐',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'cloud_computing',
      name: 'Cloud Computing',
      description: 'AWS, Azure, Docker, Kubernetes, and DevOps practices',
      icon: '☁️',
      color: 'from-cyan-500 to-blue-500'
    }
  ];

  const difficulties = [
    { id: 'beginner', name: 'Beginner', description: 'Fundamental concepts', icon: '🌱' },
    { id: 'intermediate', name: 'Intermediate', description: 'Solid understanding required', icon: '🌿' },
    { id: 'advanced', name: 'Advanced', description: 'Expert-level questions', icon: '🌳' }
  ];

  const handleCreate = async () => {
    if (!title.trim() || !selectedType) return;

    setIsCreating(true);
    setError('');

    try {
      const newInterview = await api.post<Interview>('/interviews/', {
        title: title.trim(),
        interview_type: selectedType,
        difficulty,
        total_questions: questionCount,
      });
      onStartInterview(newInterview);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => onNavigate('interviews')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <span>←</span>
          <span>Back to Interviews</span>
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Create New Interview</h1>
        <p className="text-slate-400">Set up your practice interview session</p>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Interview Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Python Backend Practice Session"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Interview Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-4">
            Interview Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                  selectedType === type.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-2xl`}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{type.name}</h3>
                    <p className="text-sm text-slate-400">{type.description}</p>
                  </div>
                  {selectedType === type.id && (
                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-white mb-4">
            Difficulty Level
          </label>
          <div className="flex space-x-4">
            {difficulties.map((level) => (
              <button
                key={level.id}
                onClick={() => setDifficulty(level.id)}
                className={`flex-1 p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  difficulty === level.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <span className="text-2xl block mb-2">{level.icon}</span>
                <h4 className="font-medium text-white">{level.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{level.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium text-white mb-4">
            Number of Questions: <span className="text-violet-400">{questionCount}</span>
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>3 (Quick)</span>
            <span>5 (Standard)</span>
            <span>10 (Thorough)</span>
          </div>
        </div>

        {/* Preview */}
        {selectedType && title && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Interview Preview</h3>
            <div className="flex items-start space-x-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${interviewTypes.find(t => t.id === selectedType)?.color} flex items-center justify-center text-3xl`}>
                {interviewTypes.find(t => t.id === selectedType)?.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white">{title}</h4>
                <p className="text-slate-400 mt-1">
                  {interviewTypes.find(t => t.id === selectedType)?.name} • {difficulties.find(d => d.id === difficulty)?.name}
                </p>
                <div className="flex items-center space-x-4 mt-3 text-sm text-slate-400">
                  <span>📝 {questionCount} questions</span>
                  <span>⏱️ ~{questionCount * 3} minutes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <div className="flex space-x-4">
          <button
            onClick={() => onNavigate('interviews')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || !selectedType || isCreating}
            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              !title.trim() || !selectedType || isCreating
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white'
            }`}
          >
            {isCreating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating Interview...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Start Interview</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(to right, #8b5cf6, #a855f7);
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(to right, #8b5cf6, #a855f7);
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
