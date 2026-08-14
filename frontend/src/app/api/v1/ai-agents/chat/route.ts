import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const agent_type = body.agent_type;
    const messages = body.messages || [];
    
    // Map internal agent types to system prompts
    let systemPrompt = "You are a generic cybersecurity assistant.";
    if (agent_type === "red_team") {
      systemPrompt = "You are an expert Red Team security AI. Your goal is to simulate offensive security operations, identify vulnerabilities, and provide actionable reconnaissance insights for defensive purposes. Keep responses concise and technical. Do not output markdown code blocks unless requested. Be professional.";
    } else if (agent_type === "blue_team" || agent_type === "copilot") {
      systemPrompt = "You are an expert Blue Team security AI. Your goal is to analyze threats, provide defensive strategies, and assist in incident response. Keep responses concise and technical. Be professional.";
    } else if (agent_type === "compliance") {
      systemPrompt = "You are a Compliance and Governance AI expert. Provide guidance on SOC2, ISO27001, GDPR, and other regulatory frameworks.";
    }

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey.startsWith("{{")) {
      console.error("OPENROUTER_API_KEY is missing or an unresolved placeholder in this environment.");
      return new Response("AI service is not configured (missing OPENROUTER_API_KEY).", { status: 503 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://sentinelnexus.mayankiitj.in",
        "X-Title": "SentinelNexus Guard"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages: chatMessages,
        stream: true,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      // OpenRouter actual cause (bad key, rate limit)
      // in the body — statusText alone is useless for diagnosing production.
      const detail = await response.text().catch(() => "");
      console.error(`OpenRouter API error ${response.status}: ${detail}`);
      return new Response(`OpenRouter API error ${response.status}: ${detail}`, {
        status: response.status === 401 || response.status === 429 ? response.status : 502,
      });
    }

    // Transform OpenRouter's SSE stream into a simple text stream for our frontend
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain" }
    });

  } catch (err) {
    console.error("Error processing AI chat:", err);
    return new Response("Error processing AI chat", { status: 500 });
  }
}
