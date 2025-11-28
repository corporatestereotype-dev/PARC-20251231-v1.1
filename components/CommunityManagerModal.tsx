
import React, { useState } from 'react';
import type { Community } from '../types';
import CommunitySetupWizard from './CommunitySetupWizard';

interface CommunityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: Community[];
  activeCommunityId: string | null;
  onSwitch: (communityId: string) => void;
  onCreated: (newCommunity: Community) => void;
}

const CommunityManagerModal: React.FC<CommunityManagerModalProps> = ({ isOpen, onClose, communities, activeCommunityId, onSwitch, onCreated }) => {
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;
    
    if (isCreating) {
        return <CommunitySetupWizard onComplete={onCreated} isInitialSetup={false} onCancel={() => setIsCreating(false)} />;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-manager-title"
        >
            <div 
                className="bg-[var(--bg-secondary)] rounded-lg shadow-2xl p-8 w-full max-w-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    aria-label="Close community manager"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 id="community-manager-title" className="text-2xl font-bold text-white mb-2">Community Manager</h2>
                <p className="text-[var(--text-secondary)] mb-6">Switch between your created communities or create a new one.</p>
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {communities.map(community => (
                        <div key={community.id} className={`p-4 rounded-lg border flex items-center justify-between ${community.id === activeCommunityId ? 'bg-[var(--bg-tertiary)] border-[var(--accent-primary)]' : 'bg-[var(--bg-primary)] border-[var(--border-primary)]'}`}>
                            <div>
                                <h3 className="font-bold text-lg text-[var(--text-primary)]">{community.name}</h3>
                                <p className="text-sm text-[var(--text-secondary)] italic">"{community.themeDescription}"</p>
                            </div>
                            {community.id === activeCommunityId ? (
                                <span className="text-sm font-semibold bg-green-500/20 text-green-300 py-1 px-3 rounded-full">Active</span>
                            ) : (
                                <button
                                    onClick={() => onSwitch(community.id)}
                                    className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Switch
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--border-primary)]">
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                    >
                        + Create New Community
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommunityManagerModal;
