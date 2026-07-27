import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const settingsFilePath = path.join(process.cwd(), "src", "data", "ai-settings.json");

function getSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading AI settings:", err);
  }
  return {
    aiName: "Ido",
    aiAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    aiSubtitle: "Sarhad College Virtual Guide & Coding Assistant",
    aiBadge: "FEMALE AI MENTOR 💖",
    personaInstruction: "You are Ido 👩‍💻, an intelligent female AI coding mentor at Sarhad College.",
  };
}

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { aiName, aiAvatar, aiSubtitle, aiBadge, personaInstruction } = body;

    const currentSettings = getSettings();
    const updatedSettings = {
      aiName: aiName !== undefined ? aiName : currentSettings.aiName,
      aiAvatar: aiAvatar !== undefined ? aiAvatar : currentSettings.aiAvatar,
      aiSubtitle: aiSubtitle !== undefined ? aiSubtitle : currentSettings.aiSubtitle,
      aiBadge: aiBadge !== undefined ? aiBadge : currentSettings.aiBadge,
      personaInstruction: personaInstruction !== undefined ? personaInstruction : currentSettings.personaInstruction,
    };

    fs.writeFileSync(settingsFilePath, JSON.stringify(updatedSettings, null, 2), "utf8");

    return NextResponse.json({
      message: "AI Assistant settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update AI settings" }, { status: 500 });
  }
}
