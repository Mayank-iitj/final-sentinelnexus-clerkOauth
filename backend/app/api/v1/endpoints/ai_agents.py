from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.llm_service import LLMService
from app.services.scanners.red_team_agent import AutonomousRedTeamAgent
from app.services.scanners.blue_team_agent import AutonomousBlueTeamAgent
from app.core.rate_limit import safe_rate_limiter

router = APIRouter(prefix="/ai-agents", tags=["AI Agents"])
llm_service = LLMService()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    agent_type: str = "copilot" # copilot, compliance, red_team, blue_team

class TargetRequest(BaseModel):
    target_endpoint: str

class RemediationRequest(BaseModel):
    finding_type: str
    severity: str
    context: str = ""
    technique: str = ""

@router.post("/chat", dependencies=[Depends(safe_rate_limiter(times=20, seconds=60))])
async def chat_with_agent(request: ChatRequest):
    """
    Chat endpoint powered by OpenRouter. Handles different AI personas based on agent_type.
    """
    # Fail fast with 503 if the LLM service is not configured (e.g. missing OPENROUTER_API_KEY)
    if not llm_service._available:
        raise HTTPException(status_code=503, detail="AI service is not configured. Please set OPENROUTER_API_KEY.")

    persona = None
    if request.agent_type == "compliance":
        persona = (
            "You are SentinelNexus, an elite CyberSecurity Compliance Copilot. "
            "You specialize in SOC2, ISO 27001, GDPR, and HIPAA. "
            "Your tone is highly professional, precise, authoritative, and futuristic. "
            "Provide technical and strategic compliance guidance."
        )
    elif request.agent_type == "red_team":
        persona = (
            "You are SentinelNexus Red Team AI. You act as an offensive cybersecurity expert. "
            "You explain attack vectors, penetration testing methodologies, and adversarial emulation. "
            "Your tone is futuristic, dark, and highly technical."
        )
    elif request.agent_type == "blue_team":
        persona = (
            "You are SentinelNexus Blue Team AI. You act as a defensive cybersecurity orchestrator. "
            "You generate remediation patches, WAF rules, and incident response plans. "
            "Your tone is protective, urgent, and highly technical."
        )

    # Convert Pydantic models to dicts
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

    # Exec Copilot uses fast model, complex analysis uses default model
    use_fast = request.agent_type in ["copilot", "compliance"]

    try:
        stream_generator = llm_service.generate_chat_stream(messages, persona_override=persona, use_fast_model=use_fast)
        return StreamingResponse(
            stream_generator,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI Service Unavailable: {str(e)}")

@router.post("/red-team/launch", dependencies=[Depends(safe_rate_limiter(times=5, seconds=60))])
async def launch_red_team(request: TargetRequest):
    """
    Launch a red team campaign against a target. (Now integrated with LLM in the service level)
    """
    # For now, we still return the structure expected by the frontend, but we could enhance this 
    # to return a live LLM analysis.
    result = AutonomousRedTeamAgent.run_simulation(request.target_endpoint)
    return result

@router.post("/blue-team/remediate", dependencies=[Depends(safe_rate_limiter(times=10, seconds=60))])
async def blue_team_remediate(request: RemediationRequest):
    """
    Generate defensive patches using LLM.
    """
    result = AutonomousBlueTeamAgent.generate_remediation(
        finding_type=request.finding_type,
        severity=request.severity,
        context=request.context,
        technique=request.technique
    )
    return result
