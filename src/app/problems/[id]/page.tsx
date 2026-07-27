"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import {
  Play,
  Send,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  BookOpen,
  FileText,
  Sparkles,
  ChevronLeft,
  RotateCcw,
  Trophy,
  History,
  Terminal,
  X,
  Database,
} from "lucide-react";
import Link from "next/link";

// Dynamic import for Monaco Editor
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const starterCodeTemplates: Record<string, string> = {
  sql: `-- SQL Query Starter Solution
-- Write your SQL query below to fetch the required result dataset

SELECT 
    -- TODO: Write your SELECT query here
    
FROM Employee;`,

  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solve(nums, target) {
    // TODO: Write your solution algorithm here
    
}`,

  python: `# Python 3 Starter Solution
def solve(nums, target):
    # TODO: Write your solution algorithm here
    pass
`,

  java: `// Java 17 Starter Solution
import java.util.*;

public class Solution {
    public int[] solve(int[] nums, int target) {
        // TODO: Write your solution algorithm here
        return new int[]{};
    }
}
`,

  cpp: `// C++ 20 Starter Solution
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        // TODO: Write your solution algorithm here
        return {};
    }
};
`,

  c: `// C Starter Solution
#include <stdio.h>
#include <stdlib.h>

void solve(int nums[], int numsSize, int target) {
    // TODO: Write your solution algorithm in C
}
`,

  go: `// Go 1.22 Starter Solution
package main

func solve(nums []int, target int) []int {
    // TODO: Write your solution algorithm here
    return nil
}
`,

  rust: `// Rust 2021 Starter Solution
pub fn solve(nums: Vec<i32>, target: i32) -> Vec<i32> {
    // TODO: Write your solution algorithm here
    vec![]
}
`,

  kotlin: `// Kotlin Starter Solution
class Solution {
    fun solve(nums: IntArray, target: Int): IntArray {
        // TODO: Write your solution algorithm here
        return intArrayOf()
    }
}
`,
};

export default function SingleProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, updateUserProfile } = useAuth();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"description" | "editorial" | "submissions" | "notes">("description");

  // Code Editor state
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCodeTemplates.javascript);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [submissionsHistory, setSubmissionsHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchProblemDetail();
    fetchSubmissionsHistory();
  }, [user?.id]);

  const fetchProblemDetail = async () => {
    try {
      const resolvedParams = await params;
      const res = await fetch(`/api/problems/${resolvedParams.id}`);
      const data = await res.json();
      if (data.problem) {
        setProblem(data.problem);

        // Auto-switch to SQL mode if problem category is SQL
        if (data.problem.category === "SQL") {
          setLanguage("sql");
          setCode(starterCodeTemplates.sql);
        }
      }
    } catch {
      setProblem({
        id: "two-sum-target-pair",
        title: "Two Sum Target Pair",
        difficulty: "EASY",
        category: "Arrays",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        examples: JSON.stringify([
          { input: "[2,7,11,15], 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
        ]),
        constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
        hints: JSON.stringify(["Use a Hash Map for O(1) lookups."]),
        editorial: "### Hash Map Solution\nUsing a hash map allows us to check for target - nums[i] in O(1) average time.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionsHistory = async () => {
    try {
      const resolvedParams = await params;
      const res = await fetch(`/api/submissions?problemId=${resolvedParams.id}&userId=${user?.id || ""}`);
      const data = await res.json();
      if (data.submissions) setSubmissionsHistory(data.submissions);
    } catch {
      setSubmissionsHistory([]);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(starterCodeTemplates[newLang] || starterCodeTemplates.javascript);
    setExecutionResult(null);
  };

  const handleRunCode = async (isSubmit: boolean) => {
    setExecuting(true);
    setExecutionResult(null);
    setShowSuccessBanner(false);

    try {
      const resolvedParams = await params;
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem?.id || resolvedParams.id || "two-sum-target-pair",
          userId: user?.id,
          code,
          language,
          isSubmit,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setExecutionResult(data.result);
        if (isSubmit) {
          // Prepend new submission record instantly into history
          const newSubmission = {
            id: data.submission?.id || `sub-${Date.now()}`,
            status: data.result.status,
            language,
            executionTimeMs: data.result.executionTimeMs,
            memoryUsageKb: data.result.memoryUsageKb,
            createdAt: new Date().toISOString(),
          };
          setSubmissionsHistory((prev) => [newSubmission, ...prev]);

          if (data.result.status === "ACCEPTED") {
            setShowSuccessBanner(true);
            // Real-time XP & Streak Update for Navbar & Dashboard
            const updatedXp = (user?.xp || 0) + 50;
            const updatedCoins = (user?.coins || 0) + 20;
            const updatedStreak = (user?.streakDays || 0) === 0 ? 1 : user?.streakDays || 1;
            updateUserProfile({ xp: updatedXp, coins: updatedCoins, streakDays: updatedStreak });
          }
        }
      }
    } catch (err: any) {
      alert("Execution error: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const parsedExamples = problem?.examples ? JSON.parse(problem.examples) : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#070913] text-white">
      <Navbar />

      {/* Workspace Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/problems" className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:text-purple-400 text-gray-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {problem?.title || "Two Sum Target Pair"}
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  problem?.difficulty === "EASY"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {problem?.difficulty || "EASY"}
              </span>
              {problem?.category === "SQL" && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3" /> SQL Question
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleRunCode(false)}
            disabled={executing}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{executing ? "Executing Query..." : "Run Test Cases"}</span>
          </button>
          <button
            onClick={() => handleRunCode(true)}
            disabled={executing}
            className="px-5 py-1.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{executing ? "Evaluating..." : "Submit Solution"}</span>
          </button>
        </div>
      </div>

      {/* Celebratory Accepted Banner */}
      {showSuccessBanner && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider">Solution Accepted! 🚀</h4>
              <p className="text-[11px] text-emerald-200">Congratulations! You earned <b>+50 XP</b> and <b>+20 Campus Coins</b>.</p>
            </div>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden h-[calc(100vh-115px)]">
        {/* Left Column */}
        <div className="lg:col-span-5 border-r border-slate-800 flex flex-col bg-slate-950/60 overflow-y-auto">
          <div className="flex items-center gap-1 border-b border-slate-800 px-4 pt-2 bg-slate-950">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "description"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Description
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "submissions"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <History className="w-3.5 h-3.5" /> Submissions ({submissionsHistory.length})
            </button>
            <button
              onClick={() => setActiveTab("editorial")}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "editorial"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Editorial
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {activeTab === "description" && (
              <>
                <div className="prose prose-invert max-w-none text-xs leading-relaxed text-gray-300">
                  <p className="whitespace-pre-line">{problem?.description}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Examples</h4>
                  {parsedExamples.map((ex: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-xs">
                      <div>
                        <span className="text-purple-400 font-bold">Input:</span>{" "}
                        <span className="text-gray-300">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-bold">Output:</span>{" "}
                        <span className="text-gray-300">{ex.output}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>My Submissions History</span>
                  <span className="text-xs text-purple-400 font-normal">{submissionsHistory.length} total attempts</span>
                </h3>

                {submissionsHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500 font-medium">
                    No submission history found for this problem yet. Submit your code to build your attempt history!
                  </div>
                ) : (
                  submissionsHistory.map((sub: any, idx: number) => (
                    <div key={sub.id || idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {sub.status === "ACCEPTED" ? (
                            <span className="text-emerald-400 font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED
                            </span>
                          ) : (
                            <span className="text-rose-400 font-black flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> {sub.status}
                            </span>
                          )}
                          <span className="text-purple-300 font-bold uppercase text-[10px] bg-purple-500/10 px-2 py-0.5 rounded">
                            {sub.language}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">{new Date(sub.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="text-right text-[11px] text-gray-400">
                        <div>⏱️ {sub.executionTimeMs} ms</div>
                        <div>💾 {(sub.memoryUsageKb / 1024).toFixed(1)} MB</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "editorial" && (
              <div className="prose prose-invert max-w-none text-xs text-gray-300 leading-relaxed space-y-3">
                <h3 className="text-sm font-bold text-white">Editorial Solution</h3>
                <p className="whitespace-pre-line">{problem?.editorial || "Optimal solution uses Hash Map / SQL JOIN strategy."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 flex flex-col bg-[#0b0f19]">
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-purple-300 rounded-xl px-3 py-1.5 focus:outline-none"
              >
                <option value="sql">SQL Query</option>
                <option value="c">C Language</option>
                <option value="cpp">C++ 20</option>
                <option value="java">Java 17</option>
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="go">Go 1.22</option>
                <option value="rust">Rust 2021</option>
                <option value="kotlin">Kotlin</option>
              </select>
            </div>

            <button
              onClick={() => setCode(starterCodeTemplates[language] || starterCodeTemplates.sql)}
              className="text-[11px] font-semibold text-gray-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Starter Code
            </button>
          </div>

          <div className="flex-1 min-h-[350px]">
            <Editor
              height="100%"
              language={language === "c" || language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 13,
                fontFamily: "JetBrains Mono, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Execution Output */}
          {executionResult && (
            <div className="border-t border-slate-800 bg-slate-950 p-4 max-h-80 overflow-y-auto animate-in slide-in-from-bottom-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Debugger Execution Output</h4>
                  {executionResult.status === "ACCEPTED" ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-black">
                      <XCircle className="w-3.5 h-3.5" /> {executionResult.status}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                  <span>⏱️ {executionResult.executionTimeMs} ms</span>
                  <span>💾 {(executionResult.memoryUsageKb / 1024).toFixed(1)} MB</span>
                </div>
              </div>

              {/* Console Logs */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-gray-300 space-y-1">
                {executionResult.outputLogs?.map((log: string, idx: number) => (
                  <p key={idx} className={log.includes("✅") ? "text-emerald-400 font-semibold" : log.includes("❌") ? "text-rose-400 font-semibold" : "text-gray-300"}>
                    {log}
                  </p>
                ))}
              </div>

              {/* Test Cases */}
              <div className="space-y-2">
                {executionResult.testCaseDetails?.map((tc: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border font-mono text-xs space-y-1 ${
                      tc.passed
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Test Case #{idx + 1} ({language.toUpperCase()})</span>
                      <span>{tc.passed ? "✓ PASSED" : "✗ FAILED"}</span>
                    </div>
                    <div className="text-gray-300">Input: <span className="text-white">{tc.input}</span></div>
                    <div className="text-gray-300">Expected Output: <span className="text-emerald-400">{tc.expected}</span></div>
                    <div className="text-gray-300">Your Code Output: <span className={tc.passed ? "text-emerald-300" : "text-rose-400"}>{tc.actual}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
