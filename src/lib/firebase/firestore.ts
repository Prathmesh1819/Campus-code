import { adminDb } from "./admin";

export const COLLECTIONS = {
  USERS: "users",
  ROLES: "roles",
  CLASSROOMS: "classrooms",
  PROBLEMS: "problems",
  TEST_CASES: "testCases",
  SUBMISSIONS: "submissions",
  LEADERBOARD: "leaderboard",
  ANNOUNCEMENTS: "announcements",
  NOTES: "notes",
  PROJECTS: "projects",
  MESSAGES: "messages",
  FACULTY_ASSIGNMENTS: "facultyAssignments",
  STREAKS: "streaks",
  NOTIFICATIONS: "notifications",
  FEEDS: "feeds",
} as const;

export function formatDoc(doc: FirebaseFirestore.DocumentSnapshot) {
  if (!doc.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
    created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
    updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at,
    submitted_at: data.submitted_at?.toDate ? data.submitted_at.toDate().toISOString() : data.submitted_at,
  };
}

export function formatQuerySnapshot(snapshot: FirebaseFirestore.QuerySnapshot) {
  return snapshot.docs.map((doc) => formatDoc(doc));
}
