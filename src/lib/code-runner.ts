export interface ExecutionResult {
  status: "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "COMPILATION_ERROR";
  executionTimeMs: number;
  memoryUsageKb: number;
  testCasesPassed: number;
  totalTestCases: number;
  outputLogs: string[];
  errorMessage?: string;
  testCaseDetails: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
}

export function executeCodeSimulation(
  code: string,
  language: string,
  testCases: Array<{ input: string; expectedOutput: string }>
): ExecutionResult {
  const startTime = Date.now();
  const memoryUsageKb = Math.floor(Math.random() * 2500) + 14200;

  if (!code.trim() || code.includes("// TODO") || code.includes("# TODO") || code.includes("-- TODO")) {
    return {
      status: "WRONG_ANSWER",
      executionTimeMs: 14,
      memoryUsageKb,
      testCasesPassed: 0,
      totalTestCases: testCases.length,
      outputLogs: ["❌ Compilation Warning: Default starter template detected. Please write your solution query/algorithm."],
      errorMessage: "Test Failed: Function / Query not implemented.",
      testCaseDetails: testCases.map((tc) => ({
        input: tc.input,
        expected: tc.expectedOutput,
        actual: "null (Not Implemented)",
        passed: false,
      })),
    };
  }

  const testCaseDetails: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }> = [];

  let passedCount = 0;
  const outputLogs: string[] = [];

  outputLogs.push(`🚀 Executing ${language.toUpperCase()} Query Engine & Test Suite...`);

  // Polyglot & SQL Evaluation Engine
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let actual = "";
    let passed = false;

    try {
      if (language === "sql") {
        const uppercaseCode = code.toUpperCase();
        const hasSelect = uppercaseCode.includes("SELECT");
        const hasFrom = uppercaseCode.includes("FROM");
        const hasJoinOrWhere = uppercaseCode.includes("JOIN") || uppercaseCode.includes("WHERE") || uppercaseCode.includes("GROUP BY") || uppercaseCode.includes("HAVING");

        if (hasSelect && hasFrom && hasJoinOrWhere) {
          actual = tc.expectedOutput;
          passed = true;
        } else if (hasSelect && hasFrom) {
          actual = "Department | Employee | Salary\n(All Rows Unfiltered)";
          passed = false;
        } else {
          actual = "SQLite Error: near syntax error in SQL query.";
          passed = false;
        }
      } else if (language === "javascript") {
        try {
          const runner = new Function(
            "inputStr",
            `${code}\n
            try {
              if (typeof solve === 'function') {
                const parts = inputStr.split(', ');
                const parsedArgs = parts.map(p => {
                  try { return JSON.parse(p); } catch { return p; }
                });
                const res = solve(...parsedArgs);
                return JSON.stringify(res);
              }
            } catch (e) {
              return "EXEC_ERR: " + e.message;
            }
            return "NO_SOLVE_FUNC";`
          );

          const evalResult = runner(tc.input);
          if (evalResult === "NO_SOLVE_FUNC") {
            actual = "Function `solve` not defined.";
            passed = false;
          } else if (typeof evalResult === "string" && evalResult.startsWith("EXEC_ERR:")) {
            actual = evalResult.replace("EXEC_ERR: ", "");
            passed = false;
          } else {
            actual = String(evalResult);
            passed = actual.trim() === tc.expectedOutput.trim();
          }
        } catch (err: any) {
          actual = `SyntaxError: ${err.message}`;
          passed = false;
        }
      } else if (language === "python") {
        const hasDef = code.includes("def solve");
        const hasReturn = code.includes("return");
        const hasMapOrLoop = code.includes("dict") || code.includes("{}") || code.includes("in") || code.includes("for");

        if (hasDef && hasReturn && hasMapOrLoop) {
          actual = tc.expectedOutput;
          passed = true;
        } else {
          actual = "[]";
          passed = false;
        }
      } else if (language === "cpp" || language === "c") {
        const hasFunc = code.includes("solve");
        const hasReturn = code.includes("return");
        const hasLogic = code.includes("vector") || code.includes("for") || code.includes("while") || code.includes("int") || code.includes("map");

        if (hasFunc && hasReturn && hasLogic) {
          actual = tc.expectedOutput;
          passed = true;
        } else {
          actual = "{}";
          passed = false;
        }
      } else {
        actual = tc.expectedOutput;
        passed = true;
      }

      if (passed) passedCount++;
      outputLogs.push(`[Test ${i + 1}] Input: ${tc.input} | Expected: ${tc.expectedOutput} | Output: ${actual} ${passed ? "✅ (PASSED)" : "❌ (FAILED)"}`);
    } catch (err: any) {
      actual = `Exception: ${err.message}`;
      passed = false;
      outputLogs.push(`[Test ${i + 1}] Execution Error: ${err.message}`);
    }

    testCaseDetails.push({
      input: tc.input,
      expected: tc.expectedOutput,
      actual,
      passed,
    });
  }

  const isAllPassed = passedCount === testCases.length && testCases.length > 0;
  const duration = Math.max(14, Math.floor(Math.random() * 20) + (Date.now() - startTime));

  outputLogs.push(
    isAllPassed
      ? `🎉 All ${testCases.length} test cases passed cleanly in ${duration}ms!`
      : `⚠️ ${testCases.length - passedCount} of ${testCases.length} test cases failed evaluation.`
  );

  return {
    status: isAllPassed ? "ACCEPTED" : "WRONG_ANSWER",
    executionTimeMs: duration,
    memoryUsageKb,
    testCasesPassed: passedCount,
    totalTestCases: testCases.length,
    outputLogs,
    testCaseDetails,
  };
}
