import os
from typing import List, Dict, Any, Optional
from loguru import logger
from groq import Groq
from app.core.config import get_settings

settings = get_settings()

class LLMService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.default_model = "llama-3.3-70b-versatile"
        self.fast_model = "llama-3.1-8b-instant"
        
        self.system_prompt = (
            "You are SentinelNexus, an elite, highly advanced autonomous CyberSecurity AI. "
            "You operate as a Red Team orchestrator, Blue Team defender, and Compliance Copilot. "
            "Your tone is highly professional, precise, authoritative, and futuristic. "
            "You never break character. Provide actionable, technical, and strategic cybersecurity guidance."
        )

    def generate_chat_response(
        self, 
        messages: List[Dict[str, str]], 
        persona_override: Optional[str] = None, 
        use_fast_model: bool = False
    ) -> str:
        """
        Generates a chat response using Groq.
        messages: List of dicts like [{"role": "user", "content": "..."}]
        """
        model = self.fast_model if use_fast_model else self.default_model
        
        system_content = persona_override if persona_override else self.system_prompt
        full_messages = [{"role": "system", "content": system_content}] + messages
        
        try:
            logger.info(f"Generating LLM response using {model}")
            chat_completion = self.client.chat.completions.create(
                messages=full_messages,
                model=model,
                temperature=0.2, # Low temperature for more precise, technical answers
                max_tokens=2048,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return f"Error: Communication with the SentinelNexus AI Core failed. Reason: {str(e)}"
