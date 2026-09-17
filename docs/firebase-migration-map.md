# CampusCode — 92-Model Prisma to Firestore Migration Map

This document establishes the authoritative schema mapping from the 92 Prisma PostgreSQL models to Cloud Firestore collections, document ID strategies, relationship structures, security policies, and migration requirements.

---

## Complete 92-Model Mapping Inventory

| # | Prisma Model | Used by UI/API? | Firestore Collection / Subcollection | Document ID Strategy | Relationship Strategy | Security & Authorization Policy | Status / Notes |
|---|---|---|---|---|---|---|---|
| 1 | `achievements` | Yes | `achievements` | `achievement_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 2 | `announcements` | Yes | `announcements` | `announcement_id` | References `class_id`, `author_id` | Class members read; Teacher/Admin write | Migrated / Active |
| 3 | `article_bookmarks` | Yes | `users/{uid}/article_bookmarks` | Auto-ID | Subcollection under User | Owner read/write | Migrated / Active |
| 4 | `article_comments` | Yes | `articles/{articleId}/comments` | Auto-ID | Subcollection under Article | Authenticated read/create; Author delete | Migrated / Active |
| 5 | `article_likes` | Yes | `articles/{articleId}/likes` | `user_uid` | Document ID is UID for idempotency | Authenticated read/write | Migrated / Active |
| 6 | `assignment_problems` | Yes | `assignments/{assignmentId}/problems` | `problem_id` | Subcollection under Assignment | Class members read; Teacher write | Migrated / Active |
| 7 | `assignment_submissions` | Yes | `assignment_submissions` | Auto-ID | References `assignment_id`, `student_id` | Student owner read/create; Teacher read/grade | Migrated / Active |
| 8 | `assignments` | Yes | `assignments` | `assignment_id` | References `class_id`, `teacher_id` | Class members read; Teacher write | Migrated / Active |
| 9 | `audit_logs` | System | `audit_logs` | Auto-ID | Top-level system logs | Admin read only; Server write only | Active System Log |
| 10 | `bookmarked_problems` | Yes | `users/{uid}/bookmarked_problems` | `problem_id` | Subcollection under User | Owner read/write | Migrated / Active |
| 11 | `certificates` | Yes | `certificates` | `certificate_id` | References `user_id`, `course_id` | Owner read; Server issue only | Migrated / Active |
| 12 | `classes` | Yes | `classrooms` | `class_id` (e.g. `class-ty-bsc-cs`) | Top-level collection | Public read basic info; Teacher/Admin write | Migrated / Active |
| 13 | `code_snapshots` | Yes | `submissions/{subId}/snapshots` | Auto-ID | Subcollection under Submission | Owner read; Server write | Migrated / Active |
| 14 | `code_templates` | Yes | `code_templates` | `template_id` | References `language_id` | Public read; Admin write | Migrated / Active |
| 15 | `coding_activity` | Yes | `users/{uid}/coding_activity` | `YYYY-MM-DD` | Subcollection under User | Public read; Server write | Migrated / Active |
| 16 | `coding_articles` | Yes | `articles` | `article_id` | References `author_id` | Public read; Author/Admin write | Migrated / Active |
| 17 | `coding_goals` | Yes | `users/{uid}/goals` | Auto-ID | Subcollection under User | Owner read/write | Migrated / Active |
| 18 | `coding_roadmaps` | Yes | `roadmaps` | `roadmap_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 19 | `communication_preferences` | Yes | `users/{uid}/preferences/communication` | Single doc | Subcollection under User | Owner read/write | Migrated / Active |
| 20 | `companies` | Yes | `companies` | `company_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 21 | `company_applications` | Yes | `company_applications` | Auto-ID | References `user_id`, `company_id` | Owner read/create; Admin read | Migrated / Active |
| 22 | `constraints_reference` | Yes | `problems/{probId}/constraints` | Single doc | Subcollection under Problem | Public read; Admin write | Migrated / Active |
| 23 | `contest_announcements` | Yes | `contests/{contestId}/announcements` | Auto-ID | Subcollection under Contest | Participants read; Admin write | Migrated / Active |
| 24 | `contest_clarifications` | Yes | `contests/{contestId}/clarifications` | Auto-ID | Subcollection under Contest | Participants read/create; Admin respond | Migrated / Active |
| 25 | `contest_problems` | Yes | `contests/{contestId}/problems` | `problem_id` | Subcollection under Contest | Registered participants read; Admin write | Migrated / Active |
| 26 | `contest_registrations` | Yes | `contests/{contestId}/registrations` | `user_uid` | Subcollection under Contest | Owner read/create; Admin read | Migrated / Active |
| 27 | `contest_results` | Yes | `contests/{contestId}/results` | `user_uid` | Subcollection under Contest | Public read; Server write | Migrated / Active |
| 28 | `contest_submissions` | Yes | `contests/{contestId}/submissions` | `sub_id` | Subcollection under Contest | Owner read; Server write | Migrated / Active |
| 29 | `contests` | Yes | `contests` | `contest_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 30 | `course_certificates` | Yes | `users/{uid}/certificates` | `certificate_id` | Subcollection under User | Owner read; Server issue | Migrated / Active |
| 31 | `course_enrollments` | Yes | `course_enrollments` | `user_uid_courseId` | References `user_id`, `course_id` | Owner read/create; Admin read | Migrated / Active |
| 32 | `course_modules` | Yes | `courses/{courseId}/modules` | `module_id` | Subcollection under Course | Enrolled students read; Admin write | Migrated / Active |
| 33 | `courses` | Yes | `courses` | `course_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 34 | `daily_streaks` | Yes | `streaks` / `users/{uid}/streak` | `user_uid` | References `user_uid` | Public read; Server transaction write | Migrated / Active |
| 35 | `departments` | Yes | `departments` | `dept_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 36 | `discussion_comments` | Yes | `posts/{postId}/comments` | Auto-ID | Subcollection under Post | Authenticated read/create; Author delete | Migrated / Active |
| 37 | `discussion_posts` | Yes | `feed` / `posts` | `post_id` | References `author_id` | Public read; Authenticated create | Migrated / Active |
| 38 | `discussion_votes` | Yes | `posts/{postId}/votes` | `user_uid` | Subcollection under Post | Authenticated write | Migrated / Active |
| 39 | `editorials` | Yes | `problems/{probId}/editorials` | `editorial_id` | Subcollection under Problem | Public read; Admin write | Migrated / Active |
| 40 | `educational_resources` | Yes | `resources` | `resource_id` | Top-level collection | Public read; Teacher/Admin write | Migrated / Active |
| 41 | `email_logs` | System | `email_logs` | Auto-ID | System audit collection | Admin read; Server write | System Log |
| 42 | `examples` | Yes | `problems/{probId}/examples` | `example_id` | Subcollection under Problem | Public read; Admin write | Migrated / Active |
| 43 | `execution_history` | Yes | `users/{uid}/executions` | Auto-ID | Subcollection under User | Owner read; Server write | Migrated / Active |
| 44 | `favorite_problems` | Yes | `users/{uid}/favorite_problems` | `problem_id` | Subcollection under User | Owner read/write | Migrated / Active |
| 45 | `feature_flags` | System | `system_settings/feature_flags` | Single doc | System configuration | Admin read/write | Config Doc |
| 46 | `hints` | Yes | `problems/{probId}/hints` | `hint_id` | Subcollection under Problem | Public read; Admin write | Migrated / Active |
| 47 | `interview_schedules` | Yes | `interview_schedules` | Auto-ID | References `student_id`, `interviewer_id` | Participants read; Admin write | Migrated / Active |
| 48 | `job_offers` | Yes | `job_offers` | Auto-ID | References `student_id`, `company_id` | Student owner read; Admin write | Migrated / Active |
| 49 | `languages` | Yes | `languages` | `language_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 50 | `leaderboard_scores` | Yes | `leaderboard` | `user_uid` | References `user_uid` | Public read; Server write | Migrated / Active |
| 51 | `leaderboard_snapshots` | System | `leaderboard_snapshots` | `YYYY-MM-DD` | Historical snapshots | Public read; Server write | Archive / Active |
| 52 | `learning_progress` | Yes | `users/{uid}/progress` | `course_id` | Subcollection under User | Owner read/write | Migrated / Active |
| 53 | `notification_preferences` | Yes | `users/{uid}/preferences/notifications` | Single doc | Subcollection under User | Owner read/write | Migrated / Active |
| 54 | `notification_queue` | System | `notification_queue` | Auto-ID | Server queue | Server internal only | Queue Collection |
| 55 | `notifications` | Yes | `notifications` | Auto-ID | References `user_id` | Recipient read/update; Server write | Migrated / Active |
| 56 | `placement_profiles` | Yes | `placement_profiles` | `user_uid` | References `user_id` | Owner read/update; Admin read | Migrated / Active |
| 57 | `platform_announcements` | Yes | `platform_announcements` | Auto-ID | Top-level announcements | Public read; Admin write | Migrated / Active |
| 58 | `problem_attempts` | Yes | `users/{uid}/problem_attempts` | `problem_id` | Subcollection under User | Owner read; Server write | Migrated / Active |
| 59 | `problem_companies` | Yes | Embedded array in `problems/{id}` | Array inside problem doc | Embedded in problem document | Public read; Admin write | Migrated / Active |
| 60 | `problem_languages` | Yes | Embedded array in `problems/{id}` | Array inside problem doc | Embedded in problem document | Public read; Admin write | Migrated / Active |
| 61 | `problem_metadata` | Yes | Embedded map in `problems/{id}` | Field inside problem doc | Embedded in problem document | Public read; Admin write | Migrated / Active |
| 62 | `problem_tags` | Yes | Embedded array in `problems/{id}` | Array inside problem doc | Embedded in problem document | Public read; Admin write | Migrated / Active |
| 63 | `problems` | Yes | `problems` | `problem_id` (e.g. `problem-1`, `two-sum`) | Top-level collection | Public read published; Admin write | Migrated / Active |
| 64 | `profile_badges` | Yes | `users/{uid}/badges` | `badge_id` | Subcollection under User | Public read; Server issue | Migrated / Active |
| 65 | `project_bookmarks` | Yes | `projects/{projectId}/bookmarks` | `user_uid` | Subcollection under Project | Authenticated read/write | Migrated / Active |
| 66 | `project_comments` | Yes | `projects/{projectId}/comments` | Auto-ID | Subcollection under Post/Project | Public read; Authenticated create | Migrated / Active |
| 67 | `project_likes` | Yes | `projects/{projectId}/likes` | `user_uid` | Subcollection under Project | Public read; Authenticated write | Migrated / Active |
| 68 | `project_media` | Yes | `projects/{projectId}/media` | Auto-ID | Subcollection under Project | Public read; Owner write | Migrated / Active |
| 69 | `projects` | Yes | `projects` | `project_id` | Top-level collection | Public read; Owner/Admin write | Migrated / Active |
| 70 | `roadmap_progress` | Yes | `users/{uid}/roadmap_progress` | `roadmap_id` | Subcollection under User | Owner read/update | Migrated / Active |
| 71 | `roles` | Yes | `roles` | `role_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 72 | `sample_test_cases` | Yes | Embedded array in `problems/{id}` | Array in problem doc | Embedded in problem doc | Public read; Admin write | Migrated / Active |
| 73 | `saved_posts` | Yes | `users/{uid}/saved_posts` | `post_id` | Subcollection under User | Owner read/write | Migrated / Active |
| 74 | `scheduled_emails` | System | `scheduled_emails` | Auto-ID | System email queue | Server internal only | Queue Collection |
| 75 | `semesters` | Yes | `semesters` | `semester_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 76 | `solved_problems` | Yes | `users/{uid}/solved_problems` | `problem_id` | Subcollection under User | Public read; Server write | Migrated / Active |
| 77 | `starter_codes` | Yes | `problems/{probId}/starter_codes` | `language_id` | Subcollection under Problem | Public read; Admin write | Migrated / Active |
| 78 | `streams` | Yes | `streams` | `stream_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 79 | `student_skills` | Yes | `users/{uid}/skills` | `skill_name` | Subcollection under User | Owner read/write | Migrated / Active |
| 80 | `submission_results` | Yes | Embedded in `submissions/{id}` | Field in submission doc | Embedded in submission doc | Owner read; Server write | Migrated / Active |
| 81 | `submission_test_case_results` | Yes | `submissions/{subId}/test_results` | `test_case_id` | Subcollection under Submission | Owner read (sanitized); Server write | Migrated / Active |
| 82 | `submissions` | Yes | `submissions` | Auto-ID / `sub_id` | Top-level collection | Owner read; Server write | Migrated / Active |
| 83 | `system_settings` | System | `system_settings` | `setting_id` | Top-level collection | Admin read/write | Config Doc |
| 84 | `tags` | Yes | `tags` | `tag_id` | Top-level collection | Public read; Admin write | Migrated / Active |
| 85 | `teacher_notes` | Yes | `notes` | `note_id` | References `class_id`, `teacher_id` | Class members read; Teacher write | Migrated / Active |
| 86 | `test_cases` | Yes | `testCases` / `problems/{id}/test_cases` | `test_case_id` | Subcollection / collection | Public read public cases; HIDDEN READ DENIED | Security Rule Protected |
| 87 | `user_achievements` | Yes | `users/{uid}/achievements` | `achievement_id` | Subcollection under User | Public read; Server issue | Migrated / Active |
| 88 | `user_followers` | Yes | `users/{uid}/followers` | `follower_uid` | Subcollection under User | Public read; Authenticated write | Migrated / Active |
| 89 | `user_ratings` | Yes | `users/{uid}/ratings` | Auto-ID | Subcollection under User | Public read; Server write | Migrated / Active |
| 90 | `user_statistics` | Yes | `users/{uid}/stats` | `overview` | Single doc under User | Public read; Server write | Migrated / Active |
| 91 | `users` | Yes | `users` | `firebase_uid` | Top-level collection | Public read basic profile; Owner edit profile; Server write role/xp | Migrated / Active |
| 92 | `faculty_teaching_assignments` | Yes | `facultyAssignments` | `assignment_id` | References `faculty_id`, `class_id` | Public read; Admin write | Migrated / Active |

---

## Document & ID Strategy Guidelines

1. **User Identity (`users/{firebaseUid}`)**:
   - `doc.id` is the authentic Firebase Auth `uid`.
   - Preserves `legacyUserId` property for historical traceability.
2. **Problems (`problems/{problemId}`)**:
   - Primary identifier is canonical `id` or slug (e.g. `two-sum`).
   - `examples`, `starter_codes`, `hints`, `editorials`, `tags`, `companies` embedded or referenced via subcollections.
3. **Hidden Test Cases (`testCases/{testCaseId}`)**:
   - `is_hidden: true` test cases are stored in Firestore with strict Firestore Security Rules denying client-side `read`.
   - Retrived exclusively by Firebase Admin SDK during Judge0 execution in `/api/execute`.
