import { adminDb, isFirebaseAdminConfigured } from "../src/lib/firebase/admin";
import { COLLECTIONS } from "../src/lib/firebase/firestore";
import fs from "fs";
import path from "path";

function formatStarterCodes(probTitle: string, probSlug: string) {
  const methodCamel = probSlug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const methodSnake = probSlug.replace(/-/g, "_");
  return [
    {
      language: "c",
      language_id: "50",
      starter_code: `#include <stdio.h>\n#include <stdlib.h>\n\n/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* ${methodCamel}(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    // Write your solution here\n    return result;\n}`,
    },
    {
      language: "cpp",
      language_id: "54",
      starter_code: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> ${methodCamel}(vector<int>& nums, int target) {\n        // Write your solution here\n        return {};\n    }\n};`,
    },
    {
      language: "java",
      language_id: "62",
      starter_code: `import java.util.*;\n\nclass Solution {\n    public int[] ${methodCamel}(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
    },
    {
      language: "python",
      language_id: "92",
      starter_code: `class Solution:\n    def ${methodCamel}(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass`,
    },
    {
      language: "javascript",
      language_id: "63",
      starter_code: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar ${methodCamel} = function(nums, target) {\n    // Write your solution here\n    return [];\n};`,
    },
    {
      language: "go",
      language_id: "60",
      starter_code: `func ${methodCamel}(nums []int, target int) []int {\n    // Write your solution here\n    return []int{}\n}`,
    },
    {
      language: "rust",
      language_id: "73",
      starter_code: `impl Solution {\n    pub fn ${methodSnake}(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        // Write your solution here\n        vec![]\n    }\n}`,
    },
    {
      language: "kotlin",
      language_id: "78",
      starter_code: `class Solution {\n    fun ${methodCamel}(nums: IntArray, target: Int): IntArray {\n        // Write your solution here\n        return intArrayOf()\n    }\n}`,
    },
  ];
}

async function seedProblems() {
  console.log("=== CampusCode Problem Data Seeding Utility ===");

  if (!isFirebaseAdminConfigured) {
    console.error("FATAL: Firebase Admin is not configured.");
    process.exit(1);
  }

  let publishedCount = 0;
  let archivedCount = 0;
  let publicTcCount = 0;
  let hiddenTcCount = 0;

  // 1. Seed 50 Canonical Published Problems
  const pdfPath = path.join(process.cwd(), "prisma/canonical_50_pdf_dataset.json");
  if (!fs.existsSync(pdfPath)) {
    console.error("FATAL: Dataset file prisma/canonical_50_pdf_dataset.json not found.");
    process.exit(1);
  }

  const pdfQuestions = JSON.parse(fs.readFileSync(pdfPath, "utf8"));
  console.log(`Loading ${pdfQuestions.length} published canonical problems...`);

  for (let i = 0; i < pdfQuestions.length; i++) {
    const item = pdfQuestions[i];
    const probId = `problem-published-${i + 1}`;
    const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const examples = (item.testCases || [])
      .filter((tc: any, idx: number) => !tc.isHidden || idx < 2)
      .map((tc: any, exIdx: number) => ({
        id: `example-${probId}-${exIdx + 1}`,
        example_number: exIdx + 1,
        input: String(tc.input),
        output: String(tc.expected),
        explanation: "Canonical test case example",
      }));

    const problemObj = {
      id: probId,
      order: item.order || i + 1,
      title: item.title,
      slug: slug,
      difficulty: (item.difficulty || "MEDIUM").toUpperCase(),
      category: item.category || "DSA",
      description: item.description,
      constraints: item.constraints || "See problem statement for constraints.",
      acceptance_rate: 65.5,
      status: "published",
      examples: examples,
      starter_codes: formatStarterCodes(item.title, slug),
      companyTags: ["Google", "Amazon", "Meta", "Microsoft", "Apple"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await adminDb.collection(COLLECTIONS.PROBLEMS).doc(probId).set(problemObj, { merge: true });
    publishedCount++;

    const testCases = item.testCases || [];
    for (let j = 0; j < testCases.length; j++) {
      const tc = testCases[j];
      const tcId = `tc-${probId}-${j + 1}`;
      const isHidden = tc.isHidden !== undefined ? Boolean(tc.isHidden) : j > 1;

      if (isHidden) hiddenTcCount++;
      else publicTcCount++;

      await adminDb.collection(COLLECTIONS.TEST_CASES).doc(tcId).set(
        {
          id: tcId,
          problem_id: probId,
          input: String(tc.input),
          expected_output: String(tc.expected),
          is_hidden: isHidden,
          weight: 1,
          execution_order: j + 1,
          created_at: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  }

  // 2. Seed 87 Archived Problems
  const ccpsPath = path.join(process.cwd(), "prisma/ccps_problems.json");
  if (fs.existsSync(ccpsPath)) {
    const ccpsQuestions = JSON.parse(fs.readFileSync(ccpsPath, "utf8"));
    const archivedLimit = Math.min(87, ccpsQuestions.length);
    console.log(`Loading ${archivedLimit} archived CCPS problems...`);

    for (let i = 0; i < archivedLimit; i++) {
      const item = ccpsQuestions[i];
      const probId = `problem-archived-${i + 1}`;
      const slug = item.slug || `archived-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

      const problemObj = {
        id: probId,
        order: 50 + i + 1,
        title: item.title,
        slug: slug,
        difficulty: (item.difficulty || "EASY").toUpperCase(),
        category: item.category || "General",
        description: item.description,
        constraints: item.constraints || "Standard constraints apply.",
        acceptance_rate: item.acceptance_rate || 50.0,
        status: "archived",
        examples: item.examples || [],
        starter_codes: formatStarterCodes(item.title, slug),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await adminDb.collection(COLLECTIONS.PROBLEMS).doc(probId).set(problemObj, { merge: true });
      archivedCount++;
    }
  }

  console.log("\n=== Seeding Summary ===");
  console.log(`Published Problems: ${publishedCount}`);
  console.log(`Archived Problems: ${archivedCount}`);
  console.log(`Public Test Cases: ${publicTcCount}`);
  console.log(`Hidden Test Cases: ${hiddenTcCount}`);
  console.log(`Total Problems: ${publishedCount + archivedCount}`);
  console.log(`Total Test Cases: ${publicTcCount + hiddenTcCount}`);
  console.log("Status: SEEDING_COMPLETE 🚀");
}

seedProblems().catch((err) => {
  console.error("FATAL Seeding Exception:", err);
  process.exit(1);
});
