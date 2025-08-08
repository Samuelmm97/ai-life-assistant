"""
Flask API server for ADK agents integration with AI Life Assistant
"""
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import ADK agents
try:
    from agents.goal_planning_agent import GoalPlanningAgent
    from agents.goal_analysis_agent import GoalAnalysisAgent
    from agents.smart_criteria_agent import SMARTCriteriaAgent
    AGENTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import agents: {e}")
    AGENTS_AVAILABLE = False

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize ADK agents if available
if AGENTS_AVAILABLE:
    try:
        goal_planning_agent = GoalPlanningAgent()
        goal_analysis_agent = GoalAnalysisAgent()
        smart_criteria_agent = SMARTCriteriaAgent()
        print("ADK agents initialized successfully")
    except Exception as e:
        print(f"Error initializing agents: {e}")
        AGENTS_AVAILABLE = False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ADK Agent Service'})

@app.route('/api/agents/info', methods=['GET'])
def get_agents_info():
    """Get information about all available agents"""
    try:
        if not AGENTS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Agents not available',
                'agents': {},
                'total_agents': 0
            })
        
        agents_info = {
            'goal_planning': goal_planning_agent.get_agent_info(),
            'goal_analysis': goal_analysis_agent.get_agent_info(),
            'smart_criteria': smart_criteria_agent.get_agent_info()
        }
        
        return jsonify({
            'success': True,
            'agents': agents_info,
            'total_agents': len(agents_info)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/plan-goal', methods=['POST'])
def plan_goal():
    """Plan a SMART goal from natural language input using ADK orchestration"""
    try:
        if not AGENTS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Agents not available'
            }), 503
        
        data = request.get_json()
        user_input = data.get('input', '')
        
        if not user_input:
            return jsonify({'error': 'Input is required'}), 400
        
        # Use goal planning agent with async support
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(goal_planning_agent.run_async(user_input))
        finally:
            loop.close()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'agent': 'GoalPlanningAgent'
        }), 500

@app.route('/api/analyze-goal', methods=['POST'])
def analyze_goal():
    """Analyze an existing goal for SMART criteria compliance using ADK orchestration"""
    try:
        if not AGENTS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Agents not available'
            }), 503
        
        data = request.get_json()
        goal_data = data.get('goal', {})
        
        if not goal_data:
            return jsonify({'error': 'Goal data is required'}), 400
        
        # Use goal analysis agent with async support
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(goal_analysis_agent.run_async(goal_data))
        finally:
            loop.close()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'agent': 'GoalAnalysisAgent'
        }), 500

@app.route('/api/generate-smart-criteria', methods=['POST'])
def generate_smart_criteria():
    """Generate SMART criteria suggestions for a goal"""
    try:
        if not AGENTS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Agents not available'
            }), 503
        
        data = request.get_json()
        goal_title = data.get('title', '')
        goal_description = data.get('description', '')
        
        if not goal_title:
            return jsonify({'error': 'Goal title is required'}), 400
        
        # Use SMART criteria agent with async support
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(smart_criteria_agent.run_async({
                'title': goal_title,
                'description': goal_description
            }))
        finally:
            loop.close()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'agent': 'SMARTCriteriaAgent'
        }), 500

@app.route('/api/refine-goal', methods=['POST'])
def refine_goal():
    """Refine a goal based on feedback and analysis using ADK orchestration"""
    try:
        if not AGENTS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Agents not available'
            }), 503
        
        data = request.get_json()
        goal_data = data.get('goal', {})
        feedback = data.get('feedback', '')
        
        if not goal_data:
            return jsonify({'error': 'Goal data is required'}), 400
        
        # Use goal planning agent for refinement with async support
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(goal_planning_agent.refine_async(goal_data, feedback))
        finally:
            loop.close()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'agent': 'GoalPlanningAgent'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting ADK Agent Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)