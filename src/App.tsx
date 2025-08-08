import React, { useState, useEffect } from 'react';
import './App.css';
import { GoalForm } from './components/GoalForm';
import { Dashboard } from './components/Dashboard';
import { Navigation } from './components/Navigation';
import { GoalManager } from './components/GoalManager';
import { Calendar } from './components/Calendar';
import { SMARTGoal } from './types';
import { GoalService } from './services/GoalService';
import { ADKGoalService } from './services/ADKGoalService';
import { ADKCalendarService } from './services/ADKCalendarService';
import { SMARTGoalOrchestrationService } from './services/SMARTGoalOrchestrationService';
import { ADKTestComponent } from './components/ADKTestComponent';

type View = 'dashboard' | 'create-goal' | 'manage-goals' | 'calendar' | 'adk-test';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [goals, setGoals] = useState<SMARTGoal[]>([]);
  const [goalService] = useState(() => new GoalService());
  const [adkGoalService] = useState(() => new ADKGoalService());
  const [adkCalendarService] = useState(() => new ADKCalendarService());
  const [orchestrationService] = useState(() => new SMARTGoalOrchestrationService());
  const [currentUserId] = useState('user-1'); // Mock user ID for MVP
  const [adkInitialized, setAdkInitialized] = useState(false);

  // Initialize ADK services and load goals
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize ADK services
        await adkGoalService.initialize();
        await adkCalendarService.initialize();
        setAdkInitialized(true);

        // Load goals from the goal service
        const userGoals = await goalService.getUserGoals(currentUserId);
        setGoals(userGoals);
      } catch (error) {
        console.error('Error initializing services or loading goals:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      adkGoalService.cleanup();
      adkCalendarService.cleanup();
    };
  }, [goalService, adkGoalService, adkCalendarService, currentUserId]);

  const handleCreateGoal = async (goalData: Omit<SMARTGoal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (adkInitialized) {
        // Use ADK-enhanced goal creation
        const result = await adkGoalService.createGoalWithADK(currentUserId, goalData);
        setGoals(prev => [...prev, result.goal]);
        setCurrentView('dashboard');

        // Log ADK analysis results
        console.log('Goal created with ADK analysis:', result.adkAnalysis);
      } else {
        // Fallback to orchestration service
        const result = await orchestrationService.createGoal(
          currentUserId,
          goalData.description,
          {
            domain: goalData.relevant.lifeAreas[0],
            priority: 'medium',
            useADKAnalysis: false,
            enableScheduling: true,
            context: [goalData.description]
          }
        );

        setGoals(prev => [...prev, result.goal]);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please check the form and try again.');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<SMARTGoal>) => {
    try {
      if (adkInitialized) {
        // Use ADK-enhanced goal updates
        const result = await adkGoalService.updateGoalWithADK(goalId, updates);

        if (result.goal) {
          setGoals(prev => prev.map(goal =>
            goal.id === goalId ? result.goal! : goal
          ));

          // Log ADK coordination results
          console.log('Goal updated with ADK coordination:', result.adkResult);
        }
      } else {
        // Fallback to orchestration service
        const result = await orchestrationService.updateGoal(goalId, updates, {
          useADK: false,
          recalculateSchedule: true
        });

        if (result.goal) {
          setGoals(prev => prev.map(goal => 
            goal.id === goalId ? result.goal : goal
          ));
        }
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
            adkCalendarService={adkInitialized ? adkCalendarService : undefined}
          />
        );
      case 'adk-test':
        return <ADKTestComponent />;
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
        adkEnabled={adkInitialized}
      />
      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;