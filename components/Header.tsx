
import React from 'react';
import { Plus, Flame, Utensils, Settings } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  onAddDish: () => void;
  currentView: 'swipe' | 'matches';
  onViewChange: (view: 'swipe' | 'matches') => void;
  matchCount: number;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  allUsers, 
  onSwitchUser, 
  onAddDish,
  currentView,
  onViewChange,
  matchCount
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 z-[50]">
      <header className="px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => {
            if (confirm("Möchtest du das Profil wechseln?")) {
              localStorage.removeItem('dsm_active_user_id');
              window.location.reload();
            }
          }}
          className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-slate-700/50"
        >
          <span>{currentUser.avatar}</span>
          <span className="hidden xs:inline">Profil</span>
        </button>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-full border border-slate-800 shadow-inner">
          <button
            onClick={() => onViewChange('swipe')}
            className={`p-2.5 rounded-full transition-all duration-300 ${currentView === 'swipe' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Flame size={20} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onViewChange('matches')}
            className={`p-2.5 rounded-full transition-all duration-300 relative ${currentView === 'matches' ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Utensils size={20} strokeWidth={2.5} />
            {matchCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-in zoom-in">
                {matchCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onAddDish}
          className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 active:scale-90 transition-all shadow-lg shadow-blue-900/30"
          aria-label="Gericht hinzufügen"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </header>
    </div>
  );
};

export default Header;
