import React from 'react';
import { Plus, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  onAddDish: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, allUsers, onSwitchUser, onAddDish }) => {
  const otherUser = allUsers.find(u => u.id !== currentUser.id) || allUsers[0];

  return (
    <header className="px-4 py-4 flex items-center justify-between bg-slate-900 border-b border-slate-800 z-[50]">
      {/* User Switcher (Simulating login) */}
      <button 
        onClick={() => onSwitchUser(otherUser.id)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border border-slate-700"
      >
        <span className="text-xl">{currentUser.avatar}</span>
        <span className="truncate max-w-[100px]">{currentUser.name}</span>
        <span className="text-xs text-slate-500 ml-1">(Switch)</span>
      </button>

      <div className="text-lg font-bold text-white tracking-tight">DinnerMatch</div>

      <button
        onClick={onAddDish}
        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
        aria-label="Add Dish"
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </header>
  );
};

export default Header;