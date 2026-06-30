import { Page, User } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ currentPage, onNavigate, user, onLogout, isOpen, onToggle }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: '📊' },
    { id: 'interviews' as Page, label: 'Interviews', icon: '💼' },
    { id: 'new-interview' as Page, label: 'New Interview', icon: '➕' },
    { id: 'analytics' as Page, label: 'Analytics', icon: '📈' },
    { id: 'profile' as Page, label: 'Profile', icon: '👤' },
  ];

  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-slate-800 border-r border-slate-700 transition-all duration-300 z-50 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">AI Interview</h1>
              <p className="text-xs text-slate-400">Simulator</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        {isOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user.full_name || user.username}</p>
                <p className="text-xs text-slate-400">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              🚪
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
              {(user.full_name || user.username || '?').charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              🚪
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
