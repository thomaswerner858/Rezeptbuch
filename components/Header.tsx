
import React from 'react';
import { Plus, Flame, Utensils } from 'lucide-react';
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
  const otherUser = allUsers.find(u => u.id !== currentUser.id) || allUsers[0];

  return (
    <div className="bg-slate-900 border-b border-slate-800 z-[50]">
      <header className="px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => onSwitchUser(otherUser.id)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-slate-700"
        >
          <span className="text-lg">{currentUser.avatar}</span>
          <span className="truncate max-w-[80px]">{currentUser.name}</span>
        </button>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-full border border-slate-800">
          <button
            onClick={() => onViewChange('swipe')}
            className={`p-2 rounded-full transition-all ${currentView === 'swipe' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Flame size={20} />
          </button>
          <button
            onClick={() => onViewChange('matches')}
            className={`p-2 rounded-full transition-all relative ${currentView === 'matches' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Utensils size={20} />
            {matchCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
                {matchCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onAddDish}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
          aria-label="Add Dish"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </header>
    </div>
  );
};

export default Header;
