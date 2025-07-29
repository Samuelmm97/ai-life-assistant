import React from 'react';

interface NavigationProps {
  currentView: 'dashboard' | 'create-goal' | 'manage-goals';
  onViewChange: (view: 'dashboard' | 'create-goal' | 'manage-goals') => void;
  goalCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, goalCount }) => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>AI Life Assistant</h1>
      </div>
      <div className="nav-links">
        <button 
          className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          Dashboard
          {goalCount > 0 && <span className="badge">{goalCount}</span>}
        </button>
        <button 
          className={`nav-button ${currentView === 'create-goal' ? 'active' : ''}`}
          onClick={() => onViewChange('create-goal')}
        >
          Create Goal
        </button>
        <button 
          className={`nav-button ${currentView === 'manage-goals' ? 'active' : ''}`}
          onClick={() => onViewChange('manage-goals')}
        >
          Manage Goals
        </button>
      </div>
    </nav>
  );
};