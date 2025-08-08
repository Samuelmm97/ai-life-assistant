import React from 'react';

type View = 'dashboard' | 'create-goal' | 'manage-goals' | 'calendar' | 'adk-test';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  goalCount: number;
  adkEnabled?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, goalCount, adkEnabled = false }) => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>🎯 AI Life Assistant</h1>
        <p>Your personal goal achievement companion</p>
      </div>

      <div className="nav-menu">
        <button 
          className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          📊 Dashboard
        </button>

        <button 
          className={`nav-button ${currentView === 'create-goal' ? 'active' : ''}`}
          onClick={() => onViewChange('create-goal')}
        >
          ➕ Create Goal
        </button>

        <button 
          className={`nav-button ${currentView === 'manage-goals' ? 'active' : ''}`}
          onClick={() => onViewChange('manage-goals')}
        >
          ⚙️ Manage Goals ({goalCount})
        </button>

        <button
          className={`nav-button ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => onViewChange('calendar')}
        >
          📅 Calendar
        </button>

        <button
          className={`nav-button ${currentView === 'adk-test' ? 'active' : ''}`}
          onClick={() => onViewChange('adk-test')}
        >
          🧪 ADK Test
        </button>
      </div>

      <div className="nav-stats">
        <span className="goal-count">
          {goalCount} {goalCount === 1 ? 'Goal' : 'Goals'}
        </span>
        <span className={`adk-status ${adkEnabled ? '' : 'disabled'}`}>
          ADK {adkEnabled ? 'Active' : 'Inactive'}
        </span>
      </div>
    </nav>
  );
};