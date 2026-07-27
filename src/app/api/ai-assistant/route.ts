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

    if (qLower.includes("who are you") || qLower.includes("your name") || qLower.includes("ido")) {
      return NextResponse.json({
        reply: `I'm **Ido** 👩‍💻, your female AI Virtual Assistant & Mentor at Sarhad College!

I'm here to help you master **Data Structures & Algorithms**, debug code in any language, answer **General Knowledge & Psychology** questions, and guide your academic journey! 🚀`,
      });
    }

    // 2. Try Free Public Generative LLM Endpoints
    const systemInstruction = `You are Ido 👩‍💻, an intelligent, friendly female AI mentor at Sarhad College. Answer the user's question (${name}) concisely, accurately, and warmly in markdown.`;

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
      // Fall through to domain-specific knowledge base if external fetch times out
    }

    // 3. Indian State Capitals & Geography Knowledge Base
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

    if (qLower.includes("capital")) {
      if (qLower.includes("india")) {
        return NextResponse.json({
          reply: `Hi **${name}**! 🇮🇳 The capital of India is **New Delhi**.`,
        });
      }
    }

    // 4. Psychology & Human Behavior Knowledge Base
    if (qLower.includes("psychology") || qLower.includes("mind") || qLower.includes("behavior") || qLower.includes("stress") || qLower.includes("anxiety")) {
      return NextResponse.json({
        reply: `### 🧠 Ido's Psychology & Mindset Insights

Hi **${name}**! Human psychology centers around cognitive processes, emotional regulation, and neural pathways.

**Core Concepts**:
1. **Cognitive Reframing**: Analyzing negative self-talk and shifting focus toward actionable steps.
2. **Growth Mindset**: Believing abilities develop through dedicated practice and resilience.
3. **Stress Management**: Use the 4-7-8 breathing technique and 25-minute Pomodoro focus blocks to reduce cognitive overload.`,
      });
    }

    // 5. Default Natural Response
    return NextResponse.json({
      reply: `Hi **${name}**! I've noted your question: **"${query}"**.

I'm ready to help you with coding in Java, C++, Python, JavaScript, DSA algorithms, General Knowledge, and Psychology! Feel free to ask any specific topic! 💕`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Ido AI Assistant error" }, { status: 500 });
  }
}
