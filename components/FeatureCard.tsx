import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 text-blue-400 mt-1 w-6 h-6">{icon}</div>
        <div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
