"""
AI Service - OpenAI Integration for Question Generation and Answer Evaluation
"""
from typing import List, Dict, Any, Optional
import json
import openai
from app.utils.config import settings


class AIService:
    """Service class for AI-powered features using OpenAI"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.model = settings.OPENAI_MODEL
    
    def generate_questions(
        self,
        interview_type: str,
        difficulty: str,
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generate interview questions using AI.
        
        Args:
            interview_type: Type of interview (hr, python, web_development, cloud_computing)
            difficulty: Difficulty level (beginner, intermediate, advanced)
            count: Number of questions to generate
            
        Returns:
            List of question dictionaries
        """
        # If no API key, return sample questions
        if not self.client:
            return self._get_sample_questions(interview_type, difficulty, count)
        
        prompt = self._build_question_generation_prompt(interview_type, difficulty, count)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert interviewer. Generate interview questions in JSON format."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            questions = json.loads(content)
            return questions
            
        except Exception as e:
            print(f"AI Question Generation Error: {e}")
            return self._get_sample_questions(interview_type, difficulty, count)
    
    def evaluate_answer(
        self,
        question: str,
        answer: str,
        interview_type: str,
        expected_keywords: Optional[str] = None,
        ideal_answer: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate an answer using AI.
        
        Args:
            question: The interview question
            answer: User's answer
            interview_type: Type of interview
            expected_keywords: Expected keywords in the answer
            ideal_answer: Ideal answer for reference
            
        Returns:
            Evaluation dictionary with score, feedback, strengths, weaknesses, suggestions
        """
        if not self.client:
            return self._get_sample_evaluation(answer)
        
        prompt = self._build_evaluation_prompt(
            question, answer, interview_type, expected_keywords, ideal_answer
        )
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert interview evaluator. Evaluate the candidate's answer 
                        and provide detailed feedback in JSON format with the following structure:
                        {
                            "score": <float 0-10>,
                            "feedback": "<detailed feedback>",
                            "strengths": ["strength1", "strength2"],
                            "weaknesses": ["weakness1", "weakness2"],
                            "suggestions": ["suggestion1", "suggestion2"],
                            "keywords_matched": ["keyword1", "keyword2"],
                            "confidence_score": <float 0-1>
                        }"""
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            evaluation = json.loads(content)
            return evaluation
            
        except Exception as e:
            print(f"AI Evaluation Error: {e}")
            return self._get_sample_evaluation(answer)
    
    def generate_overall_feedback(
        self,
        interview_type: str,
        questions_and_answers: List[Dict[str, Any]],
        average_score: float
    ) -> Dict[str, Any]:
        """
        Generate overall interview feedback.
        
        Args:
            interview_type: Type of interview
            questions_and_answers: List of Q&A pairs with scores
            average_score: Average score across all questions
            
        Returns:
            Overall feedback dictionary
        """
        if not self.client:
            return self._get_sample_overall_feedback(average_score)
        
        prompt = f"""
        Analyze this {interview_type} interview performance and provide comprehensive feedback.
        
        Questions and Answers:
        {json.dumps(questions_and_answers, indent=2)}
        
        Average Score: {average_score}/10
        
        Provide feedback in JSON format:
        {{
            "summary": "<overall performance summary>",
            "technical_score": <float 0-10>,
            "communication_score": <float 0-10>,
            "problem_solving_score": <float 0-10>,
            "strengths": ["strength1", "strength2", "strength3"],
            "weaknesses": ["weakness1", "weakness2"],
            "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
            "resources": ["resource1", "resource2"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert interview coach providing comprehensive feedback."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            feedback = json.loads(content)
            return feedback
            
        except Exception as e:
            print(f"AI Overall Feedback Error: {e}")
            return self._get_sample_overall_feedback(average_score)
    
    def _build_question_generation_prompt(
        self,
        interview_type: str,
        difficulty: str,
        count: int
    ) -> str:
        """Build prompt for question generation"""
        type_descriptions = {
            "hr": "behavioral and situational HR interview",
            "python": "Python programming and software development",
            "web_development": "web development including HTML, CSS, JavaScript, React, and backend",
            "cloud_computing": "cloud computing, AWS, DevOps, and infrastructure"
        }
        
        return f"""
        Generate {count} {difficulty} level {type_descriptions.get(interview_type, interview_type)} questions.
        
        Return as JSON array:
        [
            {{
                "question": "<question text>",
                "type": "open_ended",
                "keywords": "<comma-separated expected keywords>",
                "ideal_answer": "<brief ideal answer outline>"
            }}
        ]
        
        Make questions realistic and challenging for the {difficulty} level.
        """
    
    def _build_evaluation_prompt(
        self,
        question: str,
        answer: str,
        interview_type: str,
        expected_keywords: Optional[str],
        ideal_answer: Optional[str]
    ) -> str:
        """Build prompt for answer evaluation"""
        prompt = f"""
        Interview Type: {interview_type}
        
        Question: {question}
        
        Candidate's Answer: {answer}
        """
        
        if expected_keywords:
            prompt += f"\nExpected Keywords: {expected_keywords}"
        
        if ideal_answer:
            prompt += f"\nIdeal Answer Reference: {ideal_answer}"
        
        prompt += "\n\nEvaluate the answer and provide detailed feedback."
        
        return prompt
    
    def _get_sample_questions(
        self,
        interview_type: str,
        difficulty: str,
        count: int
    ) -> List[Dict[str, Any]]:
        """Return sample questions when AI is not available"""
        questions_db = {
            "hr": [
                {"question": "Tell me about yourself and your professional background.", "type": "open_ended", "keywords": "experience,skills,goals", "ideal_answer": "A concise summary of relevant experience and career objectives"},
                {"question": "Describe a challenging situation at work and how you handled it.", "type": "open_ended", "keywords": "problem,solution,result,teamwork", "ideal_answer": "STAR method response with clear outcome"},
                {"question": "Why do you want to work for our company?", "type": "open_ended", "keywords": "research,values,culture,growth", "ideal_answer": "Company-specific research and alignment with personal goals"},
                {"question": "Where do you see yourself in 5 years?", "type": "open_ended", "keywords": "goals,growth,development", "ideal_answer": "Realistic career progression aligned with the role"},
                {"question": "How do you handle stress and pressure?", "type": "open_ended", "keywords": "coping,strategies,examples", "ideal_answer": "Specific techniques with real examples"},
            ],
            "python": [
                {"question": "Explain the difference between lists and tuples in Python.", "type": "open_ended", "keywords": "mutable,immutable,performance,usage", "ideal_answer": "Lists are mutable, tuples are immutable, with performance and use case differences"},
                {"question": "What are Python decorators and how do they work?", "type": "open_ended", "keywords": "function,wrapper,@syntax,closure", "ideal_answer": "Functions that modify other functions, using @ syntax"},
                {"question": "Explain the GIL (Global Interpreter Lock) in Python.", "type": "open_ended", "keywords": "threading,multiprocessing,CPython", "ideal_answer": "Mutex preventing multiple threads from executing Python bytecode simultaneously"},
                {"question": "What is the difference between deep copy and shallow copy?", "type": "open_ended", "keywords": "reference,nested,copy module", "ideal_answer": "Shallow copy copies references, deep copy creates new objects recursively"},
                {"question": "How does garbage collection work in Python?", "type": "open_ended", "keywords": "reference counting,cyclic,gc module", "ideal_answer": "Reference counting with cyclic garbage collector"},
            ],
            "web_development": [
                {"question": "Explain the difference between REST and GraphQL APIs.", "type": "open_ended", "keywords": "endpoints,queries,flexibility,overfetching", "ideal_answer": "REST has fixed endpoints, GraphQL allows flexible queries"},
                {"question": "What is the Virtual DOM and how does React use it?", "type": "open_ended", "keywords": "performance,reconciliation,diffing", "ideal_answer": "In-memory representation of DOM for efficient updates"},
                {"question": "Explain CSS Flexbox and when you would use it.", "type": "open_ended", "keywords": "layout,alignment,responsive,container", "ideal_answer": "One-dimensional layout system for flexible alignments"},
                {"question": "What are Web Workers and when would you use them?", "type": "open_ended", "keywords": "threading,background,performance", "ideal_answer": "Background scripts for CPU-intensive tasks"},
                {"question": "Explain the concept of CORS and how to handle it.", "type": "open_ended", "keywords": "security,headers,preflight,origin", "ideal_answer": "Browser security mechanism for cross-origin requests"},
            ],
            "cloud_computing": [
                {"question": "Explain the difference between IaaS, PaaS, and SaaS.", "type": "open_ended", "keywords": "infrastructure,platform,software,responsibility", "ideal_answer": "Different levels of cloud service abstraction"},
                {"question": "What is containerization and how does Docker work?", "type": "open_ended", "keywords": "isolation,images,containers,orchestration", "ideal_answer": "Lightweight virtualization using container images"},
                {"question": "Explain the concept of auto-scaling in cloud environments.", "type": "open_ended", "keywords": "horizontal,vertical,metrics,elasticity", "ideal_answer": "Automatic resource adjustment based on demand"},
                {"question": "What is Infrastructure as Code and why is it important?", "type": "open_ended", "keywords": "Terraform,automation,version control", "ideal_answer": "Managing infrastructure through code for consistency"},
                {"question": "Explain the CAP theorem and its implications.", "type": "open_ended", "keywords": "consistency,availability,partition tolerance", "ideal_answer": "Trade-offs between consistency, availability, and partition tolerance"},
            ]
        }
        
        questions = questions_db.get(interview_type, questions_db["hr"])
        return questions[:count]
    
    def _get_sample_evaluation(self, answer: str) -> Dict[str, Any]:
        """Return sample evaluation when AI is not available"""
        word_count = len(answer.split())
        
        # Simple heuristic-based scoring
        base_score = 5.0
        
        if word_count > 50:
            base_score += 1.5
        if word_count > 100:
            base_score += 1.0
        if word_count > 200:
            base_score += 0.5
        
        # Cap at 10
        score = min(base_score, 10.0)
        
        return {
            "score": round(score, 1),
            "feedback": "Your answer demonstrates understanding of the topic. Consider providing more specific examples and technical details to strengthen your response.",
            "strengths": [
                "Clear communication",
                "Structured response",
                "Relevant content"
            ],
            "weaknesses": [
                "Could include more specific examples",
                "Consider adding technical depth"
            ],
            "suggestions": [
                "Use the STAR method for behavioral questions",
                "Include specific metrics or outcomes when possible",
                "Practice explaining complex concepts simply"
            ],
            "keywords_matched": [],
            "confidence_score": 0.75
        }
    
    def _get_sample_overall_feedback(self, average_score: float) -> Dict[str, Any]:
        """Return sample overall feedback when AI is not available"""
        return {
            "summary": f"Overall performance shows {'strong' if average_score >= 7 else 'developing'} understanding of the subject matter. With continued practice, you can further improve your interview skills.",
            "technical_score": average_score,
            "communication_score": average_score + 0.5 if average_score < 9.5 else 10.0,
            "problem_solving_score": average_score - 0.3 if average_score > 0.3 else 0.0,
            "strengths": [
                "Good communication skills",
                "Logical thinking approach",
                "Professional demeanor"
            ],
            "weaknesses": [
                "Could provide more specific examples",
                "Technical depth can be improved"
            ],
            "suggestions": [
                "Practice explaining complex concepts",
                "Prepare specific examples from experience",
                "Study common interview patterns"
            ],
            "resources": [
                "LeetCode for coding practice",
                "System Design Primer on GitHub",
                "Cracking the Coding Interview book"
            ]
        }
