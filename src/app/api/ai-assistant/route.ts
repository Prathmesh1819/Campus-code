import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, userRole, className, userName, history } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const name = userName || "Prathmesh";
    const query = prompt.trim();
    const qLower = query.toLowerCase();

    // 1. Natural Casual Greetings & Friendly Conversations
    if (["hi", "hii", "hiii", "hello", "hey", "heyy", "whatsup", "whats up", "greetings"].includes(qLower)) {
      return NextResponse.json({
        reply: `Hi **${name}**! 👋💕 It's wonderful to chat with you!

How are you doing today? How can I help you with your coding, coursework, or general questions?`,
      });
    }

    if (qLower.includes("how are you") || qLower.includes("how r u")) {
      return NextResponse.json({
        reply: `I'm doing fantastic, **${name}**! Thank you for asking. 😊

I'm right here and ready to help you with your DSA coding problems, general knowledge, psychology, or exam notes. What's on your mind?`,
      });
    }

    if (qLower.includes("thank") || qLower.includes("thx")) {
      return NextResponse.json({
        reply: `You're so very welcome, **${name}**! ✨ I'm always here whenever you need coding help or guidance! 💕`,
      });
    }

    const systemInstruction = `You are Ido 👩‍💻, an intelligent, friendly female AI mentor & virtual tutor at Sarhad College (Batch: ${className || "TY BSc CS"}).
You possess full ChatGPT & Gemini level knowledge across:
1. Human Psychology, Emotional Intelligence, Mental Health & Student Counselling.
2. World General Knowledge, Geography, History, Science, Physics, Chemistry, Biology & Mathematics.
3. Computer Science, Full-Stack Software Engineering, Data Structures & Algorithms, Artificial Intelligence & System Design.
4. Sarhad College Academics, Exam Preparation & Career Guidance.

Answer accurately, warmly, and thoroughly in clear markdown. Address the student as ${name}.`;

    // 2. Official Google Gemini API Integration (Using User API Key from .env.local)
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemInstruction}\n\nUser (${name}) Question: ${prompt}` }],
              },
            ],
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiText && aiText.trim().length > 0) {
            return NextResponse.json({ reply: aiText.trim() });
          }
        }
      } catch (err) {
        console.error("Gemini API call failed, attempting backup LLM:", err);
      }
    }

    // 3. Backup Public Generative LLM Endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const pollinationsUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(systemInstruction)}&model=openai`;
      const res = await fetch(pollinationsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 5 && !text.includes("An error occurred")) {
          return NextResponse.json({ reply: text.trim() });
        }
      }
    } catch (e) {
      // Fall through to domain knowledge base
    }

    // 4. Indian State Capitals & Geography Knowledge Base
    const KNOWLEDGE_BASE: Record<string, string> = {
      maharashtra: "The capital of Maharashtra is **Mumbai** (the financial capital of India). Its winter capital is **Nagpur**.",
      karnataka: "The capital of Karnataka is **Bengaluru** (Bangalore), the IT hub of India.",
      "tamil nadu": "The capital of Tamil Nadu is **Chennai**.",
      delhi: "New Delhi is the capital of India.",
      gujarat: "The capital of Gujarat is **Gandhinagar**.",
      rajasthan: "The capital of Rajasthan is **Jaipur** (the Pink City).",
      "west bengal": "The capital of West Bengal is **Kolkata**.",
      kerala: "The capital of Kerala is **Thiruvananthapuram**.",
      "uttar pradesh": "The capital of Uttar Pradesh is **Lucknow**.",
      goa: "The capital of Goa is **Panaji**.",
      telangana: "The capital of Telangana is **Hyderabad**.",
      punjab: "The capital of Punjab is **Chandigarh**.",
    };

    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
      if (qLower.includes(key)) {
        return NextResponse.json({
          reply: `Hi **${name}**! 📍 ${value}`,
        });
      }
    }

    if (qLower.includes("capital") && qLower.includes("india")) {
      return NextResponse.json({
        reply: `Hi **${name}**! 🇮🇳 The capital of India is **New Delhi**.`,
      });
    }

    // 5. Default Response
    return NextResponse.json({
      reply: `Hi **${name}**! I'm **Ido** 👩‍💻, your AI Mentor.

Regarding your question **"${query}"**: I am equipped to assist you with programming, general knowledge, psychology, science, and exam preparation! 💕`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Ido AI Assistant error" }, { status: 500 });
  }
}
