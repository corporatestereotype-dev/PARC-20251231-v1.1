import React from 'react';
import type { FeedItem } from '../types';

interface FeedCardProps {
  item: FeedItem;
}

const TypeIcon: React.FC<{type: FeedItem['type']}> = ({ type }) => {
    const baseClass = "h-7 w-7 text-slate-400";
    switch(type) {
        case 'new-project':
            return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        case 'discussion':
            return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
        case 'milestone':
             return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        default:
            return null;
    }
}

const FeedCard: React.FC<FeedCardProps> = ({ item }) => {
  return (
    <div className="bg-slate-800/70 p-5 rounded-lg flex gap-4">
      <div className="flex-shrink-0 pt-1">
        <TypeIcon type={item.type} />
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-2">
            <img src={item.user.picture} alt={item.user.name} className="w-6 h-6 rounded-full" />
            <p className="text-slate-300">
                <span className="font-semibold text-white">{item.user.name}</span> {item.summary}
            </p>
        </div>
        
        <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700">
             <h4 className="font-bold text-blue-400 mb-1">{item.project.title}</h4>
             <p className="text-sm text-slate-400 line-clamp-2">{item.project.description}</p>
        </div>

        <p className="text-xs text-slate-500 mt-2 text-right">{item.timestamp}</p>
      </div>
    </div>
  );
};

export default FeedCard;
