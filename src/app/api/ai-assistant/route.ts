import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, userRole, className } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const query = prompt.toLowerCase();
    let reply = "";

    // Intelligent Knowledge Base & Context Engine for Sarhad College
    if (query.includes("two sum") || query.includes("array")) {
      reply = `### 💡 Array & Hash Map Optimization Guide

**Problem Pattern**: Two Sum Target Pair
**Optimal Approach**: Use a Hash Map (Unordered Map in C++ / Object in JS) to achieve **O(n)** time complexity.

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

**Tip**: Always state your space complexity (**O(n)** for hash map) during technical interview rounds!`;
    } else if (query.includes("debug") || query.includes("error") || query.includes("bug")) {
      reply = `### 🐛 AI Code Debugging Checklist

Here is a step-by-step checklist to debug your code:
1. **Check Array Off-By-One Errors**: Ensure loops run \`< length\` instead of \`<= length\`.
2. **Null Pointer dereference**: Verify pointers/objects are initialized before accessing properties.
3. **Memory Limits**: In recursion (e.g. DFS), ensure a base case is defined to prevent Stack Overflow.
4. **Data Type Overflows**: Use \`long long\` in C++ or \`BigInt\` in JS for numbers exceeding \\(2^{31} - 1\\).

Need me to review a specific code snippet? Paste your code here and I will find the bug for you!`;
    } else if (query.includes("project") || query.includes("idea")) {
      reply = `### 🚀 Recommended Student Project Ideas for ${className || "TY BSc CS"}

Here are top resume-worthy project ideas you can build and showcase on CampusCode:
1. **AI-Powered Code Reviewer**: Integrates OpenAI API to analyze pull requests and highlight security vulnerabilities.
2. **Distributed File Storage System**: Node.js & WebSockets peer-to-peer file sharing app with end-to-end encryption.
3. **Campus Placement Analytics Portal**: Next.js & PostgreSQL dashboard tracking student interview clears and DSA leaderboard stats.

You can publish your completed project in the **Class Projects Showcase** tab!`;
    } else if (query.includes("exam") || query.includes("notes") || query.includes("study")) {
      reply = `### 📚 Academic & Exam Preparation Guidance

To excel in your **${className || "B.Sc Computer Science"}** semester exams:
- Download the official lecture notes uploaded by **Dr. Vikramaditya Gupta** in the **Virtual Classroom Hub**.
- Focus heavily on **Graph Algorithms (BFS/DFS/Dijkstra)**, **Paging in Operating Systems**, and **Database Normalization (3NF/BCNF)**.
- Practice solving at least 2 Medium difficulty problems on CampusCode daily to maintain your **Streak** & **XP**!`;
    } else if (query.includes("submit") || query.includes("assignment")) {
      reply = `### 📝 How to Submit Assignments & Projects

1. Go to **Virtual Classrooms** from the sidebar menu.
2. Select your batch (**${className || "TY BSc CS"}**).
3. Switch to the **Class Projects** tab and click **+ Add New Project**.
4. Include your GitHub Repository URL, Live Demo link, and project description. Your faculty will review it directly!`;
    } else {
      reply = `Hello! I am **Sarhad AI**, your Virtual Coding Assistant & Academic Guide.

I am here to help you:
- 💡 **Understand DSA Algorithms** (Arrays, Trees, Graphs, DP, Dynamic Programming)
- 🐛 **Debug Code** in C++, Java, Python, JavaScript & SQL
- 🚀 **Brainstorm High-Impact Web & AI Projects**
- 📚 **Navigate Course Notes & Exam Schedules** for ${className || "TY BSc CS"}

Feel free to ask me any question or paste a code snippet! How can I assist you today?`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "AI Assistant processing error" }, { status: 500 });
  }
}
