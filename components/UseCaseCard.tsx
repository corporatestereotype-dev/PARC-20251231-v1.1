import React from 'react';

interface UseCaseCardProps {
  title: string;
  onClick: () => void;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({ title, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-slate-800 p-4 rounded-lg hover:bg-slate-700/50 border border-slate-700 transition-all duration-200 hover:border-blue-500/50"
    >
      <p className="text-sm font-medium text-slate-300">{title}</p>
    </button>
  );
};

export default UseCaseCard;
