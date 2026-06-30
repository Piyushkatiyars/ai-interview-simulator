import { useEffect, useState } from 'react';
import { Interview } from '../App';
import { api, ApiError } from '../utils/api';

interface InterviewSessionProps {
  interview: Interview;
  onComplete: () => void;
}

interface QuestionResponse {
  id: number;
  interview_id: number;
  question_number: number;
  question_text: string;
  question_type: string;
  max_score: number;
  is_answered: boolean;
}

interface StartInterviewResponse {
  interview_id: number;
  status: string;
  first_question: QuestionResponse | null;
  total_questions: number;
  message: string;
}

interface AnswerEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface SubmitAnswerResponse {
  answer: {
    id: number;
    question_id: number;
    answer_text: string;
    score: number;
    ai_feedback: string;
    created_at: string | null;
  };
  evaluation: AnswerEvaluation;
  next_question: {
    id: number;
    question_number: number;
    question_text: string;
    max_score: number;
  } | null;
  is_interview_complete: boolean;
  questions_remaining: number;
}

export default function InterviewSession({ interview, onComplete }: InterviewSessionProps) {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(interview.total_questions);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const start = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await api.post<StartInterviewResponse>(
          `/interviews/${interview.id}/start`
        );
        setTotalQuestions(result.total_questions);
        if (result.first_question) {
          setCurrentQuestion(result.first_question);
          setQuestionNumber(result.first_question.question_number);
        } else {
          // No unanswered questions left, treat as complete
          setIsComplete(true);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not start the interview.');
      } finally {
        setIsLoading(false);
      }
    };
    start();
  }, [interview.id]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;

    setIsSubmitting(true);
    setError('');

    try {
      const result = await api.post<SubmitAnswerResponse>('/interviews/submit-answer', {
        question_id: currentQuestion.id,
        answer_text: answer.trim(),
      });

      setEvaluation(result.evaluation);
      setScores((prev) => [...prev, result.evaluation.score]);
      setShowFeedback(true);

      if (result.is_interview_complete) {
        // Will move to the complete screen once the user clicks through
        setCurrentQuestion(null);
      } else if (result.next_question) {
        setCurrentQuestion({
          id: result.next_question.id,
          interview_id: interview.id,
          question_number: result.next_question.question_number,
          question_text: result.next_question.question_text,
          question_type: 'open_ended',
          max_score: result.next_question.max_score,
          is_answered: false,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit your answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) {
      setIsComplete(true);
      return;
    }
    setQuestionNumber(currentQuestion.question_number);
    setAnswer('');
    setEvaluation(null);
    setShowFeedback(false);
  };

  const getGrade = (score: number) => {
    if (score >= 9.5) return { grade: 'A+', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 9) return { grade: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 8.5) return { grade: 'B+', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 8) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 7.5) return { grade: 'C+', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (score >= 7) return { grade: 'C', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (score >= 6) return { grade: 'D', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { grade: 'F', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const completedCount = scores.length;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Starting interview...</p>
      </div>
    );
  }

  if (error && !currentQuestion && !isComplete) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium"
        >
          Back to Interviews
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Interview Complete!</h1>
          <p className="text-slate-400">Great job! Here's your performance summary</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-8 mb-8 text-center">
          <h2 className="text-lg text-slate-400 mb-2">Overall Score</h2>
          <div className={`text-6xl font-bold mb-2 ${getGrade(averageScore).color}`}>
            {averageScore.toFixed(1)}
          </div>
          <div className={`inline-block px-4 py-2 rounded-full ${getGrade(averageScore).bg} ${getGrade(averageScore).color}`}>
            Grade: {getGrade(averageScore).grade}
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Question Breakdown</h3>
          <div className="space-y-3">
            {scores.map((score, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                <span className="text-slate-400">Question {index + 1}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                  <span className={`font-bold ${getGrade(score).color}`}>{score.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onComplete}
          className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all"
        >
          Back to Interviews
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{interview.title}</h1>
          <p className="text-slate-400">Question {questionNumber} of {totalQuestions}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-slate-400">Progress</p>
            <p className="text-lg font-bold text-white">
              {Math.round((completedCount / totalQuestions) * 100)}%
            </p>
          </div>
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
          style={{ width: `${(completedCount / totalQuestions) * 100}%` }}
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
              Q{questionNumber}
            </div>
            <div className="flex-1">
              <p className="text-xl text-white leading-relaxed">{currentQuestion.question_text}</p>
            </div>
          </div>

          {!showFeedback ? (
            <>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-400">
                  {answer.split(' ').filter(w => w.length > 0).length} words
                </p>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || isSubmitting}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                    !answer.trim() || isSubmitting
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : evaluation && (
            <div className="space-y-6">
              {/* Score */}
              <div className={`p-6 rounded-xl ${getGrade(evaluation.score).bg} border border-slate-600`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Your Score</p>
                    <p className={`text-4xl font-bold ${getGrade(evaluation.score).color}`}>
                      {evaluation.score.toFixed(1)}/10
                    </p>
                  </div>
                  <div className={`text-6xl font-bold ${getGrade(evaluation.score).color}`}>
                    {getGrade(evaluation.score).grade}
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <h4 className="text-sm font-medium text-slate-400 mb-2">AI Feedback</h4>
                <p className="text-white">{evaluation.feedback}</p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <h4 className="text-sm font-medium text-emerald-400 mb-2">✅ Strengths</h4>
                  <ul className="space-y-1">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-300">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                  <h4 className="text-sm font-medium text-orange-400 mb-2">📈 Improvements</h4>
                  <ul className="space-y-1">
                    {evaluation.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-slate-300">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all"
              >
                {currentQuestion ? 'Next Question →' : 'Complete Interview'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
