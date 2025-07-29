import React, { useState, useEffect } from 'react';
import './App.css';
import { GoalForm } from './components/GoalForm';
import { Dashboard } from './components/Dashboard';
import { Navigation } from './components/Navigation';
import { GoalManager } from './components/GoalManager';
import { Calendar } from './components/Calendar';
import { SMARTGoal } from './types';
import { GoalService } from './services/GoalService';

type View = 'dashboard' | 'create-goal' | 'manage-goals' | 'calendar';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [goals, setGoals] = useState<SMARTGoal[]>([]);
  const [goalService] = useState(() => new GoalService());
  const [currentUserId] = useState('user-1'); // Mock user ID for MVP

  // Load goals from the goal service on component mount
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const userGoals = await goalService.getUserGoals(currentUserId);
        setGoals(userGoals);
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };

    loadGoals();
  }, [goalService, currentUserId]);

  const handleCreateGoal = async (goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const result = await goalService.createGoal(currentUserId, goalData);
      setGoals(prev => [...prev, result.goal]);
      setCurrentView('dashboard');

      // Show validation feedback if there were warnings
      if (result.validation.warnings.length > 0 || result.validation.suggestions.length > 0) {
        console.log('Goal created with recommendations:', result.validation);
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please check the form and try again.');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<SMARTGoal>) => {
    try {
      const updatedGoal = await goalService.updateGoal(goalId, updates);
      if (updatedGoal) {
        setGoals(prev => prev.map(goal => 
          goal.id === goalId ? updatedGoal : goal
        ));
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const success = await goalService.deleteGoal(goalId);
      if (success) {
        setGoals(prev => prev.filter(goal => goal.id !== goalId));
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleGoalClick = (goalId: string) => {
    setCurrentView('manage-goals');
  // We'll need to pass the selected goal ID to the GoalManager
  // For now, the user can select it from the list
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create-goal':
        return <GoalForm onSubmit={handleCreateGoal} onCancel={() => setCurrentView('dashboard')} />;
      case 'manage-goals':
        return (
          <GoalManager 
            goals={goals}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case 'calendar':
        return (
          <Calendar
            userId={currentUserId}
            goals={goals}
          />
        );
      case 'dashboard':
      default:
        return <Dashboard goals={goals} onGoalClick={handleGoalClick} />;
    }
  };

  return (
    <div className="App">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        goalCount={goals.length}
      />
      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;