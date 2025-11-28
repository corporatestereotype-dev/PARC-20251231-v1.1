import React, { useState, useRef } from 'react';
import { DRIVE_ICON, EXHIBITION_ICON, PROJECTS_ICON, SETTINGS_ICON, PLATFORM_ICON, FEED_ICON, SYNTHETIC_USERS_ICON, HUB_ICON, METASWARM_ICON, NOTIFICATION_ICON } from '../constants';
import NotificationsPopover from './NotificationsPopover';
import type { User, View, Project } from '../types';

interface NavbarProps {
  user: User;
  setView: (view: View) => void;
  onLogout: () => void;
  activeView: View;
  onOpenSettings: () => void;
  projects: Project[];
  onAcceptInvitation: (projectId: string) => void;
  onDeclineInvitation: (projectId: string) => void;
}

const NavButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => {
  const baseClasses = "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  const activeClasses = "bg-slate-700 text-white";
  const inactiveClasses = "text-slate-300 hover:bg-slate-700 hover:text-white";
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      {children}
    </button>
  );
};

const Navbar: React.FC<NavbarProps> = ({ user, setView, onLogout, activeView, onOpenSettings, projects, onAcceptInvitation, onDeclineInvitation }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLButtonElement>(null);

  const pendingInvitationsCount = projects.reduce((count, project) => {
      if (project.pendingInvitations?.includes(user.email)) {
          return count + 1;
      }
      return count;
  }, 0);

  return (
    <>
      <header className="bg-slate-800/80 backdrop-blur-sm sticky top-0 z-50 shadow-md">
        <nav className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                {DRIVE_ICON}
                <span className="text-xl font-bold text-slate-100">PARC</span>
              </div>
              <div className="hidden md:flex items-baseline space-x-4">
                 <NavButton onClick={() => setView('feed')} isActive={activeView === 'feed'}>
                  {FEED_ICON} Research Feed
                </NavButton>
                <NavButton onClick={() => setView('projects')} isActive={activeView === 'projects'}>
                  {EXHIBITION_ICON} Project Directory
                </NavButton>
                <NavButton onClick={() => setView('workspace')} isActive={activeView === 'workspace'}>
                  {PROJECTS_ICON} My Workspace
                </NavButton>
                <NavButton onClick={() => setView('research-hub')} isActive={activeView === 'research-hub'}>
                  {HUB_ICON} Research Hub
                </NavButton>
                 <NavButton onClick={() => setView('metaswarm')} isActive={activeView === 'metaswarm'}>
                  {METASWARM_ICON} MetaSwarm Hub
                </NavButton>
                <NavButton onClick={() => setView('synthetic-users')} isActive={activeView === 'synthetic-users'}>
                  {SYNTHETIC_USERS_ICON} Synthetic Users
                </NavButton>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                 <button
                    ref={notificationsRef}
                    onClick={() => setIsNotificationsOpen(prev => !prev)}
                    className="p-2 relative rounded-full text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                    aria-label="Open notifications"
                  >
                    {NOTIFICATION_ICON}
                    {pendingInvitationsCount > 0 && (
                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs ring-2 ring-slate-800">{pendingInvitationsCount}</span>
                    )}
                  </button>
                 <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                    aria-label="Open settings"
                  >
                    {SETTINGS_ICON}
                  </button>
                <span className="text-slate-300 text-sm font-medium hidden sm:block">{user.name}</span>
                <img className="h-9 w-9 rounded-full" src={user.picture} alt="User avatar" />
                 <button
                    onClick={() => setView('platform-structure')}
                    className="p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                    aria-label="View Platform Structure"
                  >
                    {PLATFORM_ICON}
                  </button>
              </div>
              <button
                onClick={onLogout}
                className="ml-4 text-slate-300 hover:text-white text-sm font-medium"
                aria-label="Sign out"
              >
                Sign Out
              </button>
            </div>
          </div>
           {/* Mobile Nav Buttons */}
           <div className="md:hidden pb-3 flex items-baseline space-x-2 justify-center flex-wrap">
              <NavButton onClick={() => setView('feed')} isActive={activeView === 'feed'}>
                  {FEED_ICON} Feed
              </NavButton>
              <NavButton onClick={() => setView('projects')} isActive={activeView === 'projects'}>
                  {EXHIBITION_ICON} Projects
              </NavButton>
              <NavButton onClick={() => setView('workspace')} isActive={activeView === 'workspace'}>
                  {PROJECTS_ICON} Workspace
              </NavButton>
              <NavButton onClick={() => setView('research-hub')} isActive={activeView === 'research-hub'}>
                  {HUB_ICON} Hub
              </NavButton>
              <NavButton onClick={() => setView('metaswarm')} isActive={activeView === 'metaswarm'}>
                  {METASWARM_ICON} MetaSwarm
              </NavButton>
              <NavButton onClick={() => setView('synthetic-users')} isActive={activeView === 'synthetic-users'}>
                  {SYNTHETIC_USERS_ICON} Synths
              </NavButton>
          </div>
        </nav>
      </header>
      <NotificationsPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        projects={projects}
        user={user}
        onAccept={onAcceptInvitation}
        onDecline={onDeclineInvitation}
        anchorRef={notificationsRef}
      />
    </>
  );
};

export default Navbar;