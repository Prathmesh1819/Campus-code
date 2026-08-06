import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim().replace(/^"|"$/g, "");
        process.env[key] = value;
      }
    }
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log("Testing Gemini Key:", apiKey ? apiKey.substring(0, 10) + "..." : "Missing");

  if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY found!");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("Who is the Prime Minister of India?");
    console.log("✔ Gemini Response Output:");
    console.log(result.response.text());
  } catch (err: any) {
    console.error("❌ Gemini API Test Failed:", err);
  }
}

main();
