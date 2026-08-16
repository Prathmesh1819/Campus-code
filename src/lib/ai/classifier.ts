export type QueryCategory =
  | "CAMPUS_DATA"
  | "GENERAL_KNOWLEDGE"
  | "CURRENT_INFORMATION"
  | "CODING_HELP"
  | "CASUAL_CONVERSATION"
  | "MIXED_QUERY";

export interface ClassificationResult {
  category: QueryCategory;
  isCurrentInfo: boolean;
  requiresDb: boolean;
  entitiesNeeded: ("LEADERBOARD" | "USERS" | "ASSIGNMENTS" | "NOTES" | "COURSES" | "CLASSES" | "ANNOUNCEMENTS" | "PROBLEMS" | "SUBMISSIONS")[];
  cleanSearchKeywords: string;
}

const CASUAL_PATTERNS = [
  /^(hi|hii|hiii|hello|hey|heyy|whatsup|whats up|greetings|good morning|good evening|good afternoon)(\s+|$)/i,
  /^(how are you|how r u|who are you|what is your name|tell me about yourself)/i,
];

const TIME_SENSITIVE_WORDS = [
  "today",
  "latest",
  "current",
  "recent",
  "now",
  "this week",
  "2026",
  "currently",
  "who is currently",
  "latest ranking",
  "latest score",
  "recent news",
  "match today",
  "weather",
  "ipl",
  "cricket match",
  "news",
];

const CAMPUS_KEYWORDS = [
  "campuscode",
  "leaderboard",
  "topper",
  "highest scorer",
  "my score",
  "my xp",
  "my streak",
  "my assignments",
  "pending assignments",
  "who teaches",
  "class teacher",
  "subject teacher",
  "faculty",
  "teacher",
  "notes",
  "lecture notes",
  "announcements",
  "ty bsc cs",
  "sy bsc cs",
  "fy bsc cs",
  "classmates",
  "roll number",
  "enrolled",
];

const CODING_KEYWORDS = [
  "binary search",
  "two sum",
  "recursion",
  "linked list",
  "array",
  "stack",
  "queue",
  "tree",
  "graph",
  "algorithm",
  "dsa",
  "java",
  "python",
  "javascript",
  "typescript",
  "c++",
  "golang",
  "rust",
  "kotlin",
  "sql",
  "html",
  "css",
  "react",
  "next.js",
  "node.js",
  "git",
  "github",
  "nullpointerexception",
  "syntax error",
  "time complexity",
  "space complexity",
  "big o",
  "dbms",
  "oop",
  "operating system",
  "computer networks",
];

export async function classifyUserQuery(
  prompt: string,
  history: any[] = []
): Promise<ClassificationResult> {
  const query = prompt.trim();
  const qLower = query.toLowerCase();

  const isTimeSensitive = TIME_SENSITIVE_WORDS.some((word) => qLower.includes(word));
  const hasCampusTerms = CAMPUS_KEYWORDS.some((word) => qLower.includes(word));
  const hasCodingTerms = CODING_KEYWORDS.some((word) => qLower.includes(word));
  const isCasual = CASUAL_PATTERNS.some((pattern) => pattern.test(qLower));

  const entitiesNeeded: ClassificationResult["entitiesNeeded"] = [];

  if (qLower.includes("leaderboard") || qLower.includes("topper") || qLower.includes("highest scorer") || qLower.includes("who is leading") || qLower.includes("rank")) {
    entitiesNeeded.push("LEADERBOARD");
  }
  if (qLower.includes("who teaches") || qLower.includes("class teacher") || qLower.includes("subject teacher") || qLower.includes("faculty assignment")) {
    entitiesNeeded.push("USERS", "CLASSES", "COURSES");
  }
  if (qLower.includes("my assignment") || qLower.includes("pending assignment") || qLower.includes("homework due")) {
    entitiesNeeded.push("ASSIGNMENTS");
  }
  if (qLower.includes("lecture note") || qLower.includes("teacher note") || qLower.includes("study material")) {
    entitiesNeeded.push("NOTES");
  }
  if (qLower.includes("announcement") || qLower.includes("campus notice")) {
    entitiesNeeded.push("ANNOUNCEMENTS");
  }
  if (qLower.includes("my score") || qLower.includes("my xp") || qLower.includes("my streak")) {
    entitiesNeeded.push("SUBMISSIONS", "USERS");
  }

  // Database is only required if specific campus entity retrieval is requested
  const requiresDb = entitiesNeeded.length > 0;

  // Determine category
  let category: QueryCategory = "GENERAL_KNOWLEDGE";

  if (requiresDb && (hasCodingTerms || isTimeSensitive)) {
    category = "MIXED_QUERY";
  } else if (requiresDb) {
    category = "CAMPUS_DATA";
  } else if (isTimeSensitive) {
    category = "CURRENT_INFORMATION";
  } else if (hasCodingTerms) {
    category = "CODING_HELP";
  } else if (isCasual && history.length <= 1) {
    category = "CASUAL_CONVERSATION";
  } else {
    category = "GENERAL_KNOWLEDGE";
  }

  const cleanSearchKeywords = query
    .replace(/who is|what is|tell me|latest|current|today|recent|show me|explain/gi, "")
    .trim();

  return {
    category,
    isCurrentInfo: isTimeSensitive,
    requiresDb,
    entitiesNeeded: Array.from(new Set(entitiesNeeded)),
    cleanSearchKeywords: cleanSearchKeywords || query,
  };
}
