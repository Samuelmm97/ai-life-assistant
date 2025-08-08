# Technology Stack

## AI Agent Framework
- **Google Agent Development Kit (ADK)** for AI agent orchestration and workflow management (Python-based)
- **Python backend service** hosting ADK agents with REST API endpoints
- **Multi-agent architecture** with specialized agents for different domains
- **Model-agnostic design** supporting Gemini and other AI models
- **Flexible orchestration** with Sequential, Parallel, and Loop workflow agents
- **TypeScript service layer** for frontend-backend communication

## Frontend
- **React 19** with TypeScript for UI components
- **Create React App** as build system and development server
- **Custom CSS** with responsive design patterns
- **localStorage** for client-side data persistence

## Backend Services
- **Python Flask/FastAPI** for ADK agent hosting and API endpoints
- **TypeScript** for frontend business logic and services
- **SQLite3** for database operations (when needed)
- **UUID** for unique identifier generation

## Development Tools
- **TypeScript 5.8+** with strict mode enabled
- **Jest** with ts-jest for testing
- **ts-node** for development execution
- **ESLint** configuration via Create React App

## Common Commands

### Development
```bash
# Start React development server
npm start
npm run dev

# Start Python ADK agent service
cd python-agents
python -m venv .venv
.venv\Scripts\activate.bat  # Windows CMD
pip install -r requirements.txt
python app.py

# Start backend services (when applicable)
npm run dev-backend
```

### Building
```bash
# Build frontend for production
npm run build

# Build backend TypeScript
npm run build-backend
```

### Testing
```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test -- --watchAll=false
```

## TypeScript Configuration
- Target: ES2022
- Strict mode enabled
- JSX: react-jsx
- Module resolution: node
- Includes: src/**/*
- Excludes: node_modules, dist, test files

## ADK Integration
- **Agent orchestration** for complex goal planning workflows
- **Tool ecosystem** integration for enhanced AI capabilities
- **Deployment patterns** supporting local development and cloud scaling
- **Safety and security** best practices for AI agent development