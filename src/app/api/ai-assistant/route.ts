import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, userRole, className, userName } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const query = prompt.toLowerCase();
    let reply = "";

    // Persona: Ido (Female AI Virtual Assistant & Coding Guide for Sarhad College)
    if (query.includes("who are you") || query.includes("your name") || query.includes("ido")) {
      reply = `Hello ${userName || "there"}! I'm **Ido** 👩‍💻, your dedicated female AI Virtual Assistant & Coding Mentor at Sarhad College.

I'm here to guide you through:
- 💡 **Data Structures & Algorithms (DSA)**
- 🐛 **Debugging C++, Java, Python & Web Code**
- 🚀 **Building Resume Projects**
- 📚 **Exam Preparation & Lecture Notes Guidance**

How can I help you today?`;
    } else if (query.includes("two sum") || query.includes("array")) {
      reply = `### 💡 Ido's DSA Guide: Two Sum Target Pair

Hi ${userName || "student"}! The Two Sum problem is a classic array question. Here is the optimal Hash Map approach (**O(n)** time complexity):

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

**Ido's Tip**: Using a hash map avoids the \\(O(n^2)\\) nested loop approach. Always mention space complexity (**O(n)**) during technical interviews!`;
    } else if (query.includes("debug") || query.includes("error") || query.includes("bug")) {
      reply = `### 🐛 Ido's Code Debugging Checklist

Let's solve your bug together! Check these common issues:
1. **Array Off-By-One**: Ensure loop bounds use \`< length\` instead of \`<= length\`.
2. **Uninitialized Variables**: Verify pointers or objects are initialized before accessing properties.
3. **Infinite Loops**: Check if your loop control variables are being updated on every iteration.
4. **Type Overflows**: Use \`long long\` in C++ or \`BigInt\` in JS for large values.

Paste your broken code snippet here, and I'll debug it for you! 🛠️`;
    } else if (query.includes("project") || query.includes("idea")) {
      reply = `### 🚀 Ido's Top Project Ideas for ${className || "TY BSc CS"}

Here are standout project ideas you can build and showcase on CampusCode:
1. **AI-Powered Code Reviewer**: Integrates OpenAI API to analyze pull requests and highlight security vulnerabilities.
2. **Distributed Peer-to-Peer File Vault**: WebSockets & React app with end-to-end encryption.
3. **Campus Placement Analytics Portal**: Real-time dashboard tracking student interview clears and DSA leaderboard stats.

Once finished, upload your project to the **Class Projects Showcase** tab!`;
    } else if (query.includes("exam") || query.includes("notes") || query.includes("study")) {
      reply = `### 📚 Ido's Exam Preparation Advice

For your **${className || "B.Sc Computer Science"}** semester exams:
- Download the official lecture PDFs uploaded by **Dr. Vikramaditya Gupta** in the **Virtual Classroom Hub**.
- Focus on **Graph Algorithms (BFS/DFS)**, **Paging in Operating Systems**, and **Database Normalization (3NF/BCNF)**.
- Solve at least 2 coding problems daily on CampusCode to maintain your **Streak** & **XP**!`;
    } else if (query.includes("submit") || query.includes("assignment")) {
      reply = `### 📝 Submitting Assignments with Ido

1. Open **Virtual Classrooms** from the sidebar menu.
2. Select your batch (**${className || "TY BSc CS"}**).
3. Click the **Class Projects** tab and select **+ Add New Project**.
4. Include your GitHub repo URL and live demo link. Your faculty will review it!`;
    } else {
      reply = `Hi ${userName || "there"}! I'm **Ido** 👩‍💻, your AI Virtual Assistant & Coding Mentor.

I'm ready to help you:
- 💡 **Master DSA Algorithms** (Arrays, Trees, Graphs, DP)
- 🐛 **Debug Code** in C++, Java, Python, JavaScript & SQL
- 🚀 **Build Impactful Web & AI Projects**
- 📚 **Prepare for Exams & Review Class Notes**

Feel free to ask me anything or paste your code snippet below! 💕`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Ido AI Assistant error" }, { status: 500 });
  }
}
