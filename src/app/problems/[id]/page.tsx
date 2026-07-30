"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Sparkles,
  ChevronLeft,
  RotateCcw,
  Trophy,
  History,
  Terminal,
  X,
  Database,
  Check,
  ChevronUp,
  ChevronDown,
  Layers,
  FileCode,
} from "lucide-react";
import Link from "next/link";

// Dynamic import for Monaco Editor
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const starterCodeTemplates: Record<string, string> = {
  sql: `-- SQL Query Starter Solution
SELECT * FROM Employee;`,

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

void solve(int nums[], int numsSize, int target) {
    // TODO: Write your solution algorithm in C
}
`,

  go: `// Go 1.22 Starter Solution
package main

func solve(nums []int, target int) []int {
    return nil
}
`,

  rust: `// Rust 2021 Starter Solution
pub fn solve(nums: Vec<i32>, target: i32) -> Vec<i32> {
    vec![]
}
`,

  kotlin: `// Kotlin Starter Solution
class Solution {
    fun solve(nums: IntArray, target: Int): IntArray {
        return intArrayOf()
    }
}
`,
};

export default function SingleProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, refreshUserData } = useAuth();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"description" | "editorial" | "submissions">("description");

  // Code Editor state
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCodeTemplates.javascript);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [submissionsHistory, setSubmissionsHistory] = useState<any[]>([]);

  // LeetCode-Style Bottom Panel state
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

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
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
        examples: JSON.stringify([
          { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
          { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
        ]),
        constraints: `2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9`,
        editorial: `Use a Hash Map to store numbers and their indices in O(n) time.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionsHistory = async () => {
    if (!user?.id) return;
    try {
      const resolvedParams = await params;
      const res = await fetch(`/api/submissions?userId=${user.id}&problemId=${resolvedParams.id}`);
      const data = await res.json();
      if (data.submissions) {
        setSubmissionsHistory(data.submissions);
      }
    } catch (e) {
      // Ignore
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
    setIsBottomPanelOpen(true);
    setBottomTab("result");

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
        setSelectedCaseIdx(0);

        if (isSubmit) {
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
            await refreshUserData();
          }
        }

        // Auto Scroll to Test Result Panel
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
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

      {/* Top Workspace Bar */}
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

        {/* Action Run / Submit Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleRunCode(false)}
            disabled={executing}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{executing ? "Running Testcases..." : "Run Test Cases"}</span>
          </button>
          <button
            onClick={() => handleRunCode(true)}
            disabled={executing}
            className="px-5 py-1.5 rounded-xl gradient-bg text-white text-xs font-bold shadow-glow hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{executing ? "Evaluating..." : "Submit Solution"}</span>
          </button>
        </div>
      </div>

      {/* Accepted Banner */}
      {showSuccessBanner && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              🏆
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300">Congratulations! Solution Accepted! 🎉</h4>
              <p className="text-[10px] text-emerald-200">You earned +50 XP & +10 Coins! Keep building your streak!</p>
            </div>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="text-emerald-400 hover:text-white text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden h-[calc(100vh-115px)]">
        {/* Left Column: Problem Tabs */}
        <div className="lg:col-span-5 border-r border-slate-800 flex flex-col bg-slate-950/60 overflow-y-auto">
          <div className="flex items-center gap-1 border-b border-slate-800 px-4 pt-2 bg-slate-950 sticky top-0 z-10">
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
                      {ex.explanation && (
                        <div className="text-gray-400 text-[11px]">
                          <span className="text-gray-500">Explanation:</span> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {problem?.constraints && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Constraints</h4>
                    <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-gray-400 whitespace-pre-line">
                      {problem.constraints}
                    </pre>
                  </div>
                )}
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

        {/* Right Column: Code Editor & LeetCode Bottom Workspace */}
        <div className="lg:col-span-7 flex flex-col bg-[#0b0f19] relative overflow-hidden">
          {/* Editor Header Bar */}
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCode(starterCodeTemplates[language] || starterCodeTemplates.sql)}
                className="text-[11px] font-semibold text-gray-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Code
              </button>
            </div>
          </div>

          {/* Code Editor Window */}
          <div className="flex-1 min-h-[260px] relative">
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

          {/* LEETCODE-STYLE INTERACTIVE TESTCASE & TEST RESULT BOTTOM PANEL */}
          <div
            ref={resultsRef}
            className={`border-t border-slate-800 bg-[#090d16] flex flex-col transition-all duration-300 shrink-0 ${
              isBottomPanelOpen ? "h-64 sm:h-72" : "h-10"
            }`}
          >
            {/* LeetCode Bottom Tab Bar */}
            <div className="px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between h-10 shrink-0 select-none">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setBottomTab("testcase");
                    setIsBottomPanelOpen(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 ${
                    bottomTab === "testcase"
                      ? "bg-[#090d16] text-purple-400 border-t-2 border-purple-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Testcase</span>
                </button>

                <button
                  onClick={() => {
                    setBottomTab("result");
                    setIsBottomPanelOpen(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 relative ${
                    bottomTab === "result"
                      ? "bg-[#090d16] text-purple-400 border-t-2 border-purple-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  <span>Test Result</span>
                  {executing && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                  {executionResult && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        executionResult.status === "ACCEPTED" ? "bg-emerald-400" : "bg-rose-500"
                      }`}
                    />
                  )}
                </button>
              </div>

              <button
                onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1 text-[11px]"
              >
                <span className="hidden sm:inline font-semibold">{isBottomPanelOpen ? "Console Collapse" : "Console Expand"}</span>
                {isBottomPanelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom Content Body */}
            {isBottomPanelOpen && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
                {/* TAB 1: TESTCASE INPUTS */}
                {bottomTab === "testcase" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {parsedExamples.map((_: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedCaseIdx(idx)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            selectedCaseIdx === idx
                              ? "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                              : "bg-slate-900 text-gray-400 hover:text-white border border-slate-800"
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {parsedExamples[selectedCaseIdx] && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-[11px] font-semibold block mb-1">Input:</span>
                          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-gray-200">
                            {parsedExamples[selectedCaseIdx].input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[11px] font-semibold block mb-1">Expected Output:</span>
                          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400">
                            {parsedExamples[selectedCaseIdx].output}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: TEST RESULT */}
                {bottomTab === "result" && (
                  <div className="space-y-3">
                    {executing ? (
                      <div className="p-6 text-center text-xs text-amber-400 flex items-center justify-center gap-2 animate-pulse">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Running test cases against solution sandbox...</span>
                      </div>
                    ) : !executionResult ? (
                      <div className="p-6 text-center text-xs text-gray-500">
                        Click <strong className="text-emerald-400">"Run Test Cases"</strong> or <strong className="text-purple-400">"Submit Solution"</strong> to see testcase results here!
                      </div>
                    ) : (
                      <>
                        {/* Status Header */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            {executionResult.status === "ACCEPTED" ? (
                              <h3 className="text-base font-black text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Accepted
                              </h3>
                            ) : (
                              <h3 className="text-base font-black text-rose-400 flex items-center gap-1.5">
                                <XCircle className="w-5 h-5 text-rose-400" /> {executionResult.status}
                              </h3>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold">
                            <span>⏱️ Runtime: <strong className="text-white">{executionResult.executionTimeMs} ms</strong></span>
                            <span>💾 Memory: <strong className="text-white">{(executionResult.memoryUsageKb / 1024).toFixed(1)} MB</strong></span>
                          </div>
                        </div>

                        {/* Test Case Pills */}
                        {executionResult.testCaseDetails && executionResult.testCaseDetails.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {executionResult.testCaseDetails.map((tc: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedCaseIdx(idx)}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                    selectedCaseIdx === idx
                                      ? tc.passed
                                        ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40"
                                        : "bg-rose-950/40 text-rose-300 border border-rose-500/40"
                                      : "bg-slate-900 text-gray-400 border border-slate-800"
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${tc.passed ? "bg-emerald-400" : "bg-rose-500"}`} />
                                  <span>Case {idx + 1}</span>
                                </button>
                              ))}
                            </div>

                            {/* Selected Case Detail */}
                            {executionResult.testCaseDetails[selectedCaseIdx] && (
                              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                                <div>
                                  <span className="text-gray-400 text-[11px] font-semibold block mb-0.5">Input:</span>
                                  <pre className="p-2.5 rounded-xl bg-slate-900 text-gray-200 border border-slate-800">
                                    {executionResult.testCaseDetails[selectedCaseIdx].input}
                                  </pre>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-400 text-[11px] font-semibold block mb-0.5">Expected Output:</span>
                                    <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
                                      {executionResult.testCaseDetails[selectedCaseIdx].expected}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 text-[11px] font-semibold block mb-0.5">Your Code Output:</span>
                                    <pre className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${
                                      executionResult.testCaseDetails[selectedCaseIdx].passed ? "text-emerald-300" : "text-rose-400 font-bold"
                                    }`}>
                                      {executionResult.testCaseDetails[selectedCaseIdx].actual}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Execution Logs */}
                        {executionResult.outputLogs && executionResult.outputLogs.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-gray-400 text-[11px] font-semibold block">Stdout / Execution Logs:</span>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-gray-300 space-y-1 text-xs">
                              {executionResult.outputLogs.map((log: string, idx: number) => (
                                <p key={idx}>{log}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
