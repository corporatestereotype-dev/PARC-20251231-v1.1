
import React from 'react';
import type { Project } from '../types';

interface ExhibitionCardProps {
  project: Project;
}

const ExhibitionCard: React.FC<ExhibitionCardProps> = ({ project }) => {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
      <img src={project.imageUrl} alt={project.title} className="w-full h-48 object-cover" />
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-100 mb-2">{project.title}</h3>
        <p className="text-sm font-medium text-blue-400 mb-4">By: {project.authorName}</p>
        <p className="text-slate-400 leading-relaxed flex-grow">
          {project.description}
        </p>
        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span key={tag} className="bg-slate-700 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExhibitionCard;