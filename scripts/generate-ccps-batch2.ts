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

const TOPICS_BATCH2 = [
  "Binary Search", "Sorting", "Prefix Sum", "Sliding Window",
  "Stack", "Queue", "Linked List", "Recursion", "Basic Greedy", "Hash Maps (Intermediate)"
];

const COMPANIES = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber", "Adobe", "Goldman Sachs", "Salesforce"];

function generate50Batch2Problems(): {
  problems: CCPSProblem[];
  starterCodes: any[];
  editorials: any[];
  hints: any[];
  testCases: any[];
  sampleCases: any[];
  problemTags: any[];
  problemCompanies: any[];
} {
  const problems: CCPSProblem[] = [];
  const starterCodes: any[] = [];
  const editorials: any[] = [];
  const hints: any[] = [];
  const testCases: any[] = [];
  const sampleCases: any[] = [];
  const problemTags: any[] = [];
  const problemCompanies: any[] = [];

  const titlesBatch2 = [
    "Campus Library Binary Search Locator", "Student Placement Salary Sorter", "Exam Prefix Score Accumulator", "Sliding Window Campus Wifi Usage",
    "Lab Equipment Borrow Stack", "Canteen Orders Processing Queue", "Student ID Linked List Reversal", "Recursive Factorial Event Counter",
    "Campus Energy Conservation Greedy", "Inter-College Debate Hash Search", "Binary Search Exam Roll Matcher", "QuickSort Placement Percentile Ranker",
    "Subarray Prefix Sum Balance", "Sliding Window Highest GPA Detector", "Syntax Parenthesis Checker Stack", "Printer Job Emergency Queue",
    "Linked List Middle Student Finder", "Recursive Fibonaccian Seating Arrangement", "Greedy Campus Festival Booth Allocator", "Hash Map Student Pair Matcher",
    "Binary Search Rotated Library Shelf", "MergeSort Grade Rank Sorting", "Prefix Sum Attendance Target Reach", "Max Sum Subarray Sliding Window",
    "Evaluate Reverse Polish Notation Stack", "Recent Student Logins Queue", "Cycle Detection in Student Referral List", "Recursive Tower of Brahma Placement Puzzle",
    "Greedy Activity Selector for Auditorium", "Hash Map Frequency Ranker", "Binary Search Matrix Seat Finder", "Custom TimSort Student Ranking",
    "2D Range Sum Query Matrix", "Longest Substring K Distinct Characters", "Monotonic Stack Next Greater Grade", "Circular Queue Hostel Gate Scanner",
    "Remove Nth Node Student Linked List", "Recursive Combination Generator", "Min Coins Campus Canteen Cashback", "Hash Map Anagram Student Names",
    "Binary Search Peak Score Finding", "Stable Sort Placement Applications", "Continuous Subarray Sum Prefix", "Sliding Window Fruit Collector",
    "Stock Span Calculator Stack", "Queue Reconstruction by Height", "Merge Two Sorted Student Lists", "Recursive Permutation Seating Arrangement",
    "Gas Station Loop Greedy Route", "Group Anagram Student Clubs Hash Map"
  ];

  for (let i = 51; i <= 100; i++) {
    const numStr = i < 100 ? `0${i}` : `${i}`;
    const ccpsId = `CC${numStr}`;
    const titleIdx = i - 51;
    const title = titlesBatch2[titleIdx] || `Campus Challenge Intermediate ${i}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const difficulty: "EASY" | "MEDIUM" | "HARD" = i <= 70 ? "EASY" : i <= 90 ? "MEDIUM" : "HARD";
    const category = TOPICS_BATCH2[titleIdx % TOPICS_BATCH2.length];
    const company = COMPANIES[titleIdx % COMPANIES.length];
    const uuid = `10000000-0000-4000-8000-${numStr.padStart(12, "0")}`;

    const problem: CCPSProblem = {
      id: uuid,
      ccps_id: ccpsId,
      title: `${ccpsId}: ${title}`,
      slug,
      difficulty,
      category,
      subcategory: `${category} Intermediate`,
      description: `At Sarhad College, compute the optimal configuration for **${title}**. Given $N$ input records, write an algorithm using ${category} to process student records efficiently.`,
      story: `Sarhad College's IT department is upgrading the campus automated systems. Help optimize the performance of ${title} using algorithmic techniques.`,
      input_format: `First line contains integer N. Second line contains N space-separated integers representing student metric values.`,
      output_format: `Print the target calculated output matching specifications.`,
      constraints: `1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9`,
      examples: [
        {
          input: "5\n1 3 5 7 9\n5",
          output: "2",
          explanation: "Element 5 is found at index 2."
        },
        {
          input: "4\n10 20 30 40\n25",
          output: "-1",
          explanation: "Element 25 is not present in the array."
        }
      ],
      time_limit_ms: 2000,
      memory_limit_mb: 256,
      acceptance_rate: Math.round(50 + (i % 38)),
      rating: 1350 + (i - 50) * 15,
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
      { id: `tc-${ccpsId}-1`, problem_id: uuid, input: "5\n1 3 5 7 9\n5", expected_output: "2", is_hidden: false },
      { id: `tc-${ccpsId}-2`, problem_id: uuid, input: "4\n10 20 30 40\n25", expected_output: "-1", is_hidden: false },
      { id: `tc-${ccpsId}-3`, problem_id: uuid, input: "6\n2 4 6 8 10 12\n8", expected_output: "3", is_hidden: true },
      { id: `tc-${ccpsId}-4`, problem_id: uuid, input: "1\n100\n100", expected_output: "0", is_hidden: true }
    );

    // Sample Cases
    sampleCases.push(
      {
        id: `sample-${ccpsId}-1`,
        problem_id: uuid,
        input: "5\n1 3 5 7 9\n5",
        output: "2",
        explanation: "Element 5 is located at zero-based index 2."
      },
      {
        id: `sample-${ccpsId}-2`,
        problem_id: uuid,
        input: "4\n10 20 30 40\n25",
        output: "-1",
        explanation: "Element 25 is not present."
      }
    );

    // Hints
    hints.push({
      id: `hint-${ccpsId}`,
      problem_id: uuid,
      hint_1: `Consider applying the ${category} technique.`,
      hint_2: "Identify edge conditions such as single-element inputs or missing targets.",
      hint_3: "Optimize time complexity to stay within $O(N \\log N)$ or $O(N)$.",
    });

    // Editorials
    editorials.push({
      id: `ed-${ccpsId}`,
      problem_id: uuid,
      content: `### Solution Editorial for ${ccpsId}: ${title}\n\n#### Optimal Approach: ${category}\nUtilize ${category} to process inputs in optimal time.\n\n#### Complexity Analysis:\n- **Time Complexity**: $O(N)$ or $O(\\log N)$\n- **Space Complexity**: $O(1)$ or $O(N)$`,
    });

    // Tags & Companies
    problemTags.push({ problem_id: uuid, tag: category });
    problemCompanies.push({ problem_id: uuid, company: company });
  }

  return { problems, starterCodes, editorials, hints, testCases, sampleCases, problemTags, problemCompanies };
}

function getStarterTemplate(lang: string, title: string): string {
  switch (lang) {
    case "java":
      return `// CampusCode ${title}\nimport java.util.*;\n\npublic class Solution {\n    public int solve(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}`;
    case "cpp":
      return `// CampusCode ${title}\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve(vector<int>& nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n};`;
    case "python":
      return `# CampusCode ${title}\nclass Solution:\n    def solve(self, nums: list[int], target: int) -> int:\n        # Write your solution here\n        return -1`;
    case "javascript":
      return `// CampusCode ${title}\nfunction solve(nums, target) {\n    // Write your solution here\n    return -1;\n}`;
    case "c":
      return `// CampusCode ${title}\n#include <stdio.h>\n\nint solve(int* nums, int numsSize, int target) {\n    return -1;\n}`;
    case "go":
      return `// CampusCode ${title}\npackage main\n\nfunc solve(nums []int, target int) int {\n    return -1\n}`;
    case "rust":
      return `// CampusCode ${title}\nimpl Solution {\n    pub fn solve(nums: Vec<i32>, target: i32) -> i32 {\n        -1\n    }\n}`;
    case "kotlin":
      return `// CampusCode ${title}\nclass Solution {\n    fun solve(nums: IntArray, target: Int): Int {\n        return -1\n    }\n}`;
    default:
      return `// CampusCode ${title}`;
  }
}

// Read existing Batch 1 data files and append Batch 2
const ccpsDir = path.join(process.cwd(), "src", "data", "ccps");

const existingProblems = JSON.parse(fs.readFileSync(path.join(ccpsDir, "problems.json"), "utf8"));
const existingStarterCodes = JSON.parse(fs.readFileSync(path.join(ccpsDir, "starter_codes.json"), "utf8"));
const existingEditorials = JSON.parse(fs.readFileSync(path.join(ccpsDir, "editorials.json"), "utf8"));
const existingHints = JSON.parse(fs.readFileSync(path.join(ccpsDir, "hints.json"), "utf8"));
const existingTestCases = JSON.parse(fs.readFileSync(path.join(ccpsDir, "test_cases.json"), "utf8"));
const existingSampleCases = JSON.parse(fs.readFileSync(path.join(ccpsDir, "sample_cases.json"), "utf8"));
const existingTags = JSON.parse(fs.readFileSync(path.join(ccpsDir, "problem_tags.json"), "utf8"));
const existingCompanies = JSON.parse(fs.readFileSync(path.join(ccpsDir, "problem_companies.json"), "utf8"));

const batch2 = generate50Batch2Problems();

const mergedProblems = [...existingProblems, ...batch2.problems];
const mergedStarterCodes = [...existingStarterCodes, ...batch2.starterCodes];
const mergedEditorials = [...existingEditorials, ...batch2.editorials];
const mergedHints = [...existingHints, ...batch2.hints];
const mergedTestCases = [...existingTestCases, ...batch2.testCases];
const mergedSampleCases = [...existingSampleCases, ...batch2.sampleCases];
const mergedTags = [...existingTags, ...batch2.problemTags];
const mergedCompanies = [...existingCompanies, ...batch2.problemCompanies];

fs.writeFileSync(path.join(ccpsDir, "problems.json"), JSON.stringify(mergedProblems, null, 2));
fs.writeFileSync(path.join(ccpsDir, "starter_codes.json"), JSON.stringify(mergedStarterCodes, null, 2));
fs.writeFileSync(path.join(ccpsDir, "editorials.json"), JSON.stringify(mergedEditorials, null, 2));
fs.writeFileSync(path.join(ccpsDir, "hints.json"), JSON.stringify(mergedHints, null, 2));
fs.writeFileSync(path.join(ccpsDir, "test_cases.json"), JSON.stringify(mergedTestCases, null, 2));
fs.writeFileSync(path.join(ccpsDir, "sample_cases.json"), JSON.stringify(mergedSampleCases, null, 2));
fs.writeFileSync(path.join(ccpsDir, "problem_tags.json"), JSON.stringify(mergedTags, null, 2));
fs.writeFileSync(path.join(ccpsDir, "problem_companies.json"), JSON.stringify(mergedCompanies, null, 2));

// Write Batch 2 SQL Migration
let sql = `-- CampusCode Original Problem Set (CCPS v1.0) - Batch 2 (CC051 - CC100)\n\n`;

batch2.problems.forEach((p) => {
  sql += `INSERT INTO public.problems (id, title, slug, difficulty, description, constraints, status) VALUES ('${p.id}', '${p.title.replace(/'/g, "''")}', '${p.slug}', '${p.difficulty}', '${p.description.replace(/'/g, "''")}', '${p.constraints}', 'published') ON CONFLICT (id) DO NOTHING;\n`;
});

fs.writeFileSync(path.join(process.cwd(), "supabase", "migrations", "seed_ccps_batch2.sql"), sql);

console.log("✔ CCPS Batch 2 (CC051-CC100) successfully generated and merged! Total problems: " + mergedProblems.length);
