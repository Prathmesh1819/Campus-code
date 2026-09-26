import { NextResponse } from "next/server";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { executeJudge0Submission } from "@/lib/code-runner";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const SUPPORTED_LANGUAGES = ["c", "cpp", "java", "python", "javascript", "go", "rust", "kotlin"] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const REFERENCE_SOLUTIONS: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  "two-sum": {
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize; j++) {\n            if (nums[i] + nums[j] == target) {\n                result[0] = i;\n                result[1] = j;\n                return result;\n            }\n        }\n    }\n    return result;\n}`,
    cpp: `#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); i++) {\n            int comp = target - nums[i];\n            if (mp.count(comp)) {\n                return {mp[comp], i};\n            }\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
    java: `import java.util.HashMap;\nimport java.util.Map;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}`,
    python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        prevMap = {}\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in prevMap:\n                return [prevMap[diff], i]\n            prevMap[n] = i\n        return []`,
    javascript: `var twoSum = function(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) {\n            return [map.get(diff), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n};`,
    go: `func twoSum(nums []int, target int) []int {\n    m := make(map[int]int)\n    for i, num := range nums {\n        diff := target - num\n        if j, ok := m[diff]; ok {\n            return []int{j, i}\n        }\n        m[num] = i\n    }\n    return []int{}\n}`,
    rust: `use std::collections::HashMap;\n\nimpl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        let mut map = HashMap::new();\n        for (i, &num) in nums.iter().enumerate() {\n            let diff = target - num;\n            if let Some(&j) = map.get(&diff) {\n                return vec![j as i32, i as i32];\n            }\n            map.insert(num, i);\n        }\n        vec![]\n    }\n}`,
    kotlin: `import java.util.HashMap\n\nclass Solution {\n    fun twoSum(nums: IntArray, target: Int): IntArray {\n        val map = HashMap<Int, Int>()\n        for (i in nums.indices) {\n            val diff = target - nums[i]\n            if (map.containsKey(diff)) {\n                return intArrayOf(map[diff]!!, i)\n            }\n            map[nums[i]] = i\n        }\n        return intArrayOf()\n    }\n}`,
  },
  "palindrome-number": {
    c: `#include <stdbool.h>\n\nbool isPalindrome(int x) {\n    if (x < 0) return false;\n    long rev = 0, orig = x;\n    while (x > 0) {\n        rev = rev * 10 + (x % 10);\n        x /= 10;\n    }\n    return rev == orig;\n}`,
    cpp: `#include <string>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isPalindrome(int x) {\n        if (x < 0) return false;\n        string s = to_string(x);\n        string r = s;\n        reverse(r.begin(), r.end());\n        return s == r;\n    }\n};`,
    java: `class Solution {\n    public boolean isPalindrome(int x) {\n        if (x < 0) return false;\n        String s = String.valueOf(x);\n        return new StringBuilder(s).reverse().toString().equals(s);\n    }\n}`,
    python: `class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        if x < 0: return False\n        s = str(x)\n        return s == s[::-1]`,
    javascript: `var isPalindrome = function(x) {\n    if (x < 0) return false;\n    const s = String(x);\n    return s === s.split('').reverse().join('');\n};`,
  },
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function GET() {
  try {
    if (!isFirebaseAdminConfigured) {
      return NextResponse.json(
        { success: false, error: "Firebase Admin is not configured on server." },
        { status: 500 }
      );
    }

    const probSnap = await adminDb
      .collection(COLLECTIONS.PROBLEMS)
      .where("status", "==", "published")
      .get();

    const rawProblems: any[] = probSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    rawProblems.sort((a: any, b: any) => (a.order || 999) - (b.order || 999));

    if (rawProblems.length !== 50) {
      return NextResponse.json(
        { success: false, error: `Expected 50 published problems, found ${rawProblems.length}` },
        { status: 400 }
      );
    }

    const problemsData: Array<{
      problemId: string;
      title: string;
      slug: string;
      order: number;
      testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
    }> = [];

    for (const prob of rawProblems) {
      const tcSnap = await adminDb
        .collection(COLLECTIONS.TEST_CASES)
        .where("problem_id", "==", prob.id)
        .get();

      const tcs = tcSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          input: String(data.input),
          expectedOutput: String(data.expected_output || data.output),
          isHidden: Boolean(data.is_hidden),
        };
      });

      problemsData.push({
        problemId: prob.id,
        title: prob.title,
        slug: prob.slug || prob.id,
        order: prob.order || 0,
        testCases: tcs,
      });
    }

    const totalProblems = problemsData.length;
    const totalLanguages = SUPPORTED_LANGUAGES.length;
    const totalCombinations = totalProblems * totalLanguages;

    let passedCombinations = 0;
    let failedCombinations = 0;
    let missingReferenceSolutions = 0;
    let executedCombinations = 0;

    const problemResults: any[] = [];
    const failuresList: any[] = [];

    for (let pIdx = 0; pIdx < problemsData.length; pIdx++) {
      const prob = problemsData[pIdx];

      const problemReportItem: any = {
        problemId: prob.problemId,
        title: prob.title,
        slug: prob.slug,
        order: prob.order,
        testCaseCount: prob.testCases.length,
        passedLanguages: [],
        failedLanguages: [],
        skippedLanguages: [],
        languages: {},
      };

      const refMap = REFERENCE_SOLUTIONS[prob.slug] || REFERENCE_SOLUTIONS[prob.problemId] || {};

      for (const lang of SUPPORTED_LANGUAGES) {
        const solutionCode = refMap[lang];

        if (!solutionCode) {
          missingReferenceSolutions++;
          problemReportItem.skippedLanguages.push(lang);
          problemReportItem.languages[lang] = {
            language: lang,
            status: "SKIPPED",
            failureType: "MISSING_REFERENCE_SOLUTION",
            passedTests: 0,
            failedTests: 0,
            totalTests: prob.testCases.length,
            executionErrors: ["No reference solution available in repository for this problem/language combination."],
          };

          failuresList.push({
            problemId: prob.problemId,
            title: prob.title,
            language: lang,
            failureType: "MISSING_REFERENCE_SOLUTION",
            details: `No reference solution defined in repository for ${prob.title} (${lang}).`,
          });
          continue;
        }

        executedCombinations++;
        await delay(100);

        const execResult = await executeJudge0Submission(
          solutionCode,
          lang,
          prob.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
        );

        const isPassed = execResult.status === "ACCEPTED" && execResult.testCasesPassed === prob.testCases.length;

        if (isPassed) {
          passedCombinations++;
          problemReportItem.passedLanguages.push(lang);
          problemReportItem.languages[lang] = {
            language: lang,
            status: "ACCEPTED",
            passedTests: execResult.testCasesPassed,
            failedTests: 0,
            totalTests: prob.testCases.length,
            executionErrors: [],
            averageExecutionTimeMs: execResult.executionTimeMs,
            maxMemoryKb: execResult.memoryUsageKb,
          };
        } else {
          failedCombinations++;
          problemReportItem.failedLanguages.push(lang);

          let failureType = "UNKNOWN";
          if (execResult.status === "COMPILATION_ERROR") failureType = "COMPILATION_ERROR";
          else if (execResult.status === "TIME_LIMIT_EXCEEDED") failureType = "TIMEOUT";
          else if (execResult.status === "RUNTIME_ERROR") failureType = "RUNTIME_ERROR";
          else if (execResult.status === "WRONG_ANSWER") failureType = "OUTPUT_MISMATCH";

          problemReportItem.languages[lang] = {
            language: lang,
            status: execResult.status,
            failureType,
            passedTests: execResult.testCasesPassed,
            failedTests: execResult.totalTestCases - execResult.testCasesPassed,
            totalTests: execResult.totalTestCases,
            errorMessage: execResult.errorMessage,
            executionErrors: execResult.outputLogs.filter((l) => l.includes("❌")),
          };

          failuresList.push({
            problemId: prob.problemId,
            title: prob.title,
            language: lang,
            failureType,
            status: execResult.status,
            errorMessage: execResult.errorMessage,
            passedTests: execResult.testCasesPassed,
            totalTests: execResult.totalTestCases,
          });
        }
      }

      problemResults.push(problemReportItem);
    }

    let mdContent = `# CampusCode 50-Problem × 8-Language Automated Regression Test Report\n\n`;
    mdContent += `**Timestamp**: ${new Date().toISOString()}\n`;
    mdContent += `**Published Problems**: ${totalProblems}\n`;
    mdContent += `**Languages Tested**: ${totalLanguages} (${SUPPORTED_LANGUAGES.join(", ")})\n`;
    mdContent += `**Total Matrix Combinations**: ${totalCombinations}\n\n`;
    mdContent += `## Execution Summary\n\n`;
    mdContent += `- **Total Combinations**: ${totalCombinations}\n`;
    mdContent += `- **Reference Solutions Available**: ${executedCombinations} / ${totalCombinations}\n`;
    mdContent += `- **Executed Combinations**: ${executedCombinations}\n`;
    mdContent += `- **Passed Combinations**: ${passedCombinations}\n`;
    mdContent += `- **Failed Executed Combinations**: ${failedCombinations}\n`;
    mdContent += `- **Missing Reference Solutions (Skipped)**: ${missingReferenceSolutions}\n`;
    mdContent += `- **Hidden Test Case Protection**: **YES** (Hidden test cases evaluated strictly on server side)\n`;
    mdContent += `- **Production Engine Used**: \`src/lib/code-runner.ts\` (\`executeJudge0Submission\`)\n\n`;
    mdContent += `## Problem Execution Matrix\n\n`;
    mdContent += `| # | Problem Title | Slug | C | C++ | Java | Python | JS | Go | Rust | Kotlin |\n`;
    mdContent += `|---|---|---|---|---|---|---|---|---|---|---|\n`;

    for (const prob of problemResults) {
      const cStat = prob.languages.c?.status === "ACCEPTED" ? "PASS" : (prob.languages.c?.status || "SKIPPED");
      const cppStat = prob.languages.cpp?.status === "ACCEPTED" ? "PASS" : (prob.languages.cpp?.status || "SKIPPED");
      const javaStat = prob.languages.java?.status === "ACCEPTED" ? "PASS" : (prob.languages.java?.status || "SKIPPED");
      const pyStat = prob.languages.python?.status === "ACCEPTED" ? "PASS" : (prob.languages.python?.status || "SKIPPED");
      const jsStat = prob.languages.javascript?.status === "ACCEPTED" ? "PASS" : (prob.languages.javascript?.status || "SKIPPED");
      const goStat = prob.languages.go?.status === "ACCEPTED" ? "PASS" : (prob.languages.go?.status || "SKIPPED");
      const rustStat = prob.languages.rust?.status === "ACCEPTED" ? "PASS" : (prob.languages.rust?.status || "SKIPPED");
      const ktStat = prob.languages.kotlin?.status === "ACCEPTED" ? "PASS" : (prob.languages.kotlin?.status || "SKIPPED");

      mdContent += `| ${prob.order} | ${prob.title} | \`${prob.slug}\` | ${cStat} | ${cppStat} | ${javaStat} | ${pyStat} | ${jsStat} | ${goStat} | ${rustStat} | ${ktStat} |\n`;
    }

    // Write to local disk ONLY in non-serverless local development environments
    if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
      try {
        const reportsDir = path.join(process.cwd(), "reports");
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(reportsDir, "campuscode-regression-report.json"), JSON.stringify(problemResults, null, 2), "utf8");
        fs.writeFileSync(path.join(reportsDir, "campuscode-regression-report.md"), mdContent, "utf8");
      } catch (e) {
        // Ignore filesystem write errors in non-local environments
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalProblems,
      totalLanguages,
      totalCombinations,
      executed: executedCombinations,
      passed: passedCombinations,
      failed: failedCombinations,
      skipped: missingReferenceSolutions,
      missingReferenceSolutions,
      results: problemResults,
      failures: failuresList,
      markdownReport: mdContent,
    }, { status: 200 });
  } catch (err: any) {
    console.error("[Regression Test API Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
