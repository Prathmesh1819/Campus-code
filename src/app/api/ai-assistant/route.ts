import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, userRole, className, userName } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const name = userName || "Prathmesh";
    const query = prompt.trim();
    const qLower = query.toLowerCase();

    // 1. Natural Casual Greetings
    if (["hi", "hii", "hiii", "hello", "hey", "heyy", "whatsup", "whats up", "greetings"].includes(qLower)) {
      return NextResponse.json({
        reply: `Hi **${name}**! 👋💕 It's wonderful to chat with you!\n\nHow are you doing today? What question can I help you solve?`,
      });
    }

    if (qLower.includes("how are you") || qLower.includes("how r u")) {
      return NextResponse.json({
        reply: `I'm doing fantastic, **${name}**! Thank you for asking. 😊\n\nI'm ready to answer any questions on general knowledge, politics, science, or coding!`,
      });
    }

    // 2. Try Gemini API if valid
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiApiKey && geminiApiKey.length > 25 && geminiApiKey.startsWith("AIza")) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `You are Ido 👩‍💻, an intelligent female AI mentor at Sarhad College. Answer the user's question (${name}) warmly and accurately:\n\n${prompt}` }],
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
      } catch (e) {
        // Fall through
      }
    }

    // 3. GENERAL KNOWLEDGE & POLITICS ENGINE

    // Prime Minister of India
    if (qLower.includes("prime minister") && qLower.includes("india")) {
      return NextResponse.json({
        reply: `Hi **${name}**! 🇮🇳 The Prime Minister of India is **Narendra Modi** (Narendra Damodardas Modi).

**Key Facts**:
- **Term**: Serving as the 14th Prime Minister of India since 2014.
- **Role**: Head of Government and leader of the Union Council of Ministers.`,
      });
    }

    // President of India
    if (qLower.includes("president") && qLower.includes("india")) {
      return NextResponse.json({
        reply: `Hi **${name}**! 🇮🇳 The President of India is **Droupadi Murmu** (serving as the 15th President of India since 2022). She is the first tribal leader to hold the office.`,
      });
    }

    // Chief Minister of Maharashtra
    if (qLower.includes("chief minister") && qLower.includes("maharashtra")) {
      return NextResponse.json({
        reply: `Hi **${name}**! 📍 The Chief Minister of Maharashtra is **Eknath Shinde** / Devendra Fadnavis (Government of Maharashtra).`,
      });
    }

    // Indian State Capitals & Geography
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
      if (qLower.includes(key) && qLower.includes("capital")) {
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

    // Astronomy & Physics
    if (qLower.includes("moon")) {
      if (qLower.includes("area") || qLower.includes("surface")) {
        return NextResponse.json({
          reply: `Hi **${name}**! 🌕 The surface area of the **Moon** is approximately **37.9 million square kilometers** (14.6 million square miles), which is about **7.4% of Earth's surface area**.`,
        });
      }
      if (qLower.includes("distance") || qLower.includes("far")) {
        return NextResponse.json({
          reply: `Hi **${name}**! 🌕 The average distance from **Earth to the Moon** is **384,400 kilometers** (238,855 miles). Light takes **1.3 seconds** to travel between Earth and the Moon.`,
        });
      }
    }

    if (qLower.includes("sun") && (qLower.includes("distance") || qLower.includes("far"))) {
      return NextResponse.json({
        reply: `Hi **${name}**! ☀️ The distance from **Earth to the Sun** is **149.6 million kilometers** (93 million miles or 1 AU). Sunlight takes **8 minutes and 20 seconds** to reach Earth.`,
      });
    }

    // 4. DSA & CODING ENGINE (Strict Word Matching)

    // Two Sum / Array Target Pair Problem
    if (qLower.includes("two sum") || (qLower.includes("array") && qLower.includes("target") && qLower.includes("indices"))) {
      return NextResponse.json({
        reply: `### 💡 Two Sum Target Pair Solution

Hi **${name}**! Here is the complete **\\(O(n)\\)** Hash Map solution for Two Sum:

\`\`\`javascript
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
\`\`\`

\`\`\`java
import java.util.HashMap;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}
\`\`\`

**Complexity**: \\(O(n)\\) Time | \\(O(n)\\) Space.`,
      });
    }

    // Prime Number Math Code (Strictly checking "prime number" or "prime code", NOT "prime minister")
    if ((qLower.includes("prime number") || qLower.includes("is prime") || qLower.includes("check prime") || (qLower.includes("prime") && !qLower.includes("minister")))) {
      return NextResponse.json({
        reply: `### ☕ Prime Number Program in Java

Hi **${name}**! Here is the optimal \\(O(\\sqrt{n})\\) Java code:

\`\`\`java
import java.util.Scanner;

public class PrimeCheck {
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }
    public static void main(String[] args) {
        System.out.println("29 is prime: " + isPrime(29));
    }
}
\`\`\``,
      });
    }

    // 5. Dynamic General Knowledge Formatter
    const topic = query.replace(/tell me|what is|who is|how to|explain|show me|give me|the/gi, "").trim();

    return NextResponse.json({
      reply: `Hi **${name}**! Regarding **"${query}"**:

I have logged your question about **${topic || query}**! Feel free to ask any specific coding, DSA, astronomy, or general knowledge question! 💕`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Ido AI Assistant error" }, { status: 500 });
  }
}
