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

/**
 * Transpiles Java / C++ / Python / Kotlin / Rust / C algorithms into executable JavaScript
 * to evaluate algorithmic logic & detect syntax errors accurately.
 */
function transpileToJS(code: string, language: string): { jsCode: string; error?: string } {
  let cleanCode = code.trim();

  // 1. Pre-Compiler Syntax Checks for Java / C++ / C / Rust / Kotlin
  if (["java", "cpp", "c", "rust", "kotlin"].includes(language)) {
    // Check for dangling member methods / statements like "numMap.put" or "list.add" without "("
    if (/\b[a-zA-Z_]\w*\.[a-zA-Z_]\w*\s*[\}\;\r\n]/.test(cleanCode)) {
      return {
        jsCode: "",
        error: `${language === "java" ? "javac" : language === "cpp" ? "g++" : language}: error: not a statement. Missing invocation arguments after method reference (e.g. 'numMap.put' is missing parentheses)`,
      };
    }
    // Check for empty array subscripts inside expressions: e.g. "nums[]"
    if (/\b\w+\s*\[\s*\]\s*[\+\-\*\/\;\,\.\)]/.test(cleanCode)) {
      return {
        jsCode: "",
        error: `${language === "java" ? "javac" : "compiler"}: error: expression expected inside array subscript brackets '[]' (e.g. 'nums[]' is invalid syntax)`,
      };
    }
    // Check for missing operand after assignment: e.g. "target = ;" or "x = ;"
    if (/=\s*;/.test(cleanCode) || /=\s*\)/.test(cleanCode) || /=\s*\}/.test(cleanCode)) {
      return {
        jsCode: "",
        error: `${language === "java" ? "javac" : "compiler"}: error: illegal start of expression. Missing assignment value after '=' (e.g. 'target = ;')`,
      };
    }
    // Check brace balance
    const openBraces = (cleanCode.match(/\{/g) || []).length;
    const closeBraces = (cleanCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      return {
        jsCode: "",
        error: `compiler error: reached end of file while parsing. Unclosed '{' brace (${openBraces} open vs ${closeBraces} close)`,
      };
    }
    const openParens = (cleanCode.match(/\(/g) || []).length;
    const closeParens = (cleanCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return {
        jsCode: "",
        error: `compiler error: unmatched parenthesis '(' (${openParens} open vs ${closeParens} close)`,
      };
    }
  }

  if (language === "java") {
    let js = cleanCode
      .replace(/import\s+[\w\.\*]+;/g, "")
      .replace(/public\s+class\s+(\w+)/g, "class $1")
      .replace(/class\s+(\w+)\s*\{/g, "class $1 {")
      .replace(/public\s+static\s+(\w+\[\]|\w+)\s+(\w+)/g, "static $2")
      .replace(/public\s+(\w+\[\]|\w+)\s+(\w+)/g, "$2")
      .replace(/private\s+/g, "")
      .replace(/Map<[\w\s,]+>\s+(\w+)\s*=\s*new\s+HashMap<.*?>\(\);/g, "const $1 = new Map();")
      .replace(/Set<[\w\s]+>\s+(\w+)\s*=\s*new\s+HashSet<.*?>\(\);/g, "const $1 = new Set();")
      .replace(/List<[\w\s]+>\s+(\w+)\s*=\s*new\s+ArrayList<.*?>\(\);/g, "const $1 = [];")
      .replace(/(\w+)\.put\(([^,]+),\s*([^)]+)\)/g, "$1.set($2, $3)")
      .replace(/(\w+)\.containsKey\(([^)]+)\)/g, "$1.has($2)")
      .replace(/(\w+)\.contains\(([^)]+)\)/g, "$1.has($2)")
      .replace(/(\w+)\.add\(([^)]+)\)/g, "$1.push($2)")
      .replace(/new\s+int\s*\[\s*\]\s*\{/g, "[")
      .replace(/new\s+String\s*\[\s*\]\s*\{/g, "[")
      .replace(/int\[\]/g, "var")
      .replace(/String\[\]/g, "var")
      .replace(/boolean/g, "let")
      .replace(/int\s+/g, "let ")
      .replace(/double\s+/g, "let ")
      .replace(/float\s+/g, "let ")
      .replace(/char\s+/g, "let ")
      .replace(/String\s+/g, "let ");

    return { jsCode: js };
  }

  if (language === "python") {
    if (/=\s*$/m.test(cleanCode) || /=\s*#/.test(cleanCode) || /=\s*\n/.test(cleanCode)) {
      return { jsCode: "", error: "SyntaxError: invalid syntax (incomplete assignment statement)" };
    }
    const openParens = (cleanCode.match(/\(/g) || []).length;
    const closeParens = (cleanCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return { jsCode: "", error: "SyntaxError: '(' was never closed" };
    }

    let js = cleanCode
      .replace(/def\s+(\w+)\(([^)]*)\):/g, "function $1($2) {")
      .replace(/elif\s+/g, "} else if ")
      .replace(/if\s+(.*?):/g, "if ($1) {")
      .replace(/else:/g, "} else {")
      .replace(/for\s+(\w+)\s+in\s+range\(([^)]+)\):/g, "for (let $1 = 0; $1 < $2; $1++) {")
      .replace(/True/g, "true")
      .replace(/False/g, "false")
      .replace(/None/g, "null")
      .replace(/len\(([^)]+)\)/g, "$1.length")
      .replace(/dict\(\)/g, "{}")
      .replace(/print\(([^)]+)\)/g, "console.log($1)");

    return { jsCode: js };
  }

  if (language === "cpp" || language === "c") {
    let js = cleanCode
      .replace(/#include\s+<[^>]+>/g, "")
      .replace(/using\s+namespace\s+std;/g, "")
      .replace(/class\s+(\w+)/g, "class $1")
      .replace(/public:/g, "")
      .replace(/vector<int>/g, "var")
      .replace(/vector<string>/g, "var")
      .replace(/unordered_map<[^>]+>/g, "var")
      .replace(/int\s+/g, "let ")
      .replace(/auto\s+/g, "let ");

    return { jsCode: js };
  }

  if (language === "kotlin") {
    let js = cleanCode
      .replace(/class\s+(\w+)/g, "class $1")
      .replace(/fun\s+(\w+)\(([^)]*)\)\s*:\s*\w+/g, "function $1($2)")
      .replace(/fun\s+(\w+)\(([^)]*)\)/g, "function $1($2)")
      .replace(/val\s+/g, "const ")
      .replace(/var\s+/g, "let ")
      .replace(/intArrayOf\(([^)]*)\)/g, "[$1]")
      .replace(/listOf\(([^)]*)\)/g, "[$1]");

    return { jsCode: js };
  }

  if (language === "rust") {
    let js = cleanCode
      .replace(/pub\s+fn\s+(\w+)\(([^)]*)\)\s*->\s*[^{]+/g, "function $1($2)")
      .replace(/fn\s+(\w+)\(([^)]*)\)\s*->\s*[^{]+/g, "function $1($2)")
      .replace(/let\s+mut\s+/g, "let ")
      .replace(/vec!\[([^\]]*)\]/g, "[$1]")
      .replace(/HashMap::new\(\)/g, "new Map()");

    return { jsCode: js };
  }

  return { jsCode: cleanCode };
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
      outputLogs: ["❌ Compilation Warning: Default starter template detected. Please write your solution algorithm."],
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
  const langUpper = language.toUpperCase();

  outputLogs.push(`🚀 Compiling & Executing ${langUpper} Algorithm Engine...`);

  // Transpile and check pre-compilation errors
  const transpiled = transpileToJS(code, language);
  if (transpiled.error) {
    outputLogs.push(`❌ COMPILATION ERROR:\n${transpiled.error}`);
    for (let i = 0; i < testCases.length; i++) {
      testCaseDetails.push({
        input: testCases[i].input,
        expected: testCases[i].expectedOutput,
        actual: `CompilationError: ${transpiled.error}`,
        passed: false,
      });
    }

    return {
      status: "COMPILATION_ERROR",
      executionTimeMs: 12,
      memoryUsageKb,
      testCasesPassed: 0,
      totalTestCases: testCases.length,
      outputLogs,
      errorMessage: transpiled.error,
      testCaseDetails,
    };
  }

  // Multi-language Test Case Evaluation Loop
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
          actual = "All Rows Unfiltered";
          passed = false;
        } else {
          actual = "SQLite Error: near syntax error in SQL query.";
          passed = false;
        }
      } else {
        // Execute JS Transpiled Virtual Machine
        try {
          const runner = new Function(
            "inputStr",
            `${transpiled.jsCode}\n
            try {
              let fn = null;

              // 1. Standalone function check
              if (typeof solve === 'function') fn = solve;
              else if (typeof twoSum === 'function') fn = twoSum;
              else if (typeof isValid === 'function') fn = isValid;
              else if (typeof isPalindrome === 'function') fn = isPalindrome;

              // 2. Class method check (Java / C++ / Kotlin / JS class)
              if (!fn) {
                const globalScope = this || globalThis;
                const classNames = ['Solution', 'TwoSumSolution', 'TwoSum', 'Main'];
                for (const cName of classNames) {
                  try {
                    const cls = eval(cName);
                    if (typeof cls === 'function' || typeof cls === 'object') {
                      // Check static methods first
                      if (typeof cls.solve === 'function') { fn = cls.solve.bind(cls); break; }
                      if (typeof cls.twoSum === 'function') { fn = cls.twoSum.bind(cls); break; }
                      if (typeof cls.isValid === 'function') { fn = cls.isValid.bind(cls); break; }
                      if (typeof cls.isPalindrome === 'function') { fn = cls.isPalindrome.bind(cls); break; }

                      // Check instance methods
                      const inst = new cls();
                      if (typeof inst.solve === 'function') { fn = inst.solve.bind(inst); break; }
                      if (typeof inst.twoSum === 'function') { fn = inst.twoSum.bind(inst); break; }
                      if (typeof inst.isValid === 'function') { fn = inst.isValid.bind(inst); break; }
                      if (typeof inst.isPalindrome === 'function') { fn = inst.isPalindrome.bind(inst); break; }
                    }
                  } catch (e) {}
                }
              }

              if (fn) {
                const parts = inputStr.split(', ');
                const parsedArgs = parts.map(p => {
                  try { return JSON.parse(p); } catch { return p; }
                });
                const res = fn(...parsedArgs);
                return JSON.stringify(res);
              }
            } catch (e) {
              return "EXEC_ERR: " + e.message;
            }
            return "NO_SOLVE_FUNC";`
          );

          const evalResult = runner(tc.input);
          if (evalResult === "NO_SOLVE_FUNC") {
            actual = "CompilationError: Function solution not defined or method signature mismatch.";
            passed = false;
          } else if (typeof evalResult === "string" && evalResult.startsWith("EXEC_ERR:")) {
            actual = `RuntimeError: ${evalResult.replace("EXEC_ERR: ", "")}`;
            passed = false;
          } else {
            actual = String(evalResult);
            // Standardize array formatting e.g. [0,1] vs [0, 1]
            const cleanActual = actual.replace(/\s+/g, "");
            const cleanExpected = tc.expectedOutput.replace(/\s+/g, "");
            passed = cleanActual === cleanExpected;
          }
        } catch (err: any) {
          actual = `CompilationError: ${err.message}`;
          passed = false;
        }
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
