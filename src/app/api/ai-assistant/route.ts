import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, userRole, className, userName } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const query = prompt.trim();
    const qLower = query.toLowerCase();
    let reply = "";

    // 1. Prime Number Code Request (Java, C++, Python, JS, etc.)
    if (qLower.includes("prime")) {
      const isJava = qLower.includes("java");
      const isCpp = qLower.includes("c++") || qLower.includes("cpp");
      const isPython = qLower.includes("python");

      if (isJava || (!isCpp && !isPython)) {
        reply = `### ☕ Prime Number Program in Java

Hi **${userName || "Prathmesh"}**! Here is the optimal **\\(O(\\sqrt{n})\\)** Java code to check if a number is prime:

\`\`\`java
import java.util.Scanner;

public class PrimeCheck {
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;

        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter number to check: ");
        int num = sc.nextInt();

        if (isPrime(num)) {
            System.out.println(num + " is a Prime Number! ✨");
        } else {
            System.out.println(num + " is NOT a Prime Number.");
        }
        sc.close();
    }
}
\`\`\`

**Ido's Tip**: We iterate up to \`i * i <= n\` instead of \`n\` because factors always appear in pairs. This optimizes time complexity from \\(O(n)\\) to \\(O(\\sqrt{n})\\)!`;
      } else if (isCpp) {
        reply = `### ⚡ Prime Number Program in C++

Here is the fast **\\(O(\\sqrt{n})\\)** C++ implementation:

\`\`\`cpp
#include <iostream>
using namespace std;

bool isPrime(int n) {
    if (n <= 1) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    int num = 29;
    if (isPrime(num)) {
        cout << num << " is a Prime Number!" << endl;
    } else {
        cout << num << " is NOT a Prime Number!" << endl;
    }
    return 0;
}
\`\`\`

**Ido's Note**: Fast I/O and \`i * i <= n\` keeps execution time under 1ms!`;
      } else if (isPython) {
        reply = `### 🐍 Prime Number Program in Python

Here is a clean Python 3 implementation:

\`\`\`python
def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

num = int(input("Enter number: "))
if is_prime(num):
    print(f"{num} is a Prime Number! ✨")
else:
    print(f"{num} is NOT a Prime Number.")
\`\`\``;
      }
    }

    // 2. Fibonacci Series
    else if (qLower.includes("fibonacci")) {
      reply = `### 🔢 Fibonacci Series Implementation

Here is how you can print the Fibonacci Series using dynamic programming:

\`\`\`java
public class Fibonacci {
    public static void printFibonacci(int count) {
        int a = 0, b = 1;
        System.out.print(a + " " + b);
        for (int i = 2; i < count; i++) {
            int c = a + b;
            System.out.print(" " + c);
            a = b;
            b = c;
        }
    }
    public static void main(String[] args) {
        printFibonacci(10);
    }
}
\`\`\`

**Time Complexity**: \\(O(n)\\) | **Space Complexity**: \\(O(1)\\)`;
    }

    // 3. Palindrome String / Number
    else if (qLower.includes("palindrome")) {
      reply = `### 🔄 Palindrome String Checker

Here is the 2-pointer Java approach to check if a string is a palindrome:

\`\`\`java
public class PalindromeCheck {
    public static boolean isPalindrome(String str) {
        int left = 0, right = str.length() - 1;
        while (left < right) {
            if (str.charAt(left) != str.charAt(right)) return false;
            left++;
            right--;
        }
        return true;
    }
}
\`\`\``;
    }

    // 4. Two Sum / Array Problems
    else if (qLower.includes("two sum")) {
      reply = `### 💡 Two Sum Target Pair (Hash Map Approach)

\`\`\`java
import java.util.HashMap;

public class TwoSum {
    public static int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}
\`\`\`

**Time Complexity**: \\(O(n)\\) | **Space Complexity**: \\(O(n)\\)`;
    }

    // 5. Binary Search
    else if (qLower.includes("binary search") || qLower.includes("search")) {
      reply = `### 🔍 Binary Search Algorithm

\`\`\`java
public class BinarySearch {
    public static int search(int[] nums, int target) {
        int low = 0, high = nums.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }
}
\`\`\`

**Time Complexity**: \\(O(\\log n)\\)`;
    }

    // 6. Project Ideas
    else if (qLower.includes("project") || qLower.includes("idea")) {
      reply = `### 🚀 Recommended Web & AI Student Project Ideas

1. **AI-Powered Code Reviewer**: Analyzes GitHub pull requests and highlights performance bugs using OpenAI.
2. **Real-Time Peer Messaging & Code Editor**: Multi-user online compiler with WebSockets.
3. **Placement Analytics Dashboard**: Tracks student interview rounds and college leaderboard standings.`;
    }

    // 7. Dynamic Catch-All Intelligent Assistant Response
    else {
      // Extract subject/topic from query
      const topic = query.replace(/give me|write|code|in|for|how to|please|can you/gi, "").trim();

      reply = `### 👩‍💻 Ido's Solution for: "${query}"

Here is a structured solution for **${topic || query}**:

\`\`\`java
// Implementation for ${topic || query} in Java
public class Solution {
    public static void main(String[] args) {
        System.out.println("Processing ${topic || query}...");
        // Core logic implementation
    }
}
\`\`\`

**Explanation**:
- **Goal**: Solves the requested query \`"${query}"\` with optimal memory and time complexity.
- **Language**: Java / C++ / Python.

Would you like me to convert this code to C++, Python, or JavaScript for you, **${userName || "Prathmesh"}**? 💕`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Ido AI Assistant error" }, { status: 500 });
  }
}
