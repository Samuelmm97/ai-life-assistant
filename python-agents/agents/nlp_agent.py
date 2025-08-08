"""
NLP Agent using Google ADK
Specialized agent for natural language processing of goal descriptions
Extracts intent, timeframes, metrics, and constraints from user input
"""
import json
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

# Try to import ADK, fall back to mock classes for testing
try:
    from google_adk import LlmAgent, Tool
except ImportError:
    # Mock classes for testing when ADK is not available
    class Tool:
        def __init__(self, name, description):
            self.name = name
            self.description = description
    
    class LlmAgent:
        def __init__(self, name, description, model, system_prompt, tools):
            self.name = name
            self.description = description
            self.model = model
            self.system_prompt = system_prompt
            self.tools = tools

class IntentExtractionTool(Tool):
    """Tool for extracting structured goal intent from natural language"""
    
    def __init__(self):
        super().__init__(
            name="extract_intent",
            description="Extract structured goal intent from natural language description"
        )
    
    def run(self, description: str) -> Dict[str, Any]:
        """Extract goal intent with confidence scoring"""
        try:
            # Domain classification patterns
            domain_patterns = {
                'fitness': ['workout', 'exercise', 'run', 'gym', 'weight', 'muscle', 'cardio', 'marathon', 'fitness'],
                'learning': ['learn', 'study', 'course', 'skill', 'education', 'training', 'certification', 'language'],
                'career': ['job', 'career', 'promotion', 'salary', 'work', 'professional', 'business', 'interview', 'promoted', 'developer', 'senior'],
                'finance': ['money', 'save', 'budget', 'invest', 'debt', 'financial', 'income', 'expense'],
                'health': ['health', 'doctor', 'medical', 'diet', 'nutrition', 'sleep', 'wellness', 'therapy'],
                'nutrition': ['eat', 'food', 'diet', 'nutrition', 'meal', 'calories', 'protein', 'vegetables'],
                'sleep': ['sleep', 'rest', 'bedtime', 'wake', 'hours', 'insomnia', 'tired'],
                'habits': ['habit', 'routine', 'daily', 'practice', 'consistency', 'discipline'],
                'social': ['friends', 'family', 'relationship', 'social', 'network', 'community'],
                'projects': ['project', 'build', 'create', 'develop', 'complete', 'finish', 'accomplish']
            }
            
            # Extract domain
            domain = self._classify_domain(description.lower(), domain_patterns)
            
            # Extract action verb
            action = self._extract_action(description)
            
            # Extract outcome
            outcome = self._extract_outcome(description)
            
            # Extract context
            context = self._extract_context(description)
            
            # Determine urgency
            urgency = self._determine_urgency(description)
            
            # Calculate confidence
            confidence = self._calculate_confidence(description, domain, action, outcome)
            
            return {
                'domain': domain,
                'action': action,
                'outcome': outcome,
                'context': context,
                'urgency': urgency,
                'confidence': confidence,
                'reasoning': f"Classified as {domain} based on keywords. Action: {action}, Outcome: {outcome}"
            }
            
        except Exception as e:
            return {
                'domain': 'projects',
                'action': 'achieve',
                'outcome': 'goal completion',
                'context': [],
                'urgency': 'medium',
                'confidence': 0.3,
                'reasoning': f"Fallback classification due to error: {str(e)}"
            }
    
    def _classify_domain(self, description: str, patterns: Dict[str, List[str]]) -> str:
        """Classify the goal domain based on keyword patterns"""
        domain_scores = {}
        
        for domain, keywords in patterns.items():
            score = sum(1 for keyword in keywords if keyword in description)
            if score > 0:
                domain_scores[domain] = score
        
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        return 'projects'  # Default domain
    
    def _extract_action(self, description: str) -> str:
        """Extract the primary action verb"""
        action_patterns = [
            r'\b(learn|study|master|understand)\b',
            r'\b(run|exercise|train|workout)\b',
            r'\b(save|earn|invest|budget)\b',
            r'\b(build|create|develop|make)\b',
            r'\b(lose|gain|improve|increase|decrease)\b',
            r'\b(complete|finish|achieve|accomplish)\b',
            r'\b(start|begin|initiate)\b',
            r'\b(read|write|practice)\b'
        ]
        
        for pattern in action_patterns:
            match = re.search(pattern, description.lower())
            if match:
                return match.group(1)
        
        # Fallback: look for any verb-like word
        words = description.split()
        for word in words:
            if word.lower() in ['want', 'need', 'plan', 'hope', 'aim', 'goal']:
                continue
            if len(word) > 3 and word.lower().endswith(('ing', 'ed', 'er')):
                return word.lower()
        
        return 'achieve'
    
    def _extract_outcome(self, description: str) -> str:
        """Extract the desired outcome"""
        # Look for outcome indicators
        outcome_patterns = [
            r'(?:to|want to|need to|plan to|aim to|goal is to)\s+(.+?)(?:\.|$|by|in|within)',
            r'(?:achieve|accomplish|complete|finish|reach)\s+(.+?)(?:\.|$|by|in|within)',
            r'(?:become|get|obtain|gain)\s+(.+?)(?:\.|$|by|in|within)'
        ]
        
        for pattern in outcome_patterns:
            match = re.search(pattern, description.lower())
            if match:
                return match.group(1).strip()
        
        # Fallback: use the main part of the description
        words = description.split()
        if len(words) > 3:
            return ' '.join(words[:min(len(words), 8)])
        return description
    
    def _extract_context(self, description: str) -> List[str]:
        """Extract contextual information"""
        context = []
        
        # Look for motivation indicators
        motivation_patterns = [
            r'(?:because|since|as|for|to help|in order to)\s+(.+?)(?:\.|$)',
            r'(?:so that|so I can|to be able to)\s+(.+?)(?:\.|$)'
        ]
        
        for pattern in motivation_patterns:
            matches = re.findall(pattern, description.lower())
            context.extend(matches)
        
        # Look for constraints or conditions
        constraint_patterns = [
            r'(?:but|however|although|despite|even though)\s+(.+?)(?:\.|$)',
            r'(?:with|using|through|via)\s+(.+?)(?:\.|$)'
        ]
        
        for pattern in constraint_patterns:
            matches = re.findall(pattern, description.lower())
            context.extend(matches)
        
        return [ctx.strip() for ctx in context if ctx.strip()]
    
    def _determine_urgency(self, description: str) -> str:
        """Determine urgency level based on language cues"""
        high_urgency_words = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'deadline', 'must']
        medium_urgency_words = ['soon', 'quickly', 'important', 'priority', 'need to', 'should']
        low_urgency_words = ['eventually', 'someday', 'when possible', 'would like', 'hope to']
        
        description_lower = description.lower()
        
        if any(word in description_lower for word in high_urgency_words):
            return 'high'
        elif any(word in description_lower for word in medium_urgency_words):
            return 'medium'
        elif any(word in description_lower for word in low_urgency_words):
            return 'low'
        
        # Check for time indicators
        if re.search(r'\b(today|tomorrow|this week|next week)\b', description_lower):
            return 'high'
        elif re.search(r'\b(this month|next month|soon)\b', description_lower):
            return 'medium'
        elif re.search(r'\b(this year|next year|someday)\b', description_lower):
            return 'low'
        
        return 'medium'  # Default
    
    def _calculate_confidence(self, description: str, domain: str, action: str, outcome: str) -> float:
        """Calculate confidence score for the extraction"""
        confidence = 0.5  # Base confidence
        
        # Boost confidence based on description length and clarity
        word_count = len(description.split())
        if word_count >= 5:
            confidence += 0.1
        if word_count >= 10:
            confidence += 0.1
        
        # Boost confidence if we found clear action and outcome
        if action != 'achieve':
            confidence += 0.1
        if len(outcome) > 10:
            confidence += 0.1
        
        # Boost confidence if domain classification was strong
        if domain != 'projects':
            confidence += 0.1
        
        # Reduce confidence for very short or vague descriptions
        if word_count < 3:
            confidence -= 0.2
        if any(word in description.lower() for word in ['something', 'stuff', 'things', 'whatever']):
            confidence -= 0.3  # Reduce more for very vague words
        
        return max(0.0, min(1.0, confidence))


class TimeframeParsingTool(Tool):
    """Tool for extracting timeframe information from goal descriptions"""
    
    def __init__(self):
        super().__init__(
            name="extract_timeframe",
            description="Extract timeframe information from goal description"
        )
    
    def run(self, description: str) -> Dict[str, Any]:
        """Extract timeframe with structured output"""
        try:
            # Extract dates and time references
            extracted_phrases = self._extract_time_phrases(description)
            
            # Parse specific dates
            start_date, end_date = self._parse_dates(description, extracted_phrases)
            
            # Extract duration information
            duration = self._extract_duration(description)
            
            # Extract milestones
            milestones = self._extract_milestones(description)
            
            # Determine flexibility
            flexibility = self._determine_flexibility(description)
            
            return {
                'startDate': start_date.isoformat() if start_date else None,
                'endDate': end_date.isoformat() if end_date else None,
                'duration': duration,
                'milestones': milestones,
                'flexibility': flexibility,
                'extractedPhrases': extracted_phrases,
                'confidence': self._calculate_timeframe_confidence(extracted_phrases, start_date, end_date)
            }
            
        except Exception as e:
            return {
                'startDate': None,
                'endDate': None,
                'duration': {'days': 30},  # Default 30 days
                'milestones': [],
                'flexibility': 'flexible',
                'extractedPhrases': [],
                'confidence': 0.2,
                'error': str(e)
            }
    
    def _extract_time_phrases(self, description: str) -> List[str]:
        """Extract time-related phrases from description"""
        time_patterns = [
            r'\b(?:by|before|until|deadline)\s+([^.]+?)(?:\.|$|,)',
            r'\b(?:in|within|over|during)\s+(\d+\s+(?:days?|weeks?|months?|years?))',
            r'\b(?:next|this|coming)\s+(week|month|year|summer|winter|spring|fall)',
            r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}?',
            r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',
            r'\b\d{1,2}-\d{1,2}-\d{2,4}\b',
            r'\b(?:today|tomorrow|yesterday)\b',
            r'\b(?:asap|immediately|soon|eventually)\b'
        ]
        
        phrases = []
        for pattern in time_patterns:
            matches = re.findall(pattern, description.lower())
            phrases.extend(matches)
        
        return [phrase.strip() for phrase in phrases if phrase.strip()]
    
    def _parse_dates(self, description: str, phrases: List[str]) -> tuple:
        """Parse specific start and end dates"""
        start_date = None
        end_date = None
        
        # Look for specific date patterns
        date_patterns = [
            r'\b(\d{1,2}/\d{1,2}/\d{2,4})\b',
            r'\b(\d{1,2}-\d{1,2}-\d{2,4})\b',
            r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?'
        ]
        
        current_year = datetime.now().year
        
        for pattern in date_patterns:
            matches = re.findall(pattern, description.lower())
            for match in matches:
                try:
                    if isinstance(match, tuple) and len(match) == 3:
                        # Month name format
                        month_name, day, year = match
                        month_num = self._month_name_to_number(month_name)
                        year = int(year) if year else current_year
                        end_date = datetime(year, month_num, int(day))
                    else:
                        # Numeric format
                        date_str = match if isinstance(match, str) else match[0]
                        if '/' in date_str:
                            parts = date_str.split('/')
                        else:
                            parts = date_str.split('-')
                        
                        if len(parts) == 3:
                            month, day, year = parts
                            year = int(year)
                            if year < 100:
                                year += 2000 if year < 50 else 1900
                            end_date = datetime(year, int(month), int(day))
                except (ValueError, IndexError):
                    continue
        
        # Look for relative dates
        if not end_date:
            end_date = self._parse_relative_dates(description)
        
        # Set start date to today if not specified
        if end_date and not start_date:
            start_date = datetime.now()
        
        return start_date, end_date
    
    def _extract_duration(self, description: str) -> Dict[str, int]:
        """Extract duration information"""
        duration = {}
        
        # Look for duration patterns
        duration_patterns = [
            (r'(\d+)\s*hours?', 'hours'),
            (r'(\d+)\s*days?', 'days'),
            (r'(\d+)\s*weeks?', 'weeks'),
            (r'(\d+)\s*months?', 'months'),
            (r'(\d+)\s*years?', 'years')
        ]
        
        for pattern, unit in duration_patterns:
            matches = re.findall(pattern, description.lower())
            if matches:
                duration[unit] = int(matches[0])
        
        # Convert everything to days for consistency
        if duration:
            total_days = 0
            total_days += duration.get('days', 0)
            total_days += duration.get('weeks', 0) * 7
            total_days += duration.get('months', 0) * 30
            total_days += duration.get('years', 0) * 365
            total_days += duration.get('hours', 0) / 24
            
            return {'days': int(total_days)} if total_days > 0 else {}
        
        return {}
    
    def _extract_milestones(self, description: str) -> List[str]:
        """Extract milestone information"""
        milestone_patterns = [
            r'(?:milestone|checkpoint|phase|step)\s*\d*:?\s*([^.]+?)(?:\.|$|,)',
            r'(?:first|second|third|then|next|finally)\s+([^.]+?)(?:\.|$|,)',
            r'(?:by\s+\w+\s+\d+|in\s+\d+\s+\w+)\s+([^.]+?)(?:\.|$|,)'
        ]
        
        milestones = []
        for pattern in milestone_patterns:
            matches = re.findall(pattern, description.lower())
            milestones.extend([m.strip() for m in matches if m.strip()])
        
        return milestones[:5]  # Limit to 5 milestones
    
    def _determine_flexibility(self, description: str) -> str:
        """Determine timeline flexibility"""
        fixed_indicators = ['deadline', 'must', 'required', 'due', 'exactly', 'precisely']
        flexible_indicators = ['around', 'approximately', 'roughly', 'about', 'flexible', 'when possible']
        very_flexible_indicators = ['eventually', 'someday', 'whenever', 'no rush', 'no hurry']
        
        description_lower = description.lower()
        
        if any(word in description_lower for word in very_flexible_indicators):
            return 'very_flexible'
        elif any(word in description_lower for word in flexible_indicators):
            return 'flexible'
        elif any(word in description_lower for word in fixed_indicators):
            return 'fixed'
        
        return 'flexible'  # Default
    
    def _parse_relative_dates(self, description: str) -> Optional[datetime]:
        """Parse relative date expressions"""
        now = datetime.now()
        
        relative_patterns = {
            r'\btoday\b': now,
            r'\btomorrow\b': now + timedelta(days=1),
            r'\bnext week\b': now + timedelta(weeks=1),
            r'\bthis week\b': now + timedelta(days=7-now.weekday()),
            r'\bnext month\b': now + timedelta(days=30),
            r'\bthis month\b': now.replace(day=28),  # End of month approximation
            r'\bnext year\b': now.replace(year=now.year+1),
            r'\bthis year\b': now.replace(month=12, day=31)
        }
        
        for pattern, date_value in relative_patterns.items():
            if re.search(pattern, description.lower()):
                return date_value
        
        # Look for "in X days/weeks/months" patterns
        in_patterns = [
            (r'\bin\s+(\d+)\s+days?\b', lambda x: now + timedelta(days=int(x))),
            (r'\bin\s+(\d+)\s+weeks?\b', lambda x: now + timedelta(weeks=int(x))),
            (r'\bin\s+(\d+)\s+months?\b', lambda x: now + timedelta(days=int(x)*30))
        ]
        
        for pattern, date_func in in_patterns:
            match = re.search(pattern, description.lower())
            if match:
                return date_func(match.group(1))
        
        return None
    
    def _month_name_to_number(self, month_name: str) -> int:
        """Convert month name to number"""
        months = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12
        }
        return months.get(month_name.lower(), 1)
    
    def _calculate_timeframe_confidence(self, phrases: List[str], start_date: Optional[datetime], end_date: Optional[datetime]) -> float:
        """Calculate confidence in timeframe extraction"""
        confidence = 0.3  # Base confidence
        
        if phrases:
            confidence += 0.2
        if len(phrases) > 1:
            confidence += 0.1
        if start_date:
            confidence += 0.2
        if end_date:
            confidence += 0.2
        
        return min(1.0, confidence)


class MetricsIdentificationTool(Tool):
    """Tool for identifying measurable metrics from goal descriptions"""
    
    def __init__(self):
        super().__init__(
            name="identify_metrics",
            description="Identify measurable metrics from goal description"
        )
    
    def run(self, description: str) -> Dict[str, Any]:
        """Identify metrics with confidence scoring"""
        try:
            metrics = []
            
            # Extract numeric values and their contexts
            numeric_patterns = [
                (r'(\d+(?:\.\d+)?)\s*(pounds?|lbs?|kg|kilograms?)', 'weight', 'lbs'),
                (r'(\d+(?:\.\d+)?)\s*(miles?|km|kilometers?)', 'distance', 'miles'),
                (r'(\d+(?:\.\d+)?)\s*(hours?|hrs?)', 'time', 'hours'),
                (r'(\d+(?:\.\d+)?)\s*(minutes?|mins?)', 'time', 'minutes'),
                (r'(\d+(?:\.\d+)?)\s*(dollars?|\$|USD)', 'money', 'dollars'),
                (r'(\d+(?:\.\d+)?)\s*(?:%|percent)', 'percentage', 'percent'),
                (r'(\d+(?:\.\d+)?)\s*(times?|reps?|repetitions?)', 'count', 'times'),
                (r'(\d+(?:\.\d+)?)\s*(pages?|chapters?|books?)', 'reading', 'pages'),
                (r'(\d+(?:\.\d+)?)\s*(words?|characters?)', 'writing', 'words')
            ]
            
            for pattern, metric_type, unit in numeric_patterns:
                matches = re.findall(pattern, description.lower())
                for match in matches:
                    value = float(match[0])
                    unit_found = match[1] if len(match) > 1 else unit
                    
                    metrics.append({
                        'name': f"{metric_type}_target",
                        'unit': unit_found,
                        'targetValue': value,
                        'currentValue': 0,
                        'confidence': 'high',
                        'reasoning': f"Found explicit numeric value: {value} {unit_found}"
                    })
            
            # Look for implicit metrics based on goal type
            implicit_metrics = self._identify_implicit_metrics(description)
            metrics.extend(implicit_metrics)
            
            # If no metrics found, suggest generic ones
            if not metrics:
                metrics = self._suggest_default_metrics(description)
            
            return {
                'metrics': metrics[:5],  # Limit to 5 metrics
                'confidence': self._calculate_metrics_confidence(metrics),
                'reasoning': f"Identified {len(metrics)} measurable metrics from the description"
            }
            
        except Exception as e:
            return {
                'metrics': [{
                    'name': 'completion_status',
                    'unit': 'percent',
                    'targetValue': 100,
                    'currentValue': 0,
                    'confidence': 'low',
                    'reasoning': f"Fallback metric due to error: {str(e)}"
                }],
                'confidence': 0.2,
                'reasoning': "Used fallback metrics due to processing error"
            }
    
    def _identify_implicit_metrics(self, description: str) -> List[Dict[str, Any]]:
        """Identify implicit metrics based on goal context"""
        metrics = []
        description_lower = description.lower()
        
        # Fitness-related implicit metrics
        if any(word in description_lower for word in ['workout', 'exercise', 'fitness', 'gym', 'working', 'shape']):
            metrics.append({
                'name': 'workout_sessions',
                'unit': 'sessions',
                'targetValue': 12,  # 3 times per week for a month
                'currentValue': 0,
                'confidence': 'medium',
                'reasoning': 'Fitness goal typically measured by workout frequency'
            })
        
        # Learning-related implicit metrics
        if any(word in description_lower for word in ['learn', 'study', 'course', 'skill']):
            metrics.append({
                'name': 'study_hours',
                'unit': 'hours',
                'targetValue': 20,
                'currentValue': 0,
                'confidence': 'medium',
                'reasoning': 'Learning goals typically measured by time invested'
            })
        
        # Reading-related implicit metrics
        if any(word in description_lower for word in ['read', 'book', 'chapter']):
            metrics.append({
                'name': 'books_read',
                'unit': 'books',
                'targetValue': 1,
                'currentValue': 0,
                'confidence': 'medium',
                'reasoning': 'Reading goals typically measured by books completed'
            })
        
        # Habit-related implicit metrics
        if any(word in description_lower for word in ['daily', 'habit', 'routine', 'every day']):
            metrics.append({
                'name': 'consecutive_days',
                'unit': 'days',
                'targetValue': 30,
                'currentValue': 0,
                'confidence': 'medium',
                'reasoning': 'Habit goals typically measured by consistency'
            })
        
        # Project-related implicit metrics
        if any(word in description_lower for word in ['project', 'build', 'create', 'complete']):
            metrics.append({
                'name': 'completion_percentage',
                'unit': 'percent',
                'targetValue': 100,
                'currentValue': 0,
                'confidence': 'medium',
                'reasoning': 'Project goals typically measured by completion percentage'
            })
        
        return metrics
    
    def _suggest_default_metrics(self, description: str) -> List[Dict[str, Any]]:
        """Suggest default metrics when none are found"""
        return [{
            'name': 'progress_score',
            'unit': 'points',
            'targetValue': 100,
            'currentValue': 0,
            'confidence': 'low',
            'reasoning': 'Generic progress metric for goals without explicit measurements'
        }]
    
    def _calculate_metrics_confidence(self, metrics: List[Dict[str, Any]]) -> float:
        """Calculate overall confidence in metrics identification"""
        if not metrics:
            return 0.0
        
        confidence_scores = {
            'high': 0.9,
            'medium': 0.6,
            'low': 0.3
        }
        
        total_confidence = sum(confidence_scores.get(metric['confidence'], 0.3) for metric in metrics)
        return min(1.0, total_confidence / len(metrics))


class ConstraintExtractionTool(Tool):
    """Tool for extracting constraints and limitations from goal descriptions"""
    
    def __init__(self):
        super().__init__(
            name="extract_constraints",
            description="Extract constraints and limitations from goal description"
        )
    
    def run(self, description: str) -> Dict[str, Any]:
        """Extract constraints with categorization"""
        try:
            constraints = {
                'time_constraints': self._extract_time_constraints(description),
                'resource_constraints': self._extract_resource_constraints(description),
                'skill_constraints': self._extract_skill_constraints(description),
                'external_constraints': self._extract_external_constraints(description),
                'personal_constraints': self._extract_personal_constraints(description)
            }
            
            # Flatten and prioritize constraints
            all_constraints = []
            for category, constraint_list in constraints.items():
                for constraint in constraint_list:
                    all_constraints.append({
                        'constraint': constraint,
                        'category': category,
                        'severity': self._assess_constraint_severity(constraint, description)
                    })
            
            return {
                'constraints': all_constraints,
                'categories': constraints,
                'total_count': len(all_constraints),
                'confidence': self._calculate_constraint_confidence(all_constraints),
                'reasoning': f"Identified {len(all_constraints)} constraints across {len([c for c in constraints.values() if c])} categories"
            }
            
        except Exception as e:
            return {
                'constraints': [],
                'categories': {},
                'total_count': 0,
                'confidence': 0.2,
                'reasoning': f"Error extracting constraints: {str(e)}"
            }
    
    def _extract_time_constraints(self, description: str) -> List[str]:
        """Extract time-related constraints"""
        time_constraint_patterns = [
            r'(?:only|just)\s+(\d+\s+(?:hours?|minutes?|days?)\s+(?:per|each|a)\s+\w+)',
            r'(?:limited|restricted)\s+(?:to|by)\s+([^.]+time[^.]*)',
            r'(?:busy|occupied|unavailable)\s+([^.]+)',
            r'(?:deadline|due)\s+([^.]+)',
            r'(\d+\s+hours?\s+per\s+\w+)'  # More specific pattern for "X hours per week"
        ]
        
        constraints = []
        for pattern in time_constraint_patterns:
            matches = re.findall(pattern, description.lower())
            constraints.extend([match.strip() for match in matches if match.strip()])
        
        return constraints
    
    def _extract_resource_constraints(self, description: str) -> List[str]:
        """Extract resource-related constraints"""
        resource_constraint_patterns = [
            r'(?:budget|money|cost)\s+(?:of|is|limited to)\s+([^.]+)',
            r'(?:no|without|lack of|limited)\s+(money|budget|funds|equipment|tools|resources)',
            r'(?:can\'t afford|too expensive|costly)\s+([^.]+)',
            r'(?:need|require|must have)\s+(equipment|tools|resources|materials)\s+([^.]+)'
        ]
        
        constraints = []
        for pattern in resource_constraint_patterns:
            matches = re.findall(pattern, description.lower())
            if isinstance(matches[0], tuple) if matches else False:
                constraints.extend([' '.join(match) for match in matches])
            else:
                constraints.extend([match.strip() for match in matches if match.strip()])
        
        return constraints
    
    def _extract_skill_constraints(self, description: str) -> List[str]:
        """Extract skill-related constraints"""
        skill_constraint_patterns = [
            r'(?:don\'t know|never|no experience|beginner|new to)\s+([^.]+)',
            r'(?:need to learn|must learn|have to study)\s+([^.]+)',
            r'(?:lack|missing|without)\s+(skills?|knowledge|experience)\s+([^.]*)',
            r'(?:difficult|hard|challenging)\s+(?:because|since)\s+([^.]+)'
        ]
        
        constraints = []
        for pattern in skill_constraint_patterns:
            matches = re.findall(pattern, description.lower())
            if matches and isinstance(matches[0], tuple):
                constraints.extend([' '.join(match) for match in matches])
            else:
                constraints.extend([match.strip() for match in matches if match.strip()])
        
        return constraints
    
    def _extract_external_constraints(self, description: str) -> List[str]:
        """Extract external constraints"""
        external_constraint_patterns = [
            r'(?:depends on|waiting for|need approval from)\s+([^.]+)',
            r'(?:weather|season|location)\s+(?:dependent|specific|limited)\s+([^.]*)',
            r'(?:others|family|work|job)\s+(?:prevents?|limits?|restricts?)\s+([^.]*)',
            r'(?:availability|schedule|calendar)\s+(?:conflicts?|issues?)\s+([^.]*)'
        ]
        
        constraints = []
        for pattern in external_constraint_patterns:
            matches = re.findall(pattern, description.lower())
            constraints.extend([match.strip() for match in matches if match.strip()])
        
        return constraints
    
    def _extract_personal_constraints(self, description: str) -> List[str]:
        """Extract personal constraints"""
        personal_constraint_patterns = [
            r'(?:afraid|scared|worried|anxious)\s+(?:of|about|that)\s+([^.]+)',
            r'(?:health|medical|physical)\s+(?:issues?|problems?|limitations?)\s+([^.]*)',
            r'(?:motivation|discipline|willpower)\s+(?:issues?|problems?|lack)\s+([^.]*)',
            r'(?:procrastination|lazy|unmotivated)\s+([^.]*)'
        ]
        
        constraints = []
        for pattern in personal_constraint_patterns:
            matches = re.findall(pattern, description.lower())
            constraints.extend([match.strip() for match in matches if match.strip()])
        
        return constraints
    
    def _assess_constraint_severity(self, constraint: str, description: str) -> str:
        """Assess the severity of a constraint"""
        high_severity_words = ['impossible', 'never', 'can\'t', 'unable', 'critical', 'major']
        medium_severity_words = ['difficult', 'challenging', 'limited', 'restricted', 'problem']
        
        constraint_lower = constraint.lower()
        
        if any(word in constraint_lower for word in high_severity_words):
            return 'high'
        elif any(word in constraint_lower for word in medium_severity_words):
            return 'medium'
        else:
            return 'low'
    
    def _calculate_constraint_confidence(self, constraints: List[Dict[str, Any]]) -> float:
        """Calculate confidence in constraint extraction"""
        if not constraints:
            return 0.3  # Low confidence when no constraints found
        
        # Higher confidence with more constraints found
        base_confidence = 0.5
        constraint_bonus = min(0.4, len(constraints) * 0.1)
        
        return min(1.0, base_confidence + constraint_bonus)


class NLPAgent(LlmAgent):
    """
    Specialized NLP Agent for goal planning using Google ADK
    Processes natural language goal descriptions and extracts structured information
    """
    
    def __init__(self, model_name: str = 'gemini-2.5-pro'):
        # Initialize tools
        self.intent_tool = IntentExtractionTool()
        self.timeframe_tool = TimeframeParsingTool()
        self.metrics_tool = MetricsIdentificationTool()
        self.constraints_tool = ConstraintExtractionTool()
        
        # System prompt for goal analysis
        system_prompt = """You are a specialized NLP agent for goal planning and analysis.

Your role is to analyze natural language goal descriptions and extract structured information including:
1. Goal intent and domain classification
2. Timeframe and deadline information
3. Measurable metrics and success criteria
4. Constraints and limitations

Always use the provided tools to structure your analysis and provide confidence scores for all outputs.
Be thorough but concise in your reasoning.
Focus on extracting actionable, specific information that can be used for SMART goal creation.

When analyzing goals:
- Look for explicit and implicit information
- Consider context and nuance in language
- Provide realistic confidence scores
- Explain your reasoning clearly
- Handle ambiguous or incomplete descriptions gracefully
"""
        
        super().__init__(
            name='nlp-agent',
            description='Specialized agent for natural language processing of goal descriptions',
            model=model_name,
            system_prompt=system_prompt,
            tools=[
                self.intent_tool,
                self.timeframe_tool,
                self.metrics_tool,
                self.constraints_tool
            ]
        )
    
    def process_goal_description(self, description: str) -> Dict[str, Any]:
        """
        Process a goal description and return comprehensive NLP analysis
        
        Args:
            description: Natural language goal description
            
        Returns:
            Dictionary containing structured analysis results
        """
        try:
            # Use tools to extract information
            intent_analysis = self.intent_tool.run(description)
            timeframe_analysis = self.timeframe_tool.run(description)
            metrics_analysis = self.metrics_tool.run(description)
            constraints_analysis = self.constraints_tool.run(description)
            
            # Combine results
            analysis = {
                'original_description': description,
                'intent': intent_analysis,
                'timeframe': timeframe_analysis,
                'metrics': metrics_analysis,
                'constraints': constraints_analysis,
                'overall_confidence': self._calculate_overall_confidence(
                    intent_analysis, timeframe_analysis, metrics_analysis, constraints_analysis
                ),
                'processing_timestamp': datetime.now().isoformat(),
                'agent_version': '1.0.0'
            }
            
            # Add summary and recommendations
            analysis['summary'] = self._generate_analysis_summary(analysis)
            analysis['recommendations'] = self._generate_recommendations(analysis)
            
            return analysis
            
        except Exception as e:
            return self._create_fallback_analysis(description, str(e))
    
    def extract_intent_only(self, description: str) -> Dict[str, Any]:
        """Extract only intent information for quick processing"""
        return self.intent_tool.run(description)
    
    def extract_timeframe_only(self, description: str) -> Dict[str, Any]:
        """Extract only timeframe information"""
        return self.timeframe_tool.run(description)
    
    def extract_metrics_only(self, description: str) -> Dict[str, Any]:
        """Extract only metrics information"""
        return self.metrics_tool.run(description)
    
    def extract_constraints_only(self, description: str) -> Dict[str, Any]:
        """Extract only constraints information"""
        return self.constraints_tool.run(description)
    
    def _calculate_overall_confidence(self, intent: Dict, timeframe: Dict, 
                                    metrics: Dict, constraints: Dict) -> float:
        """Calculate overall confidence score across all analyses"""
        confidences = [
            intent.get('confidence', 0.5),
            timeframe.get('confidence', 0.5),
            metrics.get('confidence', 0.5),
            constraints.get('confidence', 0.5)
        ]
        
        return sum(confidences) / len(confidences)
    
    def _generate_analysis_summary(self, analysis: Dict[str, Any]) -> str:
        """Generate a human-readable summary of the analysis"""
        intent = analysis['intent']
        timeframe = analysis['timeframe']
        metrics = analysis['metrics']
        
        summary_parts = []
        
        # Intent summary
        summary_parts.append(f"Goal classified as {intent['domain']} domain with action '{intent['action']}'")
        
        # Timeframe summary
        if timeframe.get('endDate'):
            summary_parts.append(f"Target completion by {timeframe['endDate']}")
        elif timeframe.get('duration'):
            duration = timeframe['duration']
            if 'days' in duration:
                summary_parts.append(f"Estimated duration: {duration['days']} days")
        
        # Metrics summary
        metric_count = len(metrics.get('metrics', []))
        if metric_count > 0:
            summary_parts.append(f"Identified {metric_count} measurable metrics")
        
        # Confidence summary
        confidence = analysis['overall_confidence']
        confidence_level = 'high' if confidence > 0.7 else 'medium' if confidence > 0.4 else 'low'
        summary_parts.append(f"Overall analysis confidence: {confidence_level}")
        
        return '. '.join(summary_parts) + '.'
    
    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on analysis results"""
        recommendations = []
        
        # Check confidence levels and suggest improvements
        intent_confidence = analysis['intent'].get('confidence', 0.5)
        if intent_confidence < 0.6:
            recommendations.append("Consider providing more specific details about what you want to achieve")
        
        timeframe_confidence = analysis['timeframe'].get('confidence', 0.5)
        if timeframe_confidence < 0.6:
            recommendations.append("Add specific deadlines or timeframes to make the goal more time-bound")
        
        metrics_confidence = analysis['metrics'].get('confidence', 0.5)
        if metrics_confidence < 0.6:
            recommendations.append("Include measurable outcomes or success criteria")
        
        # Check for constraints
        constraint_count = analysis['constraints'].get('total_count', 0)
        if constraint_count == 0:
            recommendations.append("Consider potential obstacles or constraints that might affect your goal")
        
        # Domain-specific recommendations
        domain = analysis['intent'].get('domain', '')
        if domain == 'fitness':
            recommendations.append("Consider tracking specific metrics like workout frequency or performance improvements")
        elif domain == 'learning':
            recommendations.append("Break down the learning goal into specific skills or knowledge areas")
        elif domain == 'career':
            recommendations.append("Define specific career milestones or skill developments")
        
        return recommendations[:5]  # Limit to 5 recommendations
    
    def _create_fallback_analysis(self, description: str, error: str) -> Dict[str, Any]:
        """Create fallback analysis when processing fails"""
        return {
            'original_description': description,
            'intent': {
                'domain': 'projects',
                'action': 'achieve',
                'outcome': 'goal completion',
                'context': [],
                'urgency': 'medium',
                'confidence': 0.2,
                'reasoning': f"Fallback analysis due to error: {error}"
            },
            'timeframe': {
                'startDate': None,
                'endDate': None,
                'duration': {'days': 30},
                'milestones': [],
                'flexibility': 'flexible',
                'extractedPhrases': [],
                'confidence': 0.2
            },
            'metrics': {
                'metrics': [{
                    'name': 'completion_status',
                    'unit': 'percent',
                    'targetValue': 100,
                    'currentValue': 0,
                    'confidence': 'low',
                    'reasoning': 'Fallback metric'
                }],
                'confidence': 0.2,
                'reasoning': 'Fallback metrics due to processing error'
            },
            'constraints': {
                'constraints': [],
                'categories': {},
                'total_count': 0,
                'confidence': 0.2,
                'reasoning': 'No constraints identified due to processing error'
            },
            'overall_confidence': 0.2,
            'processing_timestamp': datetime.now().isoformat(),
            'agent_version': '1.0.0',
            'error': error,
            'summary': 'Analysis failed due to technical error. Manual review recommended.',
            'recommendations': ['Retry analysis with simplified description', 'Consider manual goal creation']
        }