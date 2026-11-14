# AI Log PA3

## 1. Declaration

AI tools were used as development and documentation assistants during
the design, planning, implementation, testing, and review of the myHCMUS
frontend Landing Page.

The AI-generated outputs were reviewed and iteratively directed by the
student. AI assistance does not replace the student's responsibility for
understanding, validating, and being able to explain the submitted
specifications, architecture, source code, and test results.

## 2. AI Tool and Platform

  -------------------------------------------------------------------------------------
  Item                                Details
  ----------------------------------- -------------------------------------------------
  Tool                                OpenCode

  Platform                            OpenCode CLI / terminal-based coding environment

  OpenCode version                    1.19.5

  Model provider                      OpenCode

  Model                               `deepseek-v4.1-flash-free`

  Agent modes observed                `build` and `plan`

  Project                             myHCMUS frontend, `src/client`

  Evidence                            `ai-session-speckit-setup(1).json` and
                                      `ai-session-landingpage-implementation(1).json`
  -------------------------------------------------------------------------------------

The exported session metadata reports a cost of 0 for both sessions.
This is the value recorded by the tool, not an independent billing
statement.

## 3. Access Time

All times below are Vietnam time (UTC+7), based on the timestamps
recorded in the exported OpenCode sessions.

  --------------------------------------------------------------------------------------------------------
  Session                 Recorded title                                           Access time
  ----------------------- -------------------------------------------------------- -----------------------
  1                       `myHCMUS frontend engineering principles constitution`   November 13, 2026,
                                                                                   00:13-02:46

  2                       `Landing page spec consistency analysis`                 November 13, 2026,
                                                                                   09:55-21:02
  --------------------------------------------------------------------------------------------------------

The second session contains multiple stages beyond consistency analysis,
including implementation, implementation refinements, progress
checkpointing, and a final read-only review.

## 4. Purpose and Prompts

The following are the main user instructions recorded in the session
exports. Repeated continuation messages (for example, "Continue if you
have next steps") are omitted because they continued the preceding task
rather than introducing a new objective. The complete prompts and
conversation history are retained in the accompanying JSON exports.

### 4.1 Engineering principles and project constitution

**Purpose:** Establish frontend engineering conventions before feature
development.

**Representative prompt:**

> Establish engineering principles for the myHCMUS frontend.
>
> Core principles: - Use Next.js App Router and TypeScript. - Follow a
> feature-first architecture. - Route HTTP communication through the
> shared API client. - Provide mock implementations behind the same
> service interfaces. - Separate API DTOs from UI/domain types using
> explicit mappers. - Reuse shared UI and layout components. - Use
> design tokens rather than hardcoded colors. - Handle loading, empty,
> error, and success states. - Require accessibility and maintainable
> separation of concerns.

**AI assistance:** Inspected existing frontend conventions and
generated/updated the project Constitution at
`.specify/memory/constitution.md`.

### 4.2 Landing Page specification

**Purpose:** Convert the supplied Landing Page requirements into a
testable feature specification.

**Representative prompt:**

> Build the public Landing Page at route `/`. Read
> `docs/spec/landing-page-spec.md` and the supplied UI reference as the
> primary sources. Define the six Landing Page sections, user-facing
> behavior, navigation and user flows, activity discovery behavior,
> loading/empty/error/success states, responsive behavior, and
> accessibility requirements.
>
> This is a frontend-only feature. Do not assume proposed API contracts
> are confirmed, do not modify backend code, identify unclear
> requirements and assumptions, and do not invent additional product
> features.

**AI assistance:** Generated the initial feature specification,
including user stories, functional requirements, success criteria, edge
cases, and a requirements checklist.

### 4.3 Requirement clarification

**Purpose:** Resolve ambiguities and inconsistencies between the written
requirements and the UI reference.

**Representative prompt:**

> Clarify the Landing Page specification. Compare the written
> requirements with the UI reference and identify ambiguous or
> conflicting behavior, especially activity selection and presentation,
> incomplete activity data, authentication-related navigation,
> responsive behavior, and accessibility.

**AI assistance:** Identified clarification points and incorporated the
student's answers into the feature specification. Decisions recorded in
the specification included handling incomplete activity records,
behavior when activities are not grouped, post-login destinations, the
guest services presentation, and the mobile navigation drawer.

### 4.4 Technical implementation plan

**Purpose:** Produce a frontend architecture and implementation plan
without implementing the feature.

**Representative prompt:**

> Create the technical implementation plan for the myHCMUS Landing Page.
> Inspect the existing package configuration, folder structure, routing,
> global styles, shared components, and authentication feature. Follow
> the project Constitution, reuse existing components, centralize API
> communication, separate DTOs and UI/domain types, provide
> interchangeable mock and real services, and document unconfirmed
> backend assumptions.
>
> Deliver the architecture, component hierarchy, folder structure, data
> flow, API strategy, mock data strategy, state management, and testing
> strategy. Do not implement the feature during planning.

**AI assistance:** Generated the implementation plan and supporting
design artifacts, including research, data model, service/API contracts,
UI component contracts, and quickstart documentation.

### 4.5 Implementation task breakdown

**Purpose:** Convert the plan into small, ordered, verifiable
implementation tasks.

**Representative prompt:**

> Generate an implementation task breakdown. Order tasks according to
> dependencies, identify parallel work, reference relevant requirements,
> and include acceptance or verification steps. Organize the work into
> foundation, reusable UI, Landing Page sections, integration, and
> quality assurance. Inspect the repository and reuse existing
> components. Do not modify backend code or implement the tasks yet.

**AI assistance:** Generated `tasks.md` with 112 tasks (`T001`-`T112`),
grouped into foundation, reusable UI, user-story implementation,
integration, and QA phases.

### 4.6 Specification consistency analysis

**Purpose:** Check whether the specification, plan, tasks, Constitution,
source requirements, and UI reference were consistent before
implementation.

**Representative prompt:**

> Perform a consistency analysis of the myHCMUS Landing Page feature.
> Check requirement coverage, architecture consistency, API assumptions,
> UI and responsive behavior, loading/empty/error/success states, task
> dependencies, missing tasks, and unnecessary duplication. Report
> critical issues, inconsistencies, missing requirements, and
> recommended corrections. Do not implement code.

**AI assistance:** Inspected the relevant artifacts and produced a
consistency analysis. The exported session also records an initial
prerequisite-path lookup that was corrected after identifying
`src/client` as the Spec Kit root.

### 4.7 Landing Page implementation

**Purpose:** Implement the Landing Page according to the finalized
specification, plan, task breakdown, and UI reference.

**Representative prompt:**

> Implement the myHCMUS Landing Page according to the finalized
> specification, implementation plan, and task breakdown. Follow task
> dependencies, implement only the defined scope, reuse components,
> follow the feature-first architecture, keep UI rendering independent
> of API implementation, use mock services when backend integration is
> unavailable, do not modify backend code, avoid unnecessary
> dependencies, and implement responsive and accessible interactions.
>
> After each logical group, run tests, TypeScript checks, and linting
> where available. Update task status only after implementation and
> verification.

**AI assistance:** Used OpenCode to read and modify frontend source
files, create components and supporting modules, update tests, run
development and verification commands, and update task/progress
documentation. The implementation work covered the Landing Page
sections, activity presentation and states, service presentation,
navigation, responsive behavior, and related tests.

### 4.8 Progress checkpoint and resumption

**Purpose:** Preserve work and make the implementation resumable.

**Representative prompts:**

> Finish the current operation safely, review changes, save progress to
> project files, identify unfinished tasks and potential issues, and
> create or update `PROGRESS.md` with completed work, modified files,
> status, blockers, remaining tasks, and resume commands. Do not discard
> existing changes.

> Resume the previous task. Read `PROGRESS.md`, inspect the repository
> and Git changes, verify completed work, continue from the next
> unfinished task, test changes, and update the progress file without
> overwriting or reverting existing work.

**AI assistance:** Updated `PROGRESS.md`, resumed implementation from
the recorded checkpoint, inspected existing changes, and continued
verification.

### 4.9 Student-requested implementation refinements

The student provided additional product decisions during implementation:

1.  The Landing Page header should provide navigation to the login page
    only, rather than navigating to a dashboard.
2.  Add two placeholder HCMUS services to complete a six-card, 3-by-2
    desktop grid. The cards should be display-only and inaccessible,
    with a gradient/transparent blur treatment and a "Log in for more"
    message.

**AI assistance:** Modified the relevant header and services components
and their tests according to these instructions. These changes were
subsequently identified in the read-only review as intentional
deviations from parts of the current written specification. They
therefore require the student/team to decide whether to update the
specification or change the implementation before release.

### 4.10 Final read-only implementation review

**Purpose:** Compare the current implementation against
`docs/spec/landing-page-spec.md` without changing files.

**Representative prompt:**

> Review the current Landing Page implementation against the
> specification. Do not modify files. Review Header, Hero, Highlights,
> Activities, Services, Help, and Footer for UI and behavioral
> deviations. Check activity states and layout cases,
> guest/authenticated services behavior, component reuse, design tokens,
> API-client usage, authentication conventions, and accessibility.
> Return a table of issues, severity, suggested fixes, and the top three
> priorities.

**AI assistance:** Performed a read-only review and reported
section-level discrepancies, including intentional differences
introduced by the student's later instructions. No files were modified
during this final review.

## 5. AI-Generated or AI-Assisted Work

The following work was generated or materially assisted by OpenCode
based on the student's instructions, repository contents, and iterative
decisions.

  ---------------------------------------------------------------------------
  Area                                AI-assisted output
  ----------------------------------- ---------------------------------------
  Engineering governance              `.specify/memory/constitution.md` and
                                      frontend engineering principles

  Requirements                        `specs/001-landing-page/spec.md`, user
                                      stories, functional requirements,
                                      success criteria, edge cases, and
                                      checklist

  Clarification                       Proposed clarification questions and
                                      edits to the specification based on the
                                      student's answers

  Technical design                    `plan.md`, `research.md`,
                                      `data-model.md`, `quickstart.md`, and
                                      contract documents under
                                      `specs/001-landing-page/`

  Work planning                       `tasks.md`, containing 112
                                      implementation and verification tasks

  Consistency review                  Analysis of requirement coverage,
                                      architecture, API assumptions, UI
                                      behavior, and task dependencies

  Frontend implementation             Landing Page components,
                                      services/hooks/mappers/configuration,
                                      navigation and layout refinements, and
                                      related source changes

  Testing                             Test cases and test updates for
                                      components, navigation, activity
                                      states, services, and
                                      accessibility-related behavior

  Project tracking                    `PROGRESS.md` updates and resumable
                                      implementation notes

  Final review                        Read-only comparison of the
                                      implementation against the source
                                      Landing Page specification
  ---------------------------------------------------------------------------

The implementation session's exported tool history records file reads,
writes, edits, shell commands, and test/build checks. The AI was
therefore used for more than grammar correction or brainstorming: it
materially assisted in producing both planning artifacts and application
code.

## 6. Work Performed Independently by the Student

The session history shows that the student directed the workflow and
supplied the project-specific requirements and decisions. In particular,
the student:

-   Supplied the initial engineering principles and feature scope.
-   Provided the source requirements and UI reference for the Landing
    Page.
-   Requested clarification and supplied answers to the questions raised
    during specification refinement.
-   Set the constraints for the technical plan, including frontend-only
    implementation and unconfirmed backend contracts.
-   Defined the desired task phases and verification expectations.
-   Initiated implementation and instructed the AI to follow the project
    artifacts and repository conventions.
-   Reviewed the implementation direction and supplied additional
    requirements for the header and HCMUS services.
-   Requested a final read-only review and explicitly prohibited file
    modifications during that review.

The student must independently review the resulting artifacts and code,
confirm that the implementation matches the team's final decisions,
validate test results in the actual project environment, and be able to
explain the architecture, components, service boundaries, data flow,
accessibility behavior, and tests. The session logs alone do not
establish that every AI-generated change was independently understood or
accepted.

## 7. Validation and Verification Recorded in the Sessions

The implementation session's final progress messages report the
following checks at different checkpoints:

-   TypeScript check (`npx tsc --noEmit`) passed.
-   ESLint completed with zero errors; two existing warnings were
    reported in `proxy.ts` and the student dashboard page.
-   Automated tests passed at multiple checkpoints. The session reports
    111/111 tests at one checkpoint and 109 tests after subsequent
    service-card changes. These are checkpoint-specific counts, not a
    claim that both counts describe the same final test run.
-   The default student/success production build passed at a reported
    checkpoint.
-   Browser-based checks covered activity loading and outcome scenarios,
    retries, image failures, guest and authenticated journeys, direct
    section hashes, browser Back/Forward behavior, and mobile navigation
    behavior.
-   The final read-only review identified remaining
    specification/implementation differences and release configuration
    or content decisions.

These are results reported in the exported AI session history. The
student should rerun the relevant commands against the final committed
state and retain the actual terminal/test evidence before submission.

## 8. Important Limitations and Student Review Required

-   The activity API contract and remote image host were treated as
    assumptions because backend integration was outside this frontend
    task and was not confirmed in the sessions.
-   Some production content and destinations remained unresolved,
    including service and guide destinations, final copy, activity
    detail routing, and metadata configuration.
-   The student's later request for a login-only header conflicts with
    the current specification's authenticated-user dashboard behavior.
-   The student's later request for all six service cards to be
    display-only conflicts with the specification's expected
    guest/authenticated service behavior.
-   The final review also reported UI/token, layout, and behavior
    differences that should be assessed against the team's intended
    design.
-   AI-generated source code, specifications, and plans must not be
    treated as authoritative without student review and validation.

## 9. Evidence and Reproducibility

The following exported OpenCode session files are retained as evidence
of the prompts, responses, tool calls, and session metadata:

1.  `ai-session-speckit-setup(1).json`
2.  `ai-session-landingpage-implementation(1).json`

These exports should be submitted or retained alongside this note if the
instructor requests prompt history or supporting evidence. They provide
more detailed interaction records than the representative prompts
reproduced above.

## 10. Student Declaration

I acknowledge that OpenCode with the `deepseek-v4.1-flash-free` model
was used to assist with the myHCMUS Landing Page specification,
planning, task breakdown, implementation, testing support, progress
documentation, and review, as described above.

I am responsible for reviewing and understanding the submitted work,
validating the implementation and test results, correcting any
inaccurate or unsuitable AI-generated content, and explaining the work
when requested.
