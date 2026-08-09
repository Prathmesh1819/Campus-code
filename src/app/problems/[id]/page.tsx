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

  // Code Editor state & Live Monaco Ref
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCodeTemplates.javascript);
  const editorRef = useRef<any>(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [submissionsHistory, setSubmissionsHistory] = useState<any[]>([]);

  // LeetCode-Style Bottom Panel state
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);

  useEffect(() => {
    fetchProblemDetail();
  }, [params]);

  useEffect(() => {
    if (user?.id) {
      fetchSubmissionsHistory();
    }
  }, [user?.id, problem?.id]);

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
      const targetId = problem?.id || resolvedParams.id;
      const res = await fetch(`/api/submissions?userId=${user.id}&problemId=${targetId}`);
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
    const template = starterCodeTemplates[newLang] || starterCodeTemplates.javascript;
    setCode(template);
    if (editorRef.current) {
      editorRef.current.setValue(template);
    }
    setExecutionResult(null);
  };

  const handleRunCode = async (isSubmit: boolean) => {
    setExecuting(true);
    setExecutionResult(null);
    setShowSuccessBanner(false);
    setIsBottomPanelOpen(true);
    setBottomTab("result");

    // Read instantaneous code buffer directly from Monaco Editor ref
    const currentCode = editorRef.current ? editorRef.current.getValue() : code;

    try {
      const resolvedParams = await params;
      const activeToken = localStorage.getItem("campuscode_token");
      const savedUserStr = localStorage.getItem("campuscode_user");
      const savedUserId = savedUserStr ? JSON.parse(savedUserStr)?.id : null;
      const targetUserId = user?.id || savedUserId;

      const res = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        cache: "no-store",
        body: JSON.stringify({
          problemId: problem?.id || resolvedParams.id || "two-sum-target-pair",
          userId: targetUserId,
          code: currentCode,
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
            await refreshUserData(data.user || undefined);
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
    <div className="h-screen flex flex-col bg-[#070913] text-white overflow-hidden">
      <Navbar />

      {/* Top Workspace Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
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

        {/* Action Run / Submit Buttons & Permanent Language Selector */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleRunCode(false)}
            disabled={executing}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{executing ? "Running..." : "Run Test Cases"}</span>
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
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-6 py-2.5 flex items-center justify-between shrink-0 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              🏆
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300">Accepted! Solution Passed All Testcases</h4>
              <p className="text-[10px] text-emerald-400/80">XP, Coins & Leaderboard rank updated automatically.</p>
            </div>
          </div>
          <button onClick={() => setShowSuccessBanner(false)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Problem Description & Submissions */}
        <div className="lg:col-span-5 border-r border-slate-800/80 flex flex-col bg-slate-950/50 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 pt-2 shrink-0">
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
              onClick={() => setActiveTab("editorial")}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "editorial"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Editorial
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
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === "description" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white mb-2">{problem?.title || "Two Sum Target Pair"}</h2>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                    {problem?.description || "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."}
                  </p>
                </div>

                {parsedExamples.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Examples</h3>
                    {parsedExamples.map((ex: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1.5 text-xs font-mono">
                        <div><span className="text-purple-400 font-bold">Input:</span> <span className="text-gray-200">{ex.input}</span></div>
                        <div><span className="text-emerald-400 font-bold">Output:</span> <span className="text-gray-200">{ex.output}</span></div>
                        {ex.explanation && (
                          <div className="text-[11px] text-gray-400 font-sans mt-1">
                            <span className="font-semibold text-gray-300">Explanation:</span> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {problem?.constraints && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Constraints</h3>
                    <pre className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-gray-300 font-mono whitespace-pre-line">
                      {problem.constraints}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-3">
                {submissionsHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">No submission history yet.</div>
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
          {/* Editor Header Bar with Permanent Language Selector */}
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-purple-300 rounded-xl px-3 py-1.5 focus:outline-none hover:border-purple-500/50 transition-colors"
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
                onClick={() => {
                  const tmpl = starterCodeTemplates[language] || starterCodeTemplates.sql;
                  setCode(tmpl);
                  if (editorRef.current) {
                    editorRef.current.setValue(tmpl);
                  }
                }}
                className="text-[11px] font-semibold text-gray-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Code
              </button>
            </div>
          </div>

          {/* Code Editor Window */}
          <div className="flex-1 w-full h-full min-h-[350px] relative overflow-hidden bg-[#0b0f19]">
            <Editor
              height="100%"
              width="100%"
              language={
                language === "c" || language === "cpp"
                  ? "cpp"
                  : language === "js"
                  ? "javascript"
                  : language === "python3"
                  ? "python"
                  : language
              }
              theme="vs-dark"
              value={code}
              loading={
                <div className="flex flex-col items-center justify-center h-full bg-[#0b0f19] text-purple-400 text-xs font-mono space-y-2">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span>Initializing Monaco Code Editor...</span>
                </div>
              }
              onMount={(editor) => {
                editorRef.current = editor;
                try {
                  editor.focus();
                } catch {}
              }}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 13,
                fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, 'Courier New', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                lineNumbers: "on",
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: "all",
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
              }}
            />
          </div>

          {/* LEETCODE-STYLE INTERACTIVE TESTCASE & TEST RESULT BOTTOM PANEL */}
          <div
            className={`border-t border-slate-800 bg-[#090d16] flex flex-col transition-all duration-300 shrink-0 ${
              isBottomPanelOpen ? "h-56 sm:h-64" : "h-10"
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 ${
                    bottomTab === "result"
                      ? "bg-[#090d16] text-purple-400 border-t-2 border-purple-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Test Result</span>
                  {executionResult && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        executionResult.status === "ACCEPTED" ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-slate-900"
                >
                  {isBottomPanelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bottom Content Area */}
            {isBottomPanelOpen && (
              <div className="p-4 flex-1 overflow-y-auto text-xs font-mono custom-scrollbar">
                {bottomTab === "testcase" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {parsedExamples.map((_: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedCaseIdx(idx)}
                          className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                            selectedCaseIdx === idx
                              ? "bg-purple-600/20 text-purple-300 border-purple-500/50"
                              : "bg-slate-900 text-gray-400 border-slate-800 hover:text-gray-200"
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {parsedExamples[selectedCaseIdx] && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Input</div>
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-gray-200">
                            {parsedExamples[selectedCaseIdx].input}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Expected Output</div>
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
                            {parsedExamples[selectedCaseIdx].output}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {bottomTab === "result" && (
                  <div>
                    {!executionResult && !executing && (
                      <div className="text-gray-500 flex flex-col items-center justify-center py-10 gap-2 font-sans">
                        <Terminal className="w-8 h-8 opacity-40 text-purple-400" />
                        <p>Click "Run Test Cases" or "Submit Solution" to view Judge0 execution results.</p>
                      </div>
                    )}

                    {executing && (
                      <div className="flex items-center gap-3 text-purple-400 py-8 font-sans">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <span>Sending source code payload directly to Judge0 CE sandbox...</span>
                      </div>
                    )}

                    {executionResult && !executing && (
                      <div className="space-y-4">
                        {/* Status Header */}
                        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-2">
                            {executionResult.status === "ACCEPTED" ? (
                              <span className="text-emerald-400 font-black text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> ACCEPTED
                              </span>
                            ) : (
                              <span className="text-rose-400 font-black text-sm flex items-center gap-1.5">
                                <XCircle className="w-4 h-4" /> {executionResult.status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-purple-400" /> {executionResult.executionTimeMs} ms
                            </span>
                            <span className="flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> {(executionResult.memoryUsageKb / 1024).toFixed(1)} MB
                            </span>
                          </div>
                        </div>

                        {/* Logs */}
                        {executionResult.outputLogs?.length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Judge0 CE Execution Diagnostics</div>
                            {executionResult.outputLogs.map((log: string, idx: number) => (
                              <div key={idx} className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap">
                                {log}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Test Case Selectors */}
                        {executionResult.testCaseDetails?.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              {executionResult.testCaseDetails.map((tc: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedCaseIdx(idx)}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                                    selectedCaseIdx === idx
                                      ? "bg-slate-900 border-purple-500 text-white"
                                      : "bg-slate-950 border-slate-800 text-gray-400"
                                  }`}
                                >
                                  {tc.passed ? (
                                    <span className="text-emerald-400">●</span>
                                  ) : (
                                    <span className="text-rose-400">●</span>
                                  )}
                                  <span>Case {idx + 1}</span>
                                </button>
                              ))}
                            </div>

                            {executionResult.testCaseDetails[selectedCaseIdx] && (
                              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                                <div>
                                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Input</div>
                                  <div className="text-gray-200 bg-slate-900 p-2.5 rounded-lg">{executionResult.testCaseDetails[selectedCaseIdx].input}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Output</div>
                                  <div
                                    className={`p-2.5 rounded-lg font-bold ${
                                      executionResult.testCaseDetails[selectedCaseIdx].passed ? "text-emerald-400 bg-slate-900" : "text-rose-400 bg-rose-950/20 border border-rose-900/50"
                                    }`}
                                  >
                                    {executionResult.testCaseDetails[selectedCaseIdx].actual}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Expected</div>
                                  <div className="text-emerald-400 bg-slate-900 p-2.5 rounded-lg">{executionResult.testCaseDetails[selectedCaseIdx].expected}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
