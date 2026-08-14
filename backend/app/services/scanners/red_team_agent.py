import uuid
import datetime
import time
import json
import httpx
from typing import Any, Dict, List
from loguru import logger
from enum import Enum
from app.services.llm_service import LLMService

class AgentState(Enum):
    INITIALIZING = "initializing"
    RECONNAISSANCE = "reconnaissance"
    PAYLOAD_GENERATION = "payload_generation"
    EXECUTION = "execution"
    EVALUATION = "evaluation"
    COMPLETED = "completed"

class AutonomousRedTeamAgent:
    """
    Real LLM-driven Autonomous Red Team Agent.
    Generates payloads via OpenRouter, executes them against the target via httpx,
    and evaluates the real responses.
    """
    
    @staticmethod
    def _generate_payloads(target: str, llm_service: LLMService) -> List[Dict]:
        prompt = f"""
        You are an elite offensive cybersecurity AI.
        Generate exactly 3 diverse HTTP attack payloads to test the endpoint: {target}.
        Include techniques like SQL Injection, XSS, or Command Injection.
        Return ONLY a raw JSON array of objects. Do not include markdown formatting like ```json.
        Each object must have these exactly keys:
        - "type": (e.g. "sql_injection")
        - "technique": (e.g. "time_based_blind")
        - "method": ("GET" or "POST")
        - "path_suffix": (e.g. "?id=1' OR 1=1--")
        - "body": (if POST, else null)
        """
        
        try:
            response = llm_service.generate_chat_response(
                messages=[{"role": "user", "content": prompt}],
                persona_override="You are a strict JSON API. Output only valid JSON.",
                use_fast_model=True
            )
            
            # Clean up potential markdown formatting if the LLM disobeyed
            if "```" in response:
                response = response.split("```json")[-1].split("```")[0].strip()
            if not response.startswith("["):
                response = response[response.find("["):]
            if not response.endswith("]"):
                response = response[:response.rfind("]")+1]
                
            payloads = json.loads(response)
            if isinstance(payloads, list) and len(payloads) > 0:
                return payloads
        except Exception as e:
            logger.error(f"Failed to generate payloads via LLM: {e}")
        
        # Fallback if LLM fails
        return [
            {"type": "sql_injection", "technique": "auth_bypass", "method": "GET", "path_suffix": "?id=1' OR '1'='1", "body": None}
        ]

    @staticmethod
    def _evaluate_response(payload: Dict, http_status: int, response_body: str, llm_service: LLMService) -> bool:
        prompt = f"""
        You are an elite offensive cybersecurity AI evaluator.
        We sent a {payload['type']} attack ({payload['technique']}) using method {payload['method']} to a target.
        The HTTP status code returned was {http_status}.
        The response body was:
        ---
        {response_body[:1000]}
        ---
        Did the attack successfully bypass security or execute the payload? 
        Answer ONLY with "YES" or "NO".
        """
        try:
            eval_resp = llm_service.generate_chat_response(
                messages=[{"role": "user", "content": prompt}],
                use_fast_model=True
            ).strip().upper()
            return "YES" in eval_resp
        except:
            # Fallback heuristic
            if http_status >= 500:
                return True
            if "syntax error" in response_body.lower() or "root:" in response_body.lower():
                return True
            return False

    @staticmethod
    def run_simulation(target_endpoint: str) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        logger.info(f"[{session_id}] Starting Real LLM Red Team Agent against {target_endpoint}")
        
        llm = LLMService()
        state = AgentState.INITIALIZING
        findings = []
        execution_log = []
        
        # 1. Reconnaissance
        state = AgentState.RECONNAISSANCE
        execution_log.append(f"{datetime.datetime.now().isoformat()} - Entered state: {state.value}")
        
        # 2. Payload Generation
        state = AgentState.PAYLOAD_GENERATION
        execution_log.append(f"{datetime.datetime.now().isoformat()} - Entered state: {state.value}")
        payloads = AutonomousRedTeamAgent._generate_payloads(target_endpoint, llm)
        
        # Normalize target endpoint
        if not target_endpoint.startswith("http"):
            target_endpoint = "http://" + target_endpoint
            
        # 3 & 4. Execution and Evaluation (Iterative)
        with httpx.Client(timeout=5.0, verify=False) as client:
            for payload in payloads:
                state = AgentState.EXECUTION
                execution_log.append(f"{datetime.datetime.now().isoformat()} - Executing payload: {payload.get('technique', 'unknown')}")
                
                target_url = target_endpoint + payload.get("path_suffix", "")
                method = payload.get("method", "GET").upper()
                body = payload.get("body")
                
                http_status = 0
                response_body = ""
                
                try:
                    if method == "POST":
                        res = client.post(target_url, json=body)
                    else:
                        res = client.get(target_url)
                    http_status = res.status_code
                    response_body = res.text
                except Exception as e:
                    http_status = 0
                    response_body = f"Connection failed: {e}"
                
                state = AgentState.EVALUATION
                is_successful = AutonomousRedTeamAgent._evaluate_response(payload, http_status, response_body, llm)
                
                if is_successful:
                    findings.append({
                        "finding_type": payload.get("type", "unknown"),
                        "technique": payload.get("technique", "unknown"),
                        "severity": "high",
                        "payload_used": f"{method} {target_url}",
                        "simulated_response": response_body[:200],
                        "message": f"Successfully executed {payload.get('technique')} against {target_url}",
                    })
        
        state = AgentState.COMPLETED
        execution_log.append(f"{datetime.datetime.now().isoformat()} - Entered state: {state.value}")
                
        return {
            "session_id": session_id,
            "target": target_endpoint,
            "status": state.value,
            "findings_count": len(findings),
            "findings": findings,
            "execution_log": execution_log,
            "cvss_max": 9.8 if any(f["severity"] == "critical" for f in findings) else (7.5 if findings else 0.0)
        }
