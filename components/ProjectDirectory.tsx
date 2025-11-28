
import React, { useState, useMemo } from 'react';
import ExhibitionCard from './ExhibitionCard';
import type { Project } from '../types';

interface ProjectDirectoryProps {
  projects: Project[];
}

const ProjectDirectory: React.FC<ProjectDirectoryProps> = ({ projects }) => {
  const [filterAuthor, setFilterAuthor] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const displayedProjects = useMemo(() => {
    let filtered = projects.filter(p => 
      p.authorName.toLowerCase().includes(filterAuthor.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'desc-len-asc':
          return a.description.length - b.description.length;
        case 'desc-len-desc':
          return b.description.length - a.description.length;
        case 'date-desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [projects, filterAuthor, sortBy]);

  return (
    <section>
      <h1 className="text-4xl font-bold text-center text-slate-100 mb-2">Project Directory</h1>
      <p className="text-lg text-slate-400 text-center mb-10">Browse, discover, and connect with ongoing research in the PARC community.</p>
      
      <div className="max-w-4xl mx-auto mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-grow w-full">
          <label htmlFor="author-filter" className="block text-sm font-medium text-slate-300 mb-1">Filter by Author</label>
          <input
            id="author-filter"
            type="text"
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            placeholder="Enter author name..."
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <label htmlFor="sort-by" className="block text-sm font-medium text-slate-300 mb-1">Sort by</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="date-desc">Newest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="desc-len-desc">Description (Longest)</option>
            <option value="desc-len-asc">Description (Shortest)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedProjects.map(project => (
          <ExhibitionCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
};

export default ProjectDirectory;