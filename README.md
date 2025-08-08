# AI Life Assistant

A comprehensive personal development platform that helps users achieve their life goals through intelligent planning, organization, and tracking using SMART goal methodology.

## 🚀 Features

- **AI-Powered Goal Planning**: Uses Google ADK agents to transform natural language into structured SMART goals
- **SMART Goal Creation**: Guided goal creation following Specific, Measurable, Achievable, Relevant, Time-bound criteria
- **Intelligent Goal Analysis**: ADK agents analyze goals for SMART criteria compliance and provide improvement suggestions
- **Interactive Dashboard**: Visual progress tracking with statistics and goal overview
- **Goal Management**: Complete lifecycle management with status updates and progress tracking
- **Goal Refinement**: AI-powered goal refinement based on user feedback
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Data Persistence**: Goals are saved locally and persist between sessions
- **Fallback Support**: Graceful degradation when ADK service is unavailable

## 🏗️ Project Structure

```
src/
├── components/      # React components (Dashboard, GoalForm, GoalManager, Navigation)
├── types/          # TypeScript type definitions
├── models/         # Data models and business logic
├── database/       # Database implementations
├── App.tsx         # Main application component
└── index.tsx       # Application entry point
```

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript for UI components
- **Create React App** as build system and development server
- **Custom CSS** with responsive design patterns
- **localStorage** for client-side data persistence

### AI Agent Framework
- **Google Agent Development Kit (ADK)** for AI agent orchestration and workflow management (Python-based)
- **Python backend service** hosting ADK agents with REST API endpoints
- **Multi-agent architecture** with specialized agents for different domains
- **Model-agnostic design** supporting Gemini and other AI models
- **Flexible orchestration** with Sequential, Parallel, and Loop workflow agents

### Backend Services
- **Python Flask** for ADK agent hosting and API endpoints
- **TypeScript** for frontend business logic and services
- **UUID** for unique identifier generation

### Development Tools
- **TypeScript 5.8+** with strict mode enabled
- **Jest** with ts-jest for testing
- **Concurrently** for running multiple development services

## 📱 Application Views

### Dashboard
- Goal statistics overview
- Progress visualization
- Recent goals with status tracking
- Empty state handling

### Create Goal
- Comprehensive SMART goal creation form
- Dynamic form fields for metrics and milestones
- Validation and data handling

### Manage Goals
- Two-panel interface for goal browsing
- Detailed goal information display
- Progress updates and status management
- Goal deletion with confirmation

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Python 3.8+ (for ADK agents)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd ai-life-assistant

# Install dependencies
npm install
```

### Development

#### Quick Start (Frontend Only)
```bash
# Start React development server
npm start
# or
npm run dev

# The app will open at http://localhost:3000
```

#### Full Development with ADK Agents
```bash
# Setup Python virtual environment
npm run setup-python

# Activate virtual environment (Windows CMD)
cd python-agents && .venv\Scripts\activate.bat

# Install Python dependencies
npm run install-python-deps

# Start both React frontend and Python ADK service
npm run dev-full
```

#### Manual Setup
```bash
# Terminal 1: Start Python ADK service
npm run dev-python

# Terminal 2: Start React frontend
npm start
```

### Build
```bash
# Create production build
npm run build

# The build folder will contain the optimized production files
```

### Testing
```bash
# Run tests
npm test
```

### Available Scripts
- `npm run dev` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run dev-python` - Start Python ADK agents service
- `npm run setup-python` - Create Python virtual environment
- `npm run install-python-deps` - Install Python dependencies
- `npm run dev-full` - Start both frontend and Python service

## 📋 Usage

1. **Create Your First Goal**: Click "Create Goal" to start building a SMART goal
2. **Track Progress**: Use the Dashboard to monitor your goal progress and statistics
3. **Manage Goals**: Visit "Manage Goals" to update progress, change status, or delete goals
4. **Stay Motivated**: Check your dashboard regularly to see your progress and stay on track

## ✅ Implementation Status

### Completed Features
- ✅ React-based web application with responsive design
- ✅ SMART goal creation form with comprehensive criteria
- ✅ Interactive dashboard with progress visualization
- ✅ Goal management interface (view, edit, delete)
- ✅ Navigation and user interface
- ✅ Data persistence with localStorage
- ✅ Progress tracking and status management

### Upcoming Features
- 🔄 AI-powered action plan generation
- 🔄 Advanced analytics and insights
- 🔄 Goal templates and recommendations
- 🔄 Export and sharing capabilities

## 🤝 Contributing

This project follows a spec-driven development approach. See the `.kiro/specs/ai-life-assistant/` directory for detailed requirements, design, and implementation tasks.

## 📄 License

MIT License - see LICENSE file for details