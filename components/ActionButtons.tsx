import React from 'react';
import { X, Heart } from 'lucide-react';

interface ActionButtonsProps {
  onDislike: () => void;
  onLike: () => void;
  disabled: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onDislike, onLike, disabled }) => {
  return (
    <div className="flex items-center justify-center gap-8 pb-8 pt-4">
      <button
        onClick={onDislike}
        disabled={disabled}
        className="group relative flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full shadow-lg border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        aria-label="Dislike"
      >
        <X className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" strokeWidth={3} />
      </button>

      <button
        onClick={onLike}
        disabled={disabled}
        className="group relative flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full shadow-lg border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        aria-label="Like"
      >
        <Heart className="w-8 h-8 text-green-500 fill-current group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};

export default ActionButtons;