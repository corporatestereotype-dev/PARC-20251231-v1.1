import React from 'react';
import type { Project, User } from '../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  user: User;
  onAccept: (projectId: string) => void;
  onDecline: (projectId: string) => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose, projects, user, onAccept, onDecline, anchorRef }) => {
  if (!isOpen) return null;

  const invitations = projects.filter(p => p.pendingInvitations?.includes(user.email));

  const popoverStyle: React.CSSProperties = {};
  if (anchorRef.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    popoverStyle.top = `${rect.bottom + 8}px`;
    popoverStyle.right = `${window.innerWidth - rect.right}px`;
  }

  return (
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={popoverStyle}
        className="absolute w-80 max-w-sm bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-50"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Notifications</h3>
        </div>
        <div className="p-2 max-h-96 overflow-y-auto">
          {invitations.length > 0 ? (
            <ul className="space-y-2">
              {invitations.map(project => (
                <li key={project.id} className="bg-slate-900/50 p-3 rounded-md">
                  <p className="text-sm text-slate-300 mb-3">
                    <span className="font-semibold text-white">{project.authorName}</span> invited you to collaborate on the project: <span className="font-semibold text-blue-400">{project.title}</span>
                  </p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { onDecline(project.id); onClose(); }} className="text-xs bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Decline</button>
                    <button onClick={() => { onAccept(project.id); onClose(); }} className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">Accept</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 text-center p-4">No new notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPopover;