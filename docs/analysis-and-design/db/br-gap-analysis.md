# myHCMUS — Business Requirements Gap Analysis for Database Design

## 1. Summary of Findings

| ID | Priority | Type | Issue in Business Requirements |
|---|---|---|---|
| DB-01 | P0 | Conflict / Assumption | Introduces a separate `reviewer` role and cumulative role inheritance without adequately representing scope-restricted, authorized Activity Managers. |
| DB-02 | P0 | Gap | No organizational unit model for clubs, departments, or the Student Affairs Office, nor related membership and management scope. |
| DB-03 | P1 | Gap | `User` lacks a phone number, and academic fields are not explicitly protected as read-only for self-service updates. |
| DB-04 | P0 | Gap | No Student–Activity Follow/Unfollow relationship. |
| DB-05 | P1 | Conflict | `Activity.status` omits `ongoing`. |
| DB-06 | P0 | Gap / Assumption | Seat reservation, strict FIFO order, automatic promotion, and registration after cancellation/rejection are not fully resolved. |
| DB-07 | P1 | Gap | No rule for reducing activity capacity below the number of Confirmed participants. |
| DB-08 | P0 | Conflict | `Appeal.status` lacks Pending Assignment, Pending Review, Additional Information Required, and Withdrawn; request editing and resubmission are not modeled. |
| DB-09 | P0 | Gap | No current assignee or distinct routing rules for recognition requests and activity-specific appeals. |
| DB-10 | P0 | Gap | Recognition submissions lack initial activity details, internal/external classification, category, occurrence date, target semester, and proposed criterion. |
| DB-11 | P0 | Conflict | Requiring `score_id` for every `score_correction` prevents appeals about a **missing** score. |
| DB-12 | P1 | Gap | Evidence cardinality permits zero files, and file validation and restricted access are underspecified. |
| DB-13 | P0 | Gap | `ScoreCriterion` lacks a clear semester-effective scoring-policy/version model, including applicable weights and ranges. |
| DB-14 | P0 | Gap | Score and audit design does not fully specify approved adjustments, creation of previously missing scores, or atomic request approval. |
| DB-15 | P1 | Assumption | Mandatory attendance results for all sessions and QR/signature attendance procedures go beyond the confirmed baseline. |
| DB-16 | P1 | Gap | `Notification` models in-app messages but not email delivery/retries or all related request/announcement links. |
| DB-17 | P0 | Gap | No general audit mechanism for request decisions, configuration changes, role changes, and request edits/withdrawals. |
| DB-18 | P1 | Assumption | Reopening resolved requests are unconfirmed policies. |

## 2. Detailed Findings and Recommended Changes

### DB-01 — Roles and Scope-Based Authorization [P0]
- **Current design:** `Role` values are `student`, `organizer`, `reviewer`, and `administrator`; `User.role_id` permits one role per account; permissions accumulate from student → organizer → reviewer → administrator.
- **Baseline:** Vision §§3, 5.1, 5.9–5.10; UC-28 assigns request review to an **assigned/authorized Activity Manager**; UC-29 manages users and permissions; NFR-SEC-03 requires server-side authorization.
- **Issue:** A standalone `reviewer` role may inherit organizer capabilities without being responsible for an activity. Possessing `appeal.review` alone does not establish authority over a specific request. Cumulative inheritance is an additional assumption, not a baseline rule.
- **Recommendation:** Separate **role/permission** from **resource scope** (for example, `OrganizationMember`, `ActivityOrganizer`, `RequestAssignment`). Do not assume administrative roles inherit all operational permissions. A single role per user can remain **if explicitly approved**; otherwise, consider `UserRole` for independently assigned roles.

### DB-02 — Missing Organizations and Management Units [P0]
- **Current design:** `Faculty` and `ActivityOrganizer` exist, but there is no entity for clubs, departments, or the Student Affairs Office. Activities are linked to individual organizers rather than an owning unit, so department-level reporting lacks a clear ownership key.
- **Baseline:** Vision §§3.1–3.2 and NFR-SCA-INT-01 (growth from 15 to at least 50 independent management units); UC-18 (creating activities within an organization), UC-20 (department-level reports), and UC-25/28 (Student Affairs Office assignment).
- **Recommendation:** Introduce an `Organization` entity (`organization_id`, `name`, `type`, etc.), membership/assignment relationships, and potentially `Activity.organization_id`. Clarify whether an activity can belong to multiple organizations. `Faculty` may remain a separate academic attribute for filtering and eligibility rather than being used as a substitute for every organization.

### DB-03 — Incomplete User/Profile Data and Update Rules [P1]
- **Current design:** `User` stores email, full name, student number, faculty, and avatar but no `phone_number`. Self-service immutability of academic fields is not explicitly addressed.
- **Baseline:** UC-03 permits users to update their phone number, password, and avatar, while full name, academic ID, and faculty are read-only; Vision §5.2.
- **Recommendation:** Add `phone_number` if profiles are persisted in the database, and enforce academic-field update restrictions in the application/API. A separate `StudentProfile` table is optional rather than intrinsically required.

### DB-04 — Missing Activity Follow Relationship [P0]
- **Current design:** `UserInterest` records interest in an activity **category**, not a particular **activity**.
- **Baseline:** Vision §5.3 and Workflow 1; UC-05 allows Follow/Unfollow **without registering**; UC-17 notifies followers of relevant updates; UC-15 can show followed activities in the personal calendar.
- **Recommendation:** Add `ActivityFollow(user_id, activity_id, followed_at)` with a unique (`user_id`, `activity_id`) key. Following must remain independent of `Registration`. Unfollowing may delete the relationship or retain history if an audit/history policy calls for it.

### DB-05 — Missing Ongoing Activity Status [P1]
- **Current design:** `Activity.status` is limited to `draft`, `published`, `cancelled`, and `completed`.
- **Baseline:** Vision NFR-USA-12 and UC-18 distinguish **Draft, Published, Ongoing, Completed, Cancelled**.
- **Recommendation:** Add `ongoing` and define valid lifecycle transitions. An activity's lifecycle and its registration window are separate concepts.

### DB-06 — Registration, Capacity, FIFO Waiting List, and Re-registration [P0]
- **Current design:** One `Registration` row per (`activity_id`, `user_id`), even after `cancelled`/`rejected`; statuses are `pending`, `approved`, `waitlisted`, `rejected`, and `cancelled`. Only `approved` occupies a seat. There is no explicit time/sequence for joining the waiting list.
- **Baseline:** UC-10–14, Vision Workflow 1, NFR-REL-01/02, and NFR-SCA-PHY-03 require consistent capacity, strict FIFO ordering, and automatic promotion. UC-14 explicitly leaves the **capacity accounting for pending approvals** unresolved.
- **Issue:** Prohibiting a new registration after cancellation or rejection is an unapproved policy. `registered_at` can serve FIFO **only if** it reliably reflects queue-entry time and has a deterministic tie-breaker. Database status labels (`approved`, `pending`) must also be mapped to use-case labels (Confirmed, Pending Approval).
- **Recommendation:** Define status mapping and transitions. Consider `waitlisted_at` plus a sequence/tie-breaker, or a `WaitingListEntry` entity, and specify transactional promotion. Decide whether re-registration reuses a row with attempt history or creates distinct `RegistrationAttempt` records with uniqueness limited to active states. The personal calendar can be derived from registrations, follows, and schedules; it need not be a separate entity.

### DB-07 — Capacity Reduction Below Confirmed Registrations [P1]
- **Current design:** Constraints prevent `approved` registrations from exceeding `capacity` and require locking for approval, cancellation, and promotion.
- **Baseline:** UC-18 A8 says that when capacity is reduced below confirmed attendance, the **most recently registered** excess participants are moved to the waiting list and notified.
- **Recommendation:** Specify how the capacity update and affected registration transitions occur atomically. Define which timestamp establishes “most recently registered” and where displaced students enter the queue. This requires business logic and transactional integrity, not just a database `CHECK` constraint.

### DB-08 — Incomplete Request Lifecycle [P0]
- **Current design:** `Appeal.status` supports only `submitted`, `in_review`, `approved`, and `rejected`. The semantic constraints allow resolved appeals to return to `in_review`.
- **Baseline:** UC-27 names **Pending Assignment, Pending Review, Under Review, Additional Information Required, Approved, Rejected, Withdrawn**. UC-25–27 support editing, adding evidence, resubmission, and withdrawal of unresolved requests; UC-27 A10 disallows student edits/withdrawals of Approved, Rejected, or Withdrawn requests.
- **Recommendation:** Standardize status values and transitions for both recognition requests and appeals. Add update/withdrawal metadata and revision history as needed. Do not presume a resolved request can be reopened without an approved escalation/reopening rule. Either `Appeal` or a more general `Request` entity name is acceptable if types and behavior are clearly modeled.

### DB-09 — Missing Request Assignment and Routing [P0]
- **Current design:** `Appeal.reviewed_by_user_id` records who reviewed a request but not its current assignee, assignment time, or Student Affairs authorization scope.
- **Baseline:** Vision Workflow 2 and its assignment note; UC-25 routes recognition to an **authorized Activity Manager in the Student Affairs Office**; UC-26 routes activity-specific appeals to the **responsible Activity Manager**. Requests with no eligible assignee remain Pending Assignment; UC-28 restricts handling to assigned/authorized managers.
- **Recommendation:** Introduce `assigned_to_user_id`, `assigned_organization_id`, or `RequestAssignment` with scope rules. Retain `reviewed_by_user_id` for the decision-maker, rather than using it as the pending assignee. A generic `appeal.review` permission must not grant access to all requests.

### DB-10 — Missing Data at Recognition Submission Time [P0]
- **Current design:** Activity title, occurrence date, target scoring semester, and criterion are stored in `Recognition`, but `Recognition` is created **only after approval**. The initial `Appeal` stores only an optional `activity_id`, `type`, and `description` for this purpose.
- **Baseline:** UC-25 step 3 requires activity details, **internal/external** classification, category (volunteering/academic/other), optionally a proposed criterion, and evidence. UC-28 requires reviewers to inspect this information **before deciding**.
- **Recommendation:** Add `RecognitionRequestDetail(request_id, title, occurred_at, is_internal, category, proposed_criterion_id?, target_semester_id?, ...)` or equivalent submission fields. A later `Recognition` row represents the **approved outcome**, not the original submission data. Confirm whether the recognition category is the same concept as catalog `ActivityCategory`.

### DB-11 — Missing-Score Appeals Cannot Always Reference a Score [P0]
- **Current design:** A `score_correction` appeal requires a non-null `score_id`.
- **Baseline:** Vision §5.9 allows appeals concerning **missing** as well as incorrect scores/records; UC-26 A1 permits selecting the related activity and describing a missing record rather than requiring an existing score ID.
- **Recommendation:** Allow `score_id` to be null **when the score is missing**, while identifying the activity and student. An `issue_type` (missing/incorrect) or equivalent subtype can guide conditional validation. Also clarify whether a participation correction without an existing registration is possible, or whether that scenario must use recognition instead.

### DB-12 — Evidence Requirements and Access Controls [P1]
- **Current design:** `AppealEvidence` permits `(0, N)` attachments and stores only `file_url`, `description`, and `uploaded_at`.
- **Baseline:** UC-25/26 require supporting evidence on submission. NFR-SEC-07 permits PDF/JPG/PNG files up to **10 MB**, accessible only to the student and authorized staff.
- **Recommendation:** Enforce **at least one valid attachment at submission** (zero may be acceptable for a draft if drafts are supported). Consider `mime_type`, `size_bytes`, and `storage_key` metadata plus authorization checks in the application/file service. A publicly accessible URL does not satisfy restricted-access requirements.

### DB-13 — Semester-Specific Scoring Policy Versioning [P0]
- **Current design:** `ScoreCriterion` includes `code`, `max_points`, and `is_active`. The proposal creates a new criterion after an older rule has been used but lacks explicit semester applicability/version relationships and applicable `weight` or score ranges.
- **Baseline:** Vision NFR-SCA-INT-05 and NFR-MAI-07; UC-22 A6, UC-24 A4, and UC-30 require historical scoring rules to remain valid, configuration of defined ranges, preview of affected semesters, and effective-semester handling.
- **Recommendation:** Consider `ScoringPolicyVersion` or `SemesterCriterion` (effective semester, criterion version, and relevant weight/range/cap) and link each score to the **actual rule applied**. Avoid retrospective changes to historical scores; determine what happens when administrators update rules within the same semester.

### DB-14 — Score Totals, Approved Adjustments, and Atomic Updates [P0]
- **Current design:** `TrainingScore.points_awarded` stores the current points; `ScoreChange` records old/new values for an existing score; an approved request can create `Recognition`. Business Requirements explicitly cover the transaction for **updating an existing score plus inserting `ScoreChange`**, but not the entire approval workflow.
- **Baseline:** Vision NFR-REL-03 requires score totals to equal verified participation records plus **approved adjustments**; NFR-SEC-06 requires score-adjustment and appeal-decision audit trails; UC-22/24/28 cover approvals when a score or record is **missing**. UC-28 A9 forbids a request from becoming Approved when its associated score/record update fails.
- **Recommendation:** Decide between (a) current score values with reliable audit/history and (b) base awards plus an adjustment ledger (`ScoreAdjustment`). Either approach must support **creating missing scores**, correcting existing ones, and preventing double counting. Request approval should commit decision/status + Participation/Recognition + TrainingScore/adjustment + audit in a consistent transaction. Email delivery/retries should be handled separately.

### DB-15 — Unconfirmed Attendance and Verification Assumptions [P1]
- **Current design:** Attendance is modeled per `ActivitySchedule`; **every session** must have an attendance result before `Participation` is created. The document also mentions camera-only QR attendance and an on-site signature fallback.
- **Baseline:** UC-21 supports attendance-file imports and manual edits, initially displays **No information**, uses **Attended/Absent**, and synchronizes participation and scores. Vision §5.6 requires manager recording/verification but does not mandate QR, signature capture, or attendance completion for every session before recognition.
- **Recommendation:** Retain per-session attendance if useful, but confirm the verification threshold (any session, every session, minimum attendance percentage, or manager approval). **No information** could be represented by the absence of an `Attendance` row. Do not treat QR/signature as an MVP requirement without approval.

### DB-16 — Notification Delivery, Email, and Related Records [P1]
- **Current design:** `Notification(recipient_user_id, activity_id?, type, message, created_at, read_at?)` primarily represents an in-app notification.
- **Baseline:** UC-17 requires **in-app and email** notifications for follow/registration/waitlist events, read/unread status, and separate retries when email fails. UC-25–28 also require request updates. Vision NFR-COM-05 and NFR-REL-04 require email and resilience to external-service failures.
- **Recommendation:** Preserve `Notification` for in-app records and add a reliable delivery mechanism such as `NotificationDelivery` or a transactional outbox (channel, status, attempts, error, sent_at). Support links to a request/announcement through validated relations or a well-defined related-entity mechanism. If retries are managed in infrastructure rather than tables, document how delivery failures and dropped events are handled.

### DB-17 — Audit Requirements Extend Beyond ScoreChange [P0]
- **Current design:** `ScoreChange` tracks score modifications, but there is no general tamper-resistant audit mechanism for roles/permissions, scoring criteria, request decisions, or request edits/withdrawals.
- **Baseline:** Vision NFR-SEC-06 requires **who/what/when/before/after** for score adjustments, appeal decisions, and system-setting changes. UC-25–30 additionally require change history for requests, imports, roles, and configurations.
- **Recommendation:** Introduce an `AuditLog` or domain-specific history entities with actor, action, affected entity/ID, timestamp, previous/new values, reason, and protections against unauthorized edits. `ScoreChange` may remain as domain-specific history but does not cover all system audit requirements.

### DB-18 — Extra Assumptions and Unresolved Policies [P1]
- **Current design:** The ability for Approved/Rejected requests to return to review.
- **Baseline:** UC-27 disallows student edits and withdrawals after resolution. 

## 3. Areas Already Reasonably Aligned

- `ActivitySchedule`, `ActivityEligibility`, `Registration`, `Attendance`, `Participation`, and `TrainingScore` broadly express the main registration → attendance → verified participation → scoring workflow, subject to the missing states/invariants discussed above.
- `ActivityAnnouncement` and `ServiceLink` align with UC-19 and UC-07. In particular, storing links rather than integrated external account data matches Vision §4.1.
- `UserInterest` supplies some input for UC-06 recommendations. Storing chatbot history in the database is **not necessarily required** if conversation context is maintained securely in another way.
- The calendar (UC-15/16), PDF/ICS exports (UC-16/20/31), and FAQ (UC-09) **do not necessarily require dedicated tables**. They may be derived from existing entities, generated on demand, or served as static content. The absence of a `Calendar`, `Export`, or `FAQ` entity is not automatically a gap.

## 4. Assumptions Requiring Explicit Confirmation

| ID | Existing or provisional assumption | Status |
|---|---|---|
| A-01 | A user has exactly one role, and higher-level roles automatically inherit student and all lower-level permissions. | **Not confirmed by Vision/UC**; may lead to over-privileged accounts. |
| A-02 | The university verifies student numbers and faculty data before students register for activities or submit appeals. | **Verification mechanism not defined**; Vision permits demonstrations without university-system integration. |
| A-03 | Pending Approval registrations never reserve seats; only Confirmed/Approved registrations consume capacity. | **Explicitly unresolved in UC-14**; must be decided for concurrent registrations. |
| A-04 | At most one `Registration` exists for an activity–student pair, even if a previous attempt was Cancelled/Rejected; re-registration would reuse that row or require an attempt-history model. | **Not confirmed**; uniqueness constraints should not decide re-registration policy by accident. |
| A-05 | Every activity belongs to exactly one semester, and all its sessions occur within that semester. | **Modeling assumption**; cross-semester activities are not specified in the baseline. |
| A-06 | All sessions must have attendance results before a manager can verify participation. | **Not confirmed**; recognition threshold is unspecified. |
| A-07 | Attendance uses QR scanning with an on-site signature fallback. | **Not present in Vision/UC**; should not be treated as mandatory. |
| A-08 | Negative training scores represent violations/penalties. | **No corresponding scoring rule in Vision/UC**; needs business approval. |
| A-09 | Once a criterion has been used, it cannot be edited; every new rule creates a separate criterion record. | **Implementation choice**; effective semesters and versioning still need to be modeled. |
| A-10 | Approved/Rejected requests may be reopened for a changed decision. | **No supporting use case**; unlike UC-27's closure of student actions on resolved requests. |
| A-11 | FAQ content, export files, and chatbot history must all be persisted in database tables. | **Should not be assumed**; persistent storage is not explicitly required for each. |

## 5. Open Questions for the Team/Product Owner Before Finalizing the ERD

### Critical decisions (P0)

1. **RBAC:** Can one account be both a Student and an Activity Manager? If so, should this use multiple roles or one role with additional permissions? Which permissions are scoped to an organization or activity?
2. **Organizations:** Can activities be created by clubs, faculties, and departments? Does an activity belong to one organization or multiple? How are authorized Student Affairs Office managers identified?
3. **Registration:** Does Pending Approval reserve capacity? Can students register again after cancellation/rejection? Which timestamp defines FIFO position, and how are ties broken?
4. **Waiting list:** When capacity is reduced, where do displaced confirmed students rank relative to students already waiting?
5. **Request lifecycle:** What is the final list of statuses and valid transitions? Can a resolved request be reopened? Does Additional Information Required update the same request or create a new revision?
6. **Routing:** Who assigns and reassigns recognition requests and appeals? Where do requests wait if no authorized manager is available? Is assignment history required?
7. **Missing record:** How should a student appeal a **nonexistent TrainingScore** using the related activity? If there is no Registration either, is a participation appeal permitted, or must the student submit a recognition request?
8. **Recognition:** Which submission fields are required (internal/external, category, occurrence date, target semester, proposed criterion)? Who chooses the final criterion and points?
9. **Scoring:** How do criterion versions, weights, ranges, and limits apply by semester? How are totals derived from awards and approved adjustments? How is double credit between participation and recognition prevented?
10. **Atomicity and audit:** Which tables participate in a recognition/appeal approval transaction? Which changes require before/after snapshots, and for how long should audit records be retained?

### Detailed-design decisions (P1/P2)

11. **Identity:** Without university-database integration, does student number/faculty come from administrator entry, CSV/XLSX import, university email, or another source?
12. **Attendance:** For multi-session activities, how many sessions must a student attend to be verified? Does Excused count, and under what rules?
13. **Penalties:** Are negative scores and violation deductions actually in scope? If so, what policy, approval, and audit requirements apply?
14. **Evidence:** Is the 10 MB limit **per file** or **per request**? Are external links accepted alongside uploaded files?
15. **Notifications:** Which events require emails? Are delivery status/retry details stored in the database or handled by infrastructure? Are notification preferences required?
16. **Profile:** Exactly which fields may users edit? Does the selected interface language persist between sessions or apply only to the current session?
17. **User deletion:** UC-29 includes deleting accounts. Should accounts be deactivated/anonymized to preserve at least three years of activity/registration/score history (NFR-SCA-PHY-04), or is a different retention/deletion policy required?
18. **Reporting/import:** How long should CSV/XLSX import validation results and rejected-row logs be stored, if at all? Are report metrics based on snapshots or live aggregation?

## 6. Recommended Order of Changes to Business Requirements

1. **Resolve core business rules before freezing the ERD:** DB-01, DB-02, DB-06, DB-08–DB-11, DB-13–DB-14, and DB-17; answer the corresponding P0 Open Questions.
2. **Revise entities and relationships:** Prioritize organization/membership, `ActivityFollow`, request details/assignment/history, semester-specific scoring policies, and system-wide audit history. Add `User.phone_number` and `Activity.status = ongoing`.
3. **Revise enumerations and domain constraints:** Specify status transitions, re-registration/uniqueness, FIFO/capacity, evidence validation, resource-scope authorization, and historical scoring consistency.
4. **Specify transactions and test scenarios:** Concurrent attempts for the last seat; cancellation and FIFO promotion; reduced capacity; approved appeals with or without existing scores; request edit/withdrawal; scoring policy updates that do not retroactively change historical scores; and email failures that do not roll back business transactions.
5. **Separate assumptions from requirements:** Flag decisions awaiting approval so technical choices (single role per user, QR attendance, negative points, re-registration restrictions) are not mistaken for confirmed business policy.

---

*Scope: Conceptual review of document consistency and database support for business workflows. This is not a SQL DDL, index, query-performance, or physical-schema review.*
