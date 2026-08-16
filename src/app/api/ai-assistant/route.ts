import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { classifyUserQuery } from "@/lib/ai/classifier";
import { executeCampusTools } from "@/lib/ai/campus-tools";
import { fetchLiveWebInfo } from "@/lib/ai/web-tools";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const settingsFilePath = path.join(process.cwd(), "src", "data", "ai-settings.json");

function getAiSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const fileData = fs.readFileSync(settingsFilePath, "utf-8");
      return JSON.parse(fileData);
    }
  } catch (err) {
    // Default fallback
  }
  return {
    aiName: "Ido",
    aiAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    aiSubtitle: "Sarhad College Virtual Guide & Coding Assistant",
    aiBadge: "FEMALE AI MENTOR 💖",
    personaInstruction: "You are Ido 👩‍💻, an intelligent female AI coding mentor at Sarhad College.",
  };
}

async function getAuthUser(req: Request) {
  let token = "";
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value || "";
  }

  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload?.userId) return null;

  return await prisma.users.findUnique({
    where: { id: payload.userId },
    include: { roles: true, classes: true },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, history, userName, userRole, className, problemContext } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const aiSettings = getAiSettings();
    const dbUser = await getAuthUser(req);

    const name = dbUser?.full_name || dbUser?.username || userName || "Student";
    const role = dbUser?.roles?.name?.toUpperCase() || userRole || "STUDENT";
    const batchClass = dbUser?.classes?.name || className || "TY BSc CS";

    const authUserInfo = {
      id: dbUser?.id,
      name,
      role,
      className: batchClass,
    };

    // 1. INTENT CLASSIFICATION LAYER
    const classification = await classifyUserQuery(prompt, history || []);

    // 2. RETRIEVE CAMPUS DATABASE CONTEXT (IF NEEDED)
    let campusDbContext = "";
    let campusItemsCount = 0;
    if (classification.requiresDb || classification.category === "CAMPUS_DATA" || classification.category === "MIXED_QUERY") {
      const toolRes = await executeCampusTools(classification.entitiesNeeded, authUserInfo, prompt);
      campusDbContext = toolRes.textContext;
      campusItemsCount = toolRes.retrievedItemsCount;
    }

    // 3. RETRIEVE LIVE WEB KNOWLEDGE CONTEXT (IF TIME-SENSITIVE)
    let webContext = "";
    let webSources: any[] = [];
    let webVerified = false;
    if (classification.isCurrentInfo || classification.category === "CURRENT_INFORMATION" || classification.category === "MIXED_QUERY") {
      const webRes = await fetchLiveWebInfo(classification.cleanSearchKeywords || prompt);
      webContext = webRes.webContext;
      webSources = webRes.results;
      webVerified = webRes.verified;
    }

    // 4. DETERMINE SOURCE TAG
    let source: "CAMPUS_DATABASE" | "AI_KNOWLEDGE" | "WEB_SEARCH" | "MIXED" = "AI_KNOWLEDGE";
    if (campusItemsCount > 0 && webVerified) {
      source = "MIXED";
    } else if (campusItemsCount > 0) {
      source = "CAMPUS_DATABASE";
    } else if (webVerified) {
      source = "WEB_SEARCH";
    } else {
      source = "AI_KNOWLEDGE";
    }

    // 5. CASUAL GREETING FAST PATH
    if (classification.category === "CASUAL_CONVERSATION" && prompt.trim().length < 15) {
      const qLower = prompt.toLowerCase().trim();
      if (["hi", "hii", "hello", "hey", "heyy"].includes(qLower)) {
        return NextResponse.json({
          reply: `Hi **${name}**! 👋💕 I'm **${aiSettings.aiName}**, your AI Mentor at Sarhad College!\n\nHow can I help you today? You can ask me about coding (DSA, Java, C++, Python, SQL), general knowledge, or your campus schedule & leaderboard!`,
          category: classification.category,
          source: "AI_KNOWLEDGE",
        });
      }
    }

    // 6. BUILD SYNTHESIS SYSTEM PROMPT WITH PROBLEM CONTEXT
    const systemPromptParts = [
      `${aiSettings.personaInstruction}`,
      `You are chatting with ${name} (Role: ${role}, Class/Batch: ${batchClass}).`,
      `Query Category: ${classification.category}.`,
      ``,
      `PEDAGOGICAL & MENTORING RULES:`,
      `1. Be warm, supportive, encouraging, and educational. Use clear markdown formatting with bold text, bullet points, and syntax-highlighted code blocks.`,
      `2. Hints: When asked for a hint, provide educational hints and step-by-step intuition without giving away the complete solution immediately.`,
      `3. Debugging Code: When asked to debug or analyze student code, structure your response as:`,
      `   a) What is wrong`,
      `   b) Why it is wrong`,
      `   c) How to fix it`,
      `   d) Corrected code snippet when appropriate`,
      `4. General Knowledge & Coding: Answer naturally and thoroughly.`,
      `5. Security: Never expose hidden test cases, database credentials, or secret keys.`,
      `6. Sports & Cricket Guidance: When discussing current cricket rankings or who the best batsman in the world is, provide an objective, evidence-based overview of top-ranked batters (e.g. Virat Kohli, Joe Root, Kane Williamson, Steve Smith) without mentioning Babar Azam unless the user explicitly asks about Babar Azam. Do not present unsupported personal opinions as official rankings.`,
    ];

    if (problemContext) {
      // Filter out any hidden test cases just in case
      const safeExamples = (problemContext.examples || []).filter((ex: any) => !ex.isHidden && !ex.is_hidden);
      systemPromptParts.push(`\n--- CURRENT ACTIVE PROBLEM CONTEXT ---
Title: ${problemContext.title || "Coding Challenge"}
Difficulty: ${problemContext.difficulty || "N/A"}
Category: ${problemContext.category || "DSA"}
Description: ${problemContext.description || "N/A"}
Constraints: ${problemContext.constraints || "N/A"}
Public Examples: ${JSON.stringify(safeExamples)}
${problemContext.userCode ? `User's Current Code:\n\`\`\`\n${problemContext.userCode}\n\`\`\`` : ""}`);
    }

    if (campusDbContext) {
      systemPromptParts.push(`\n--- AUTHORIZED CAMPUS DATABASE CONTEXT ---\n${campusDbContext}`);
    }

    if (webContext) {
      systemPromptParts.push(`\n--- LIVE WEB CONTEXT ---\n${webContext}`);
    } else if (classification.isCurrentInfo) {
      systemPromptParts.push(`\n--- LIVE WEB CONTEXT ---\nNo live web results retrieved. Note: Inform user if current stats cannot be verified.`);
    }

    const systemPrompt = systemPromptParts.join("\n");

    // 7. BUILD CONVERSATION CONTENTS FOR GEMINI API
    const formattedContents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach((msg: any) => {
        if (msg.content && typeof msg.content === "string") {
          formattedContents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          });
        }
      });
    }

    formattedContents.push({
      role: "user",
      parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }],
    });

    // 8. INVOKE GEMINI MODEL PROVIDER WITH DIAGNOSTICS
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    console.log(`[IDO] Gemini configured: ${Boolean(geminiApiKey)} (Length: ${geminiApiKey ? geminiApiKey.length : 0})`);
    console.log(`[IDO] Gemini request started`);

    let lastErrorCategory = "UNCONFIGURED";
    let lastHttpStatus = 503;

    if (geminiApiKey) {
      const modelsToTry = [
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
      ];

      for (const modelName of modelsToTry) {
        try {
          console.log(`[IDO] Model attempted: ${modelName}`);
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: formattedContents }),
          });

          lastHttpStatus = geminiRes.status;
          console.log(`[IDO] HTTP status: ${geminiRes.status}`);

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiText && aiText.trim().length > 0) {
              console.log(`[IDO] Gemini response successfully retrieved from ${modelName}!`);
              return NextResponse.json({
                success: true,
                reply: aiText.trim(),
                category: classification.category,
                source,
                sourcesList: webSources.slice(0, 3),
              });
            }
          } else {
            const errText = await geminiRes.text();
            if (geminiRes.status === 401 || geminiRes.status === 403) {
              lastErrorCategory = "AUTH";
            } else if (geminiRes.status === 404) {
              lastErrorCategory = "MODEL_NOT_FOUND";
            } else if (geminiRes.status === 429) {
              lastErrorCategory = "RATE_LIMIT";
            } else {
              lastErrorCategory = "SERVER_ERROR";
            }
            console.error(`[IDO] Provider error category: ${lastErrorCategory} (HTTP status: ${geminiRes.status})`);
          }
        } catch (e: any) {
          lastErrorCategory = "SERVER_ERROR";
          console.error(`[IDO] Network error trying ${modelName}:`, e.message);
        }
      }
    }

    // If Gemini API call failed or key is unauthenticated, return proper error response
    console.error(`[IDO] Provider error category: ${lastErrorCategory} (HTTP status: ${lastHttpStatus})`);

    const errorMessage =
      lastErrorCategory === "AUTH"
        ? "Gemini authentication failed (HTTP 401/403). Please configure a valid Google AI Studio API key in .env.local (GEMINI_API_KEY)."
        : lastErrorCategory === "RATE_LIMIT"
        ? "Gemini API rate limit exceeded (HTTP 429). Please try again shortly."
        : "Ido AI service is temporarily unavailable. Please try again in a moment.";

    return NextResponse.json(
      {
        success: false,
        reply: `Ido AI Assistant Notice: ${errorMessage}`,
        error: errorMessage,
        providerErrorCategory: lastErrorCategory,
        httpStatus: lastHttpStatus,
      },
      { status: lastHttpStatus >= 400 && lastHttpStatus < 600 ? lastHttpStatus : 503 }
    );
  } catch (error: any) {
    console.error("AI Assistant API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process AI query" }, { status: 500 });
  }
}
