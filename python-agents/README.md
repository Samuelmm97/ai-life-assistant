# Python ADK Agents Service

This directory contains the Python-based ADK (Agent Development Kit) agents that provide intelligent goal planning capabilities for the AI Life Assistant.

## Setup

### 1. Create Virtual Environment
```bash
python -m venv .venv
```

### 2. Activate Virtual Environment

**Windows (CMD):**
```bash
.venv\Scripts\activate.bat
```

**Windows (PowerShell):**
```bash
.venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Copy `.env.example` to `.env` and configure your API keys:
```bash
cp .env.example .env
```

**Required Configuration:**
1. **Google AI Studio API Key**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Set `GOOGLE_API_KEY=your_actual_api_key_here`

**Optional Configuration:**
2. **Google Cloud (for Vertex AI)**: If using Vertex AI instead of AI Studio
   - Set `GOOGLE_CLOUD_PROJECT=your_project_id`
   - Set `GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json`

3. **Other AI Providers**: If using OpenAI or Anthropic models
   - Set `OPENAI_API_KEY=your_openai_key` (for GPT models)
   - Set `ANTHROPIC_API_KEY=your_anthropic_key` (for Claude models)

**Important**: Never commit your actual `.env` file with real API keys to version control.

### 5. Run the Service
```bash
python app.py
```

The service will start on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- **GET** `/health` - Check service status

### Goal Planning
- **POST** `/api/plan-goal` - Plan a SMART goal from natural language
- **POST** `/api/analyze-goal` - Analyze existing goal for SMART criteria
- **POST** `/api/generate-smart-criteria` - Generate SMART criteria suggestions
- **POST** `/api/refine-goal` - Refine goal based on feedback

## Architecture

### Agents
- **GoalPlanningAgent** - Transforms natural language into SMART goals
- **GoalAnalysisAgent** - Analyzes goals for SMART criteria compliance
- **SMARTCriteriaAgent** - Generates specific SMART criteria suggestions

### Tools
- **SMARTGoalTool** - Utilities for SMART goal creation and validation
- **GoalValidationTool** - Comprehensive goal validation and improvement

## Integration with React Frontend

The Python service provides REST API endpoints that the TypeScript React frontend calls through the `ADKGoalPlanningService`. The service includes fallback mechanisms when the Python service is unavailable.

## Development

### Testing Agents
You can test individual agents by importing them in a Python script:

```python
from agents.goal_planning_agent import GoalPlanningAgent

agent = GoalPlanningAgent()
result = agent.run("I want to lose 20 pounds in 6 months")
print(result)
```

### Adding New Agents
1. Create new agent file in `agents/` directory
2. Implement using Google ADK patterns
3. Add endpoint in `app.py`
4. Update TypeScript service to call new endpoint

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure virtual environment is activated and dependencies installed
2. **Port Conflicts**: Change PORT in `.env` if 5000 is in use
3. **CORS Issues**: Verify CORS_ORIGINS includes your React dev server URL
4. **ADK Installation**: Ensure `google-adk` package is properly installed

### Logs
The service logs to console. Set `LOG_LEVEL=DEBUG` in `.env` for detailed logging.