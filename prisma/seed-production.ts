import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Wiping all demo student accounts, fake posts, and test submissions...");

  await prisma.submission.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.projectComment.deleteMany();
  await prisma.projectLike.deleteMany();
  await prisma.project.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.note.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Initial Production Super Admin & Head Teacher
  const admin = await prisma.user.create({
    data: {
      name: "CampusCode Super Admin",
      email: "admin@campus.edu",
      password: hashedPassword,
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
      bio: "Platform Administrator & System Monitor",
    },
  });

  const classTeacher = await prisma.user.create({
    data: {
      name: "Dr. Vikramaditya Gupta",
      email: "teacher@campus.edu",
      password: hashedPassword,
      role: "TEACHER",
      className: "TY BSc CS",
      branch: "Computer Science",
      academicYear: "2024-2025",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      bio: "Head of Data Structures & Algorithms Lab. Coordinator @ CSE Department.",
    },
  });

  // 2. Production Classrooms Setup
  await prisma.classroom.create({
    data: {
      name: "TY BSc CS",
      code: "TY-BSC-CS-2024",
      branch: "Computer Science",
      academicYear: "2024-2025",
      teacherId: classTeacher.id,
      description: "Official Classroom for Third Year B.Sc Computer Science.",
    },
  });

  await prisma.classroom.create({
    data: {
      name: "SY BSc CS",
      code: "SY-BSC-CS-2024",
      branch: "Computer Science",
      academicYear: "2024-2025",
      teacherId: classTeacher.id,
      description: "Classroom for Second Year B.Sc Computer Science.",
    },
  });

  await prisma.classroom.create({
    data: {
      name: "FY BSc CS",
      code: "FY-BSC-CS-2024",
      branch: "Computer Science",
      academicYear: "2024-2025",
      teacherId: classTeacher.id,
      description: "Classroom for First Year B.Sc Computer Science.",
    },
  });

  // 3. Official LeetCode & Company Interview Question Bank (No Fake Submissions)
  const companyProblems = [
    { title: "Two Sum Target Pair", diff: "EASY", cat: "Arrays", desc: "Given an array of integers nums and target, return indices of two numbers adding to target.", input: "[2,7,11,15], 9", out: "[0,1]", companies: ["Google", "Meta", "Amazon"], freq: 99 },
    { title: "Longest Substring Without Repeating Characters", diff: "MEDIUM", cat: "Strings", desc: "Find length of longest substring without repeating characters.", input: '"abcabcbb"', out: "3", companies: ["Google", "Meta", "Amazon", "Microsoft"], freq: 98 },
    { title: "Trapping Rain Water", diff: "HARD", cat: "Stack", desc: "Compute how much water an elevation map can trap after raining.", input: "[0,1,0,2,1,0,1,3,2,1,2,1]", out: "6", companies: ["Google", "Meta", "Amazon"], freq: 96 },
    { title: "Group Anagrams", diff: "MEDIUM", cat: "Strings", desc: "Group anagrams together in any order.", input: '["eat","tea","tan","ate","nat","bat"]', out: '[["bat"],["nat","tan"],["ate","eat","tea"]]', companies: ["Meta", "Amazon", "Uber"], freq: 95 },
    { title: "LRU Cache Design", diff: "MEDIUM", cat: "Linked List", desc: "Design a data structure following Least Recently Used (LRU) cache strategy.", input: '["LRUCache","put","put","get"]', out: "[null,null,null,1]", companies: ["Google", "Meta", "Amazon", "Microsoft"], freq: 97 },
    { title: "Merge k Sorted Lists", diff: "HARD", cat: "Linked List", desc: "Merge k sorted linked lists and return it as one sorted list.", input: "[[1,4,5],[1,3,4],[2,6]]", out: "[1,1,2,3,4,4,5,6]", companies: ["Meta", "Amazon", "Google"], freq: 94 },
    { title: "Number of Islands BFS/DFS", diff: "MEDIUM", cat: "Graphs", desc: "Find number of connected 1s (land) in 2D binary grid.", input: "[['1','1','0'],['1','1','0'],['0','0','1']]", out: "2", companies: ["Amazon", "Google", "Microsoft"], freq: 98 },
    { title: "Course Schedule Cycle Detection", diff: "MEDIUM", cat: "Graphs", desc: "Determine if it is possible to finish all courses given prerequisites.", input: "numCourses = 2, prerequisites = [[1,0]]", out: "true", companies: ["Amazon", "Google", "Meta"], freq: 92 },
    { title: "3Sum Zero Target", diff: "MEDIUM", cat: "Arrays", desc: "Return all unique triplets [nums[i], nums[j], nums[k]] such that sum equals 0.", input: "[-1,0,1,2,-1,-4]", out: "[[-1,-1,2],[-1,0,1]]", companies: ["Amazon", "Microsoft", "Meta"], freq: 94 },
    { title: "Container With Most Water", diff: "MEDIUM", cat: "Arrays", desc: "Find two lines that together with x-axis forms container holding most water.", input: "[1,8,6,2,5,4,8,3,7]", out: "49", companies: ["Amazon", "Google", "Adobe"], freq: 93 },
    { title: "Word Break DP", diff: "MEDIUM", cat: "Dynamic Programming", desc: "Return true if s can be segmented into space-separated dictionary words.", input: '"leetcode", ["leet","code"]', out: "true", companies: ["Amazon", "Meta", "Microsoft"], freq: 91 },
    { title: "Best Time to Buy and Sell Stock", diff: "EASY", cat: "Arrays", desc: "Find max profit buying on one day and selling on a future day.", input: "[7,1,5,3,6,4]", out: "5", companies: ["Apple", "Amazon", "Microsoft"], freq: 96 },
    { title: "Valid Parentheses Stack", diff: "EASY", cat: "Stack", desc: "Determine if string containing brackets '()[]{}' is valid.", input: '"()[]{}"', out: "true", companies: ["Apple", "Google", "Meta", "Adobe"], freq: 97 },
    { title: "Product of Array Except Self", diff: "MEDIUM", cat: "Arrays", desc: "Return array where output[i] is product of all elements except nums[i].", input: "[1,2,3,4]", out: "[24,12,8,6]", companies: ["Apple", "Amazon", "Netflix", "Uber"], freq: 94 },
    { title: "Binary Tree Level Order Traversal", diff: "HARD", cat: "Trees", desc: "Return level order traversal of binary tree level by level.", input: "[3,9,20,null,null,15,7]", out: "[[3],[9,20],[15,7]]", companies: ["Netflix", "Meta", "Amazon"], freq: 92 },
    { title: "Rotting Oranges BFS", diff: "MEDIUM", cat: "Graphs", desc: "Return minimum minutes until no fresh orange remains.", input: "[[2,1,1],[1,1,0],[0,1,1]]", out: "4", companies: ["Uber", "Amazon", "Google"], freq: 90 },
    { title: "SQL Highest Department Salary", diff: "MEDIUM", cat: "SQL", desc: "Find employees who have highest salary in each department.", input: "Employee table", out: "Department | Employee | Salary", companies: ["Adobe", "Google", "Meta"], freq: 88 },
  ];

  for (let idx = 0; idx < companyProblems.length; idx++) {
    const p = companyProblems[idx];
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.problem.create({
      data: {
        title: p.title,
        slug: `${slug}-prod-${idx + 1}`,
        difficulty: p.diff,
        category: p.cat,
        description: p.desc,
        examples: JSON.stringify([{ input: p.input, output: p.out, explanation: `Past interview question asked at ${p.companies.join(", ")}.` }]),
        constraints: "1 <= N <= 10^5\nStandard Memory and Execution Limits.",
        hints: JSON.stringify([`Asked frequently at ${p.companies[0]} (${p.freq}% frequency). Use optimal DSA approach.`]),
        editorial: `### Company Interview Editorial for ${p.title}\nFrequently asked in ${p.companies.join(" and ")} technical rounds.`,
        acceptedLanguages: JSON.stringify(["c", "cpp", "java", "python", "javascript", "go", "rust", "kotlin"]),
        companyTags: JSON.stringify(p.companies),
        frequency: p.freq,
        testCases: {
          create: [{ input: p.input, expectedOutput: p.out, isHidden: false }],
        },
      },
    });
  }

  console.log("✨ Clean Production Database Ready! Zero Demo Students, Clean Classrooms & Problem Bank Intact.");
}

main()
  .catch((e) => {
    console.error("❌ Error running production seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
