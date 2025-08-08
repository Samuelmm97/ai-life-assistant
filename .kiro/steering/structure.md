# Project Structure

## Root Directory
```
├── src/                 # Source code
├── public/              # Static assets
├── build/               # Production build output
├── dist/                # Backend build output
├── .kiro/               # Kiro configuration and specs
└── node_modules/        # Dependencies
```

## Source Organization (`src/`)
```
src/
├── agents/              # ADK agent implementations and workflows
├── components/          # React UI components
├── services/            # Business logic and API services
├── models/              # Data models and classes
├── types/               # TypeScript type definitions
├── database/            # Database implementations
├── tools/               # ADK tools and integrations
├── backend/             # Backend services (when applicable)
├── __tests__/           # Test files
├── App.tsx              # Main application component
├── App.css              # Global application styles
├── index.tsx            # Application entry point
└── index.css            # Global CSS styles
```

## Architecture Patterns

### ADK Agent Architecture
- **Multi-agent systems** with specialized agents for different domains
- **Workflow orchestration** using Sequential, Parallel, and Loop agents
- **Tool integration** for enhanced agent capabilities
- **Agent hierarchy** for complex coordination and delegation

### Component Structure
- **Functional components** with React hooks
- **TypeScript interfaces** for all props
- **CSS modules** or component-specific CSS files
- **Event handlers** passed down from parent components

### Service Layer
- **Service classes** for business logic (e.g., `GoalService`)
- **Model classes** for data entities (e.g., `SMARTGoalModel`)
- **Database abstractions** for data persistence
- **Agent services** for ADK integration and orchestration

### State Management
- **React useState** for local component state
- **Props drilling** for shared state between components
- **Service layer** manages data operations and persistence
- **Agent state** managed through ADK workflow patterns

### Type System
- **Comprehensive TypeScript types** in `src/types/`
- **Enums** for status values and categories
- **Interfaces** for data structures
- **Agent interfaces** for ADK integration
- **Strict typing** enabled throughout

## Naming Conventions
- **PascalCase** for components and classes
- **camelCase** for functions, variables, and methods
- **UPPER_CASE** for enum values
- **kebab-case** for CSS classes and file names (when applicable)