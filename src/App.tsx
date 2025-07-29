import React, { useState, useEffect } from 'react';
import './App.css';
import { GoalForm } from './components/GoalForm';
import { Dashboard } from './components/Dashboard';
import { Navigation } from './components/Navigation';
import { GoalManager } from './components/GoalManager';
import { SMARTGoal } from './types';

type View = 'dashboard' | 'create-goal' | 'manage-goals';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [goals, setGoals] = useState<SMARTGoal[]>([]);

  // Load goals from localStorage on component mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('ai-life-assistant-goals');
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals);
        // Convert date strings back to Date objects
        const goalsWithDates = parsedGoals.map((goal: any) => ({
          ...goal,
          timeBound: {
            ...goal.timeBound,
            startDate: new Date(goal.timeBound.startDate),
            endDate: new Date(goal.timeBound.endDate),
            milestones: goal.timeBound.milestones.map((m: string) => new Date(m))
          },
          createdAt: new Date(goal.createdAt),
          updatedAt: new Date(goal.updatedAt)
        }));
        setGoals(goalsWithDates);
      } catch (error) {
        console.error('Error loading goals from localStorage:', error);
      }
    }
  }, []);

  // Save goals to localStorage whenever goals change
  useEffect(() => {
    localStorage.setItem('ai-life-assistant-goals', JSON.stringify(goals));
  }, [goals]);

  const handleCreateGoal = (goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newGoal: SMARTGoal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      userId: 'user-1', // Mock user ID for MVP
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setGoals(prev => [...prev, newGoal]);
    setCurrentView('dashboard');
  };

  const handleUpdateGoal = (goalId: string, updates: Partial<SMARTGoal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, ...updates, updatedAt: new Date() }
        : goal
    ));
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
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
      case 'dashboard':
      default:
        return <Dashboard goals={goals} />;
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