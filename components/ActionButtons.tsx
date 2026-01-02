
import React from 'react';
import { X, Heart, Plus } from 'lucide-react';

interface ActionButtonsProps {
  onDislike: () => void;
  onLike: () => void;
  onAdd: () => void;
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onDislike, onLike, onAdd, disabled }) => {
  return (
    <div className="flex items-center justify-center gap-6 pb-8 pt-4 px-4">
      <button
        onClick={onDislike}
        disabled={disabled}
        className="group relative flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full shadow-lg border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all hover:bg-slate-800"
        aria-label="Dislike"
      >
        <X className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" strokeWidth={3} />
      </button>

      <button
        onClick={onAdd}
        className="group relative flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full shadow-xl border border-blue-500 active:scale-95 transition-all hover:bg-blue-500 hover:scale-105"
        aria-label="Hinzufügen"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={3} />
      </button>

      <button
        onClick={onLike}
        disabled={disabled}
        className="group relative flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full shadow-lg border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all hover:bg-slate-800"
        aria-label="Like"
      >
        <Heart className="w-8 h-8 text-green-500 fill-current group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};

export default ActionButtons;
