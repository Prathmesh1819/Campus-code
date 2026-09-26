import { NextResponse } from "next/server";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    if (!isFirebaseAdminConfigured) {
      return NextResponse.json(
        { success: false, error: "Firebase Admin is not configured on server." },
        { status: 500 }
      );
    }

    const report = {
      timestamp: new Date().toISOString(),
      sourceFiles: [
        "prisma/canonical_50_pdf_dataset.json",
        "prisma/ccps_problems.json",
      ],
      publishedProblemsCount: 0,
      archivedProblemsCount: 0,
      publicTestCasesCount: 0,
      hiddenTestCasesCount: 0,
      totalTestCasesCount: 0,
      totalProblemsCount: 0,
      status: "PENDING",
    };

    // 1. Load Canonical 50 Published Problems
    const pdfPath = path.join(process.cwd(), "prisma/canonical_50_pdf_dataset.json");
    let pdfQuestions: any[] = [];
    if (fs.existsSync(pdfPath)) {
      pdfQuestions = JSON.parse(fs.readFileSync(pdfPath, "utf8"));
    }

    const problemPromises: Promise<any>[] = [];
    const testCasePromises: Promise<any>[] = [];

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

      problemPromises.push(adminDb.collection(COLLECTIONS.PROBLEMS).doc(probId).set(problemObj, { merge: true }));
      report.publishedProblemsCount++;
      report.totalProblemsCount++;

      // Seed Test Cases
      const testCases = item.testCases || [];
      for (let j = 0; j < testCases.length; j++) {
        const tc = testCases[j];
        const tcId = `tc-${probId}-${j + 1}`;
        const isHidden = tc.isHidden !== undefined ? Boolean(tc.isHidden) : j > 1;

        if (isHidden) report.hiddenTestCasesCount++;
        else report.publicTestCasesCount++;
        report.totalTestCasesCount++;

        testCasePromises.push(
          adminDb.collection(COLLECTIONS.TEST_CASES).doc(tcId).set(
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
          )
        );
      }
    }

    // 2. Load 87 Archived Problems
    const ccpsPath = path.join(process.cwd(), "prisma/ccps_problems.json");
    let ccpsQuestions: any[] = [];
    if (fs.existsSync(ccpsPath)) {
      ccpsQuestions = JSON.parse(fs.readFileSync(ccpsPath, "utf8"));
    }

    const archivedLimit = Math.min(87, ccpsQuestions.length);
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

      problemPromises.push(adminDb.collection(COLLECTIONS.PROBLEMS).doc(probId).set(problemObj, { merge: true }));
      report.archivedProblemsCount++;
      report.totalProblemsCount++;
    }

    // Execute in parallel batches
    await Promise.all(problemPromises);
    await Promise.all(testCasePromises);

    report.status = "SUCCESS";
    return NextResponse.json(report, { status: 200 });
  } catch (err: any) {
    console.error("[Seed Problems API Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
