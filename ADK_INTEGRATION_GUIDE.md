# ADK Integration Guide

This guide helps you test the Python ADK integration with your TypeScript frontend.

## Quick Start

### 1. Start the Python ADK Service

```bash
# Navigate to the Python agents directory
cd python-agents

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# Windows CMD:
.venv\Scripts\activate.bat
# Windows PowerShell:
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the Flask API server
python app.py
```

The Python service should start on `http://localhost:5000`

### 2. Start the React Frontend

```bash
# In the root directory (separate terminal)
npm start
```

The React app should start on `http://localhost:3000`

### 3. Test the Integration

1. Open your browser to `http://localhost:3000`
2. Click on "🧪 ADK Test" in the navigation
3. Check that the service health shows "Healthy"
4. Test goal planning with the sample input or your own

## Available Python API Endpoints

Your Python Flask app provides these endpoints:

- `GET /health` - Health check
- `GET /api/agents/info` - Get information about available agents
- `POST /api/plan-goal` - Plan a goal from natural language
- `POST /api/analyze-goal` - Analyze an existing goal
- `POST /api/generate-smart-criteria` - Generate SMART criteria
- `POST /api/refine-goal` - Refine a goal based on feedback

## TypeScript Services Created

### PythonADKService
- `src/services/PythonADKService.ts` - Simple service to connect to Python API
- Methods: `checkHealth()`, `planGoal()`, `analyzeGoal()`, etc.

### Updated ADKGoalPlanningService
- `src/services/ADKGoalPlanningService.ts` - Enhanced to use Python API
- Includes fallback mechanisms when Python service is unavailable

### Test Component
- `src/components/ADKTestComponent.tsx` - UI to test Python API connection
- Shows service health, agents info, and allows testing goal planning

## Troubleshooting

### Python Service Issues

1. **Service not starting:**
   ```bash
   # Check if virtual environment is activated
   which python  # Should show path to .venv/Scripts/python
   
   # Install dependencies again
   pip install -r requirements.txt
   ```

2. **Import errors:**
   ```bash
   # Check if google-adk is installed
   pip list | grep google-adk
   
   # If not installed:
   pip install google-adk>=1.8.0
   ```

3. **Port already in use:**
   ```bash
   # Kill process on port 5000
   # Windows:
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### Frontend Issues

1. **CORS errors:**
   - The Python Flask app includes `flask-cors` to handle this
   - Make sure it's installed: `pip install flask-cors`

2. **Connection refused:**
   - Ensure Python service is running on localhost:5000
   - Check the browser console for specific error messages

### Testing the Integration

1. **Health Check Test:**
   - Should show "Healthy" status
   - If not, check Python service logs

2. **Agents Info Test:**
   - Should show 4 agents: master_orchestrator, goal_planning, goal_analysis, smart_criteria
   - If empty, check agent initialization in Python

3. **Goal Planning Test:**
   - Try: "I want to lose 10 pounds in 3 months"
   - Should return structured goal data
   - Check Python service logs for any errors

## Next Steps

Once the basic integration is working:

1. **Enhance Goal Creation:** Update `GoalForm.tsx` to use ADK agents
2. **Improve Analysis:** Use ADK agents in goal analysis features
3. **Add Real-time Features:** Implement WebSocket for real-time agent updates
4. **Error Handling:** Add better error handling and user feedback
5. **Performance:** Add caching and optimize API calls

## Example Usage

```typescript
import { getPythonADKService } from './services/PythonADKService';

const adkService = getPythonADKService();

// Check if service is available
const isHealthy = await adkService.checkHealth();

// Plan a goal
const result = await adkService.planGoal("I want to learn Python in 6 months");

// Generate SMART criteria
const criteria = await adkService.generateSMARTCriteria("Learn Python", "Programming skill development");
```

## Configuration

You can configure the Python service URL in the TypeScript services:

```typescript
// Default: http://localhost:5000
const adkService = new PythonADKService('http://your-python-service:5000');
```

For production, you'll want to use environment variables:

```typescript
const adkService = new PythonADKService(process.env.REACT_APP_ADK_SERVICE_URL || 'http://localhost:5000');
```