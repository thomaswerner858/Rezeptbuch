import React from 'react';

const NoMatchView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
      <div className="bg-slate-900 p-6 rounded-full mb-6 border border-slate-800 shadow-lg">
        <span className="text-6xl">🤷</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">No Matches Yet!</h2>
      <p className="text-slate-400 mb-8 max-w-xs mx-auto">
        You've gone through all the dishes.
      </p>
    </div>
  );
};

export default NoMatchView;