import React from 'react';

interface HeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const Header: React.FC<HeaderProps> = ({ icon, title, subtitle }) => {
  return (
    <div className="mb-12 text-center">
      <div className="inline-flex items-center justify-center p-4 bg-slate-800 rounded-full mb-4">
        <div className="text-blue-400 w-8 h-8">
            {icon}
        </div>
      </div>
      <h1 className="text-5xl font-extrabold text-slate-100 mb-2">{title}</h1>
      <p className="text-xl text-slate-400 max-w-3xl mx-auto">{subtitle}</p>
    </div>
  );
};

export default Header;
