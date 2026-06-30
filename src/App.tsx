import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Interviews from './pages/Interviews';
import NewInterview from './pages/NewInterview';
import InterviewSession from './pages/InterviewSession';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import { api, getToken, clearTokens } from './utils/api';

export type Page = 'dashboard' | 'interviews' | 'new-interview' | 'interview-session' | 'analytics' | 'profile' | 'login' | 'register';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export interface Interview {
  id: number;
  title: string;
  interview_type: string;
  difficulty: string;
  status: string;
  total_questions: number;
  answered_questions: number;
  average_score: number;
  created_at: string;
  completed_at?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // On load, check if we already have a token and validate it against the backend
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }
      try {
        const profile = await api.get<User>('/auth/me');
        setUser(profile);
        setIsAuthenticated(true);
      } catch {
        clearTokens();
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    setAuthPage('login');
  };

  const handleStartInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setCurrentPage('interview-session');
  };

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen bg-slate-900 items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (authPage === 'register') {
      return <Register onRegister={handleLogin} onSwitchToLogin={() => setAuthPage('login')} />;
    }
    return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthPage('register')} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'interviews':
        return <Interviews onNavigate={setCurrentPage} onStartInterview={handleStartInterview} />;
      case 'new-interview':
        return <NewInterview onNavigate={setCurrentPage} onStartInterview={handleStartInterview} />;
      case 'interview-session':
        return selectedInterview ? (
          <InterviewSession interview={selectedInterview} onComplete={() => setCurrentPage('interviews')} />
        ) : (
          <Dashboard onNavigate={setCurrentPage} />
        );
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <Profile user={user} onUpdateUser={setUser} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
