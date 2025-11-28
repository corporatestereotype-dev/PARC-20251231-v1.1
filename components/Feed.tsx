import React from 'react';
import FeedCard from './FeedCard';
import type { FeedItem } from '../types';

interface FeedProps {
  items: FeedItem[];
}

const Feed: React.FC<FeedProps> = ({ items }) => {
  return (
    <section>
      <h1 className="text-4xl font-bold text-center text-slate-100 mb-2">Research Feed</h1>
      <p className="text-lg text-slate-400 text-center mb-10">
        Catch up on the latest activities and contributions from the PARC community.
      </p>
      <div className="max-w-3xl mx-auto space-y-6">
        {items.map(item => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

export default Feed;
