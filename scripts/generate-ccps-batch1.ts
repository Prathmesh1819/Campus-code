import fs from "fs";
import path from "path";

export interface CCPSProblem {
  id: string;
  ccps_id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
  subcategory: string;
  description: string;
  story: string;
  input_format: string;
  output_format: string;
  constraints: string;
  examples: any[];
  time_limit_ms: number;
  memory_limit_mb: number;
  acceptance_rate: number;
  rating: number;
}

const TOPICS = [
  "Arrays", "Strings", "Hash Maps", "Two Pointers", "Sliding Window",
  "Binary Search", "Sorting", "Greedy", "Stack", "Queue",
  "Linked List", "Trees", "Binary Search Trees", "Heap", "Trie",
  "Graphs", "BFS", "DFS", "Dynamic Programming", "Math"
];

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Adobe", "Goldman Sachs", "Salesforce"];

function generate50Batch1Problems(): {
  problems: CCPSProblem[];
  starterCodes: any[];
  editorials: any[];
  hints: any[];
  testCases: any[];
  sampleCases: any[];
  problemTags: any[];
  problemCompanies: any[];
  roadmaps: any[];
} {
  const problems: CCPSProblem[] = [];
  const starterCodes: any[] = [];
  const editorials: any[] = [];
  const hints: any[] = [];
  const testCases: any[] = [];
  const sampleCases: any[] = [];
  const problemTags: any[] = [];
  const problemCompanies: any[] = [];

  const titles = [
    "Campus Cafeteria Billing System", "Library Book Stacking Order", "Campus Bus Seat Reservation", "Student ID Hash Verifier",
    "Hostel Room Allocation Preference", "Semester GPA Percentile Ranker", "Exam Hall Seating Plan", "Campus Wi-Fi Bandwidth Balancer",
    "Placement Offer Salary Sorter", "Lab Equipment Inventory Check", "College Event Ticket Reservation", "Department Library Catalog Search",
    "Student Attendance Streak Counter", "Canteen Discount Combo Finder", "Classroom Projector Assignment", "Campus Shuttle Frequency Analyzer",
    "Sports Meet Medals Tally", "Coding Club Pair Programming Matching", "Campus Gate Entry Logging", "Faculty Lecture Slot Scheduler",
    "Library Overdue Fine Calculator", "Student Project Repository Search", "Campus Canteen Token Dispenser", "Hostel Laundry Machine Queue",
    "College Fest Main Stage Schedule", "Robotics Club Component Inventory", "Placement Resume Keyword Scanner", "Alumni Donation Target Tracker",
    "Campus Cafeteria Calorie Meter", "Student Grade Point Boundary Calculator", "Library Rare Books Access Audit", "Campus Bus Route Optimization",
    "Hostel Mess Weekly Menu Planner", "Semester Exam Retake Fee Calculator", "Student Hackathon Team Builder", "Campus Parking Slot Allocator",
    "Department HOD Notice Distribution", "College Library Card Renewal Check", "Student Gym Equipment Reservation", "Campus Green Energy Monitor",
    "placement Mock Interview Slotting", "Student Transcript GPA Averager", "College Magazine Article Review", "Hostel Visitor Entry Timestamp Audit",
    "Campus Shuttle Battery Charging Schedule", "Library Computer Lab Seat Booking", "Student Club Budget Expense Tracker", "Campus Auditorium Light Show Cue",
    "Placement Drive Aptitude Test Timer", "Campus Code Official Leaderboard Refresh"
  ];

  for (let i = 1; i <= 50; i++) {
    const numStr = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
    const ccpsId = `CC${numStr}`;
    const title = titles[i - 1] || `Campus Challenge Problem ${i}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const difficulty: "EASY" | "MEDIUM" | "HARD" = i <= 25 ? "EASY" : i <= 40 ? "MEDIUM" : "HARD";
    const category = TOPICS[(i - 1) % TOPICS.length];
    const company = COMPANIES[(i - 1) % COMPANIES.length];
    const uuid = `10000000-0000-4000-8000-${numStr.padStart(12, "0")}`;

    const problem: CCPSProblem = {
      id: uuid,
      ccps_id: ccpsId,
      title: `${ccpsId}: ${title}`,
      slug,
      difficulty,
      category,
      subcategory: `${category} Fundamentals`,
      description: `In Sarhad College Campus, the administration requires an automated solution to solve **${title}** efficiently. Given an array of student activity records, calculate the optimal configuration.`,
      story: `Every semester at Sarhad College, hundreds of students participate in campus events. To ensure seamless operation, solve the core computing challenge behind ${title}.`,
      input_format: `First line contains integer N (number of records). Second line contains N space-separated integers representing items/scores.`,
      output_format: `Print the target value or index array as specified in problem constraints.`,
      constraints: `1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9`,
      examples: [
        {
          input: "4\n2 7 11 15\n9",
          output: "[0, 1]",
          explanation: "Elements at index 0 (2) and index 1 (7) sum up to target 9."
        }
      ],
      time_limit_ms: 2000,
      memory_limit_mb: 256,
      acceptance_rate: Math.round(55 + (i % 35)),
      rating: 1200 + i * 15,
    };

    problems.push(problem);

    // Starter Codes (8 languages)
    const langs = ["c", "cpp", "java", "javascript", "python", "go", "rust", "kotlin"];
    langs.forEach((lang) => {
      starterCodes.push({
        id: `sc-${ccpsId}-${lang}`,
        problem_id: uuid,
        language: lang,
        code_template: getStarterTemplate(lang, title),
      });
    });

    // Test Cases
    testCases.push(
      { id: `tc-${ccpsId}-1`, problem_id: uuid, input: "4\n2 7 11 15\n9", expected_output: "[0, 1]", is_hidden: false },
      { id: `tc-${ccpsId}-2`, problem_id: uuid, input: "3\n3 2 4\n6", expected_output: "[1, 2]", is_hidden: false },
      { id: `tc-${ccpsId}-3`, problem_id: uuid, input: "2\n3 3\n6", expected_output: "[0, 1]", is_hidden: true },
      { id: `tc-${ccpsId}-4`, problem_id: uuid, input: "5\n1 5 3 7 9\n12", expected_output: "[2, 4]", is_hidden: true }
    );

    // Sample Cases
    sampleCases.push({
      id: `sample-${ccpsId}`,
      problem_id: uuid,
      input: "4\n2 7 11 15\n9",
      output: "[0, 1]",
      explanation: "Sum of elements at indices 0 and 1 equals target 9."
    });

    // Hints
    hints.push({
      id: `hint-${ccpsId}`,
      problem_id: uuid,
      hint_1: "Consider using a Hash Map to store elements as you iterate.",
      hint_2: "For each element A[i], check if (target - A[i]) already exists in the map.",
      hint_3: "If found, return indices [map.get(target - A[i]), i].",
    });

    // Editorials
    editorials.push({
      id: `ed-${ccpsId}`,
      problem_id: uuid,
      content: `### Solution Editorial for ${ccpsId}: ${title}\n\n#### Approach: Hash Map Optimization\nInstead of checking all pairs using an $O(N^2)$ nested loop, use a Hash Map to achieve $O(N)$ time complexity.\n\n#### Complexity Analysis:\n- **Time Complexity**: $O(N)$\n- **Space Complexity**: $O(N)$`,
    });

    // Tags & Companies
    problemTags.push({ problem_id: uuid, tag: category });
    problemCompanies.push({ problem_id: uuid, company: company });
  }

  const roadmaps = [
    { title: "DSA Beginner Roadmap", problems: problems.slice(0, 15).map(p => p.ccps_id) },
    { title: "Arrays & Hash Maps Mastery", problems: problems.slice(15, 30).map(p => p.ccps_id) },
    { title: "CampusCode Top Interview 150", problems: problems.map(p => p.ccps_id) }
  ];

  return { problems, starterCodes, editorials, hints, testCases, sampleCases, problemTags, problemCompanies, roadmaps };
}

function getStarterTemplate(lang: string, title: string): string {
  switch (lang) {
    case "java":
      return `// CampusCode ${title}\nimport java.util.*;\n\npublic class Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`;
    case "cpp":
      return `// CampusCode ${title}\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};`;
    case "python":
      return `# CampusCode ${title}\nclass Solution:\n    def solve(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        return []`;
    case "javascript":
      return `// CampusCode ${title}\nfunction solve(nums, target) {\n    // Write your solution here\n    return [];\n}`;
    case "c":
      return `// CampusCode ${title}\n#include <stdio.h>\n#include <stdlib.h>\n\nint* solve(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    return result;\n}`;
    case "go":
      return `// CampusCode ${title}\npackage main\n\nfunc solve(nums []int, target int) []int {\n    return []int{}\n}`;
    case "rust":
      return `// CampusCode ${title}\nimpl Solution {\n    pub fn solve(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        vec![]\n    }\n}`;
    case "kotlin":
      return `// CampusCode ${title}\nclass Solution {\n    fun solve(nums: IntArray, target: Int): IntArray {\n        return intArrayOf()\n    }\n}`;
    default:
      return `// CampusCode ${title}`;
  }
}

// Generate Data Files
const ccpsDir = path.join(process.cwd(), "src", "data", "ccps");
if (!fs.existsSync(ccpsDir)) {
  fs.mkdirSync(ccpsDir, { recursive: true });
}

const batch1 = generate50Batch1Problems();

fs.writeFileSync(path.join(ccpsDir, "problems.json"), JSON.stringify(batch1.problems, null, 2));
fs.writeFileSync(path.join(ccpsDir, "starter_codes.json"), JSON.stringify(batch1.starterCodes, null, 2));
fs.writeFileSync(path.join(ccpsDir, "editorials.json"), JSON.stringify(batch1.editorials, null, 2));
fs.writeFileSync(path.join(ccpsDir, "hints.json"), JSON.stringify(batch1.hints, null, 2));
fs.writeFileSync(path.join(ccpsDir, "test_cases.json"), JSON.stringify(batch1.testCases, null, 2));
fs.writeFileSync(path.join(ccpsDir, "sample_cases.json"), JSON.stringify(batch1.sampleCases, null, 2));
fs.writeFileSync(path.join(ccpsDir, "problem_tags.json"), JSON.stringify(batch1.problemTags, null, 2));
fs.writeFileSync(path.join(ccpsDir, "problem_companies.json"), JSON.stringify(batch1.problemCompanies, null, 2));
fs.writeFileSync(path.join(ccpsDir, "roadmaps.json"), JSON.stringify(batch1.roadmaps, null, 2));

// Generate Supabase SQL seed migration file
let sql = `-- CampusCode Original Problem Set (CCPS v1.0) - Batch 1 (CC001 - CC050)\n\n`;

batch1.problems.forEach((p) => {
  sql += `INSERT INTO public.problems (id, title, slug, difficulty, description, constraints, status) VALUES ('${p.id}', '${p.title.replace(/'/g, "''")}', '${p.slug}', '${p.difficulty}', '${p.description.replace(/'/g, "''")}', '${p.constraints}', 'published') ON CONFLICT (id) DO NOTHING;\n`;
});

fs.writeFileSync(path.join(process.cwd(), "supabase", "migrations", "seed_ccps_batch1.sql"), sql);

console.log("✔ CCPS Batch 1 (CC001-CC050) successfully generated in src/data/ccps/ and seed_ccps_batch1.sql!");
