import { adminDb } from "./admin";
import { COLLECTIONS } from "./firestore";

export class FirebaseStoreService {
  // USERS
  static async getUsers() {
    try {
      const snap = await adminDb.collection(COLLECTIONS.USERS).get();
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.error("[FirebaseStoreService.getUsers] Firestore query error:", error);
    }
    return [];
  }

  static async getUserById(id: string) {
    if (!id) return null;
    try {
      const doc = await adminDb.collection(COLLECTIONS.USERS).doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }

      // Query by lowercase matches if doc ID is different
      const target = id.trim().toLowerCase();
      const snap = await adminDb.collection(COLLECTIONS.USERS).get();
      const match = snap.docs.find((d) => {
        const u = d.data();
        return (
          d.id.toLowerCase() === target ||
          u.id?.toLowerCase() === target ||
          u.username?.toLowerCase() === target ||
          u.email?.toLowerCase() === target
        );
      });
      if (match) return { id: match.id, ...match.data() };
    } catch (error) {
      console.error("[FirebaseStoreService.getUserById] Firestore error:", error);
    }
    return null;
  }

  static async getUserByEmail(email: string) {
    if (!email) return null;
    const target = email.trim().toLowerCase();
    try {
      const snap = await adminDb
        .collection(COLLECTIONS.USERS)
        .where("email", "==", target)
        .limit(1)
        .get();
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    } catch (error) {
      console.error("[FirebaseStoreService.getUserByEmail] Firestore error:", error);
    }
    return null;
  }

  static async saveUser(user: any) {
    if (!user || !user.id) throw new Error("User ID is required to save user doc");
    try {
      const docRef = adminDb.collection(COLLECTIONS.USERS).doc(user.id);
      await docRef.set(user, { merge: true });
      return { id: user.id, ...user };
    } catch (error) {
      console.error("[FirebaseStoreService.saveUser] Firestore save error:", error);
      throw error;
    }
  }

  // CLASSROOMS
  static async getClassrooms() {
    try {
      const snap = await adminDb.collection(COLLECTIONS.CLASSROOMS).get();
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.error("[FirebaseStoreService.getClassrooms] Firestore error:", error);
    }
    return [];
  }

  static async getClassroomByNameOrCode(nameOrCode: string) {
    if (!nameOrCode) return null;
    const target = nameOrCode.trim().toLowerCase();
    const classrooms = await this.getClassrooms();
    return (
      classrooms.find(
        (c: any) =>
          c.name?.toLowerCase() === target ||
          c.code?.toLowerCase() === target ||
          c.id?.toLowerCase() === target
      ) || null
    );
  }

  static async getEnrolledStudents(classIdOrName: string) {
    const cls: any = await this.getClassroomByNameOrCode(classIdOrName);
    const users: any[] = await this.getUsers();
    return users.filter(
      (u: any) =>
        u.role === "STUDENT" &&
        (u.class_id === cls?.id || (u.className && u.className.toLowerCase() === (cls?.name || classIdOrName).toLowerCase()))
    );
  }

  static async getTotalRegisteredStudentsCount() {
    const users = await this.getUsers();
    return users.filter((u: any) => u.role === "STUDENT").length;
  }

  // LEADERBOARD (Students only, ordered by XP)
  static async getStudentLeaderboard(scope: string = "GLOBAL", className?: string | null) {
    try {
      const users = await this.getUsers();
      const students = users.filter((u: any) => {
        const isStudent = u.role === "STUDENT";
        if (!isStudent) return false;
        if (scope === "CLASS" && className) {
          return u.className?.toLowerCase() === className.toLowerCase() || u.class_id === className;
        }
        return true;
      });

      return students
        .sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))
        .map((s: any, idx: number) => ({
          rank: idx + 1,
          id: s.id,
          name: s.full_name || s.name || s.username || s.email?.split("@")[0],
          username: s.username,
          email: s.email,
          avatar: s.profile_image || s.avatar,
          className: s.className || "Classroom",
          xp: s.xp || 0,
          level: s.level || 1,
          streakDays: s.streakDays || 0,
        }));
    } catch (error) {
      console.error("[FirebaseStoreService.getStudentLeaderboard] Firestore error:", error);
      return [];
    }
  }

  // PROBLEMS & TEST CASES
  static async getProblems(statusFilter: string = "published") {
    try {
      const snap = await adminDb
        .collection(COLLECTIONS.PROBLEMS)
        .where("status", "==", statusFilter)
        .get();
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.error("[FirebaseStoreService.getProblems] Firestore error:", error);
    }
    return [];
  }

  static async getProblemByIdOrSlug(idOrSlug: string) {
    if (!idOrSlug) return null;
    try {
      const doc = await adminDb.collection(COLLECTIONS.PROBLEMS).doc(idOrSlug).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }

      // Query by slug or ID
      const snapSlug = await adminDb
        .collection(COLLECTIONS.PROBLEMS)
        .where("slug", "==", idOrSlug)
        .limit(1)
        .get();
      if (!snapSlug.empty) {
        return { id: snapSlug.docs[0].id, ...snapSlug.docs[0].data() };
      }

      // Fallback search across published problems
      const allPublished = await this.getProblems("published");
      const found = allPublished.find((p: any) => p.id === idOrSlug || p.slug === idOrSlug);
      if (found) return found;

      const allArchived = await this.getProblems("archived");
      return allArchived.find((p: any) => p.id === idOrSlug || p.slug === idOrSlug) || null;
    } catch (error) {
      console.error("[FirebaseStoreService.getProblemByIdOrSlug] Firestore error:", error);
      return null;
    }
  }

  // HIDDEN TEST CASE SECURITY: Only returns is_hidden === false when includeHidden is false
  static async getTestCases(problemId: string, includeHidden: boolean = false) {
    try {
      let q = adminDb.collection(COLLECTIONS.TEST_CASES).where("problem_id", "==", problemId);
      if (!includeHidden) {
        q = q.where("is_hidden", "==", false);
      }
      const snap = await q.get();
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (error) {
      console.error("[FirebaseStoreService.getTestCases] Firestore error:", error);
    }
    return [];
  }

  // SOLVED PROBLEMS & SUBMISSIONS
  static async checkProblemFirstSolve(userId: string, problemId: string): Promise<boolean> {
    try {
      const snap = await adminDb
        .collection("solvedProblems")
        .where("user_id", "==", userId)
        .where("problem_id", "==", problemId)
        .limit(1)
        .get();
      return snap.empty; // Returns true if user has NOT solved this problem yet
    } catch {
      return true;
    }
  }

  static async recordSolvedProblem(userId: string, problemId: string) {
    try {
      const id = `solved-${userId}-${problemId}`;
      await adminDb.collection("solvedProblems").doc(id).set({
        id,
        user_id: userId,
        problem_id: problemId,
        solved_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[FirebaseStoreService.recordSolvedProblem] Firestore error:", error);
    }
  }
}
