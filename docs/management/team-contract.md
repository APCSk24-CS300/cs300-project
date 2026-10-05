# Team Contract

## 1. Team Information

**Course:** [Course name / code]  
**Project:** [Project name]  
**Team Name:** [Team name]  
**Date Created:** [DD/MM/YYYY]  
**Contract Version:** [Version]

### Team Members

| Name | Student ID | Primary Role | Contact |
|---|---|---|---|
| [Member 1] | [ID] | [Role] | [Contact] |
| [Member 2] | [ID] | [Role] | [Contact] |
| [Member 3] | [ID] | [Role] | [Contact] |
| [Member 4] | [ID] | [Role] | [Contact] |

## 2. Team Roles and Responsibilities

All team members will participate as full-stack engineers. The primary roles below indicate the areas in which each member is expected to take leadership or primary responsibility. Other members are still expected to participate and contribute when necessary.

| Member | Primary Role | Main Responsibilities |
|---|---|---|
| [Name] | [e.g., Project Manager] | [Responsibilities] |
| [Name] | [e.g., UI/UX Lead] | [Responsibilities] |
| [Name] | [e.g., Backend Lead] | [Responsibilities] |
| [Name] | [e.g., Testing Lead] | [Responsibilities] |

### Shared Responsibilities

All members are expected to:

- Participate in planning and technical discussions.
- Contribute to frontend, backend, database, testing, and documentation tasks when required.
- Complete assigned tasks by agreed deadlines.
- Review other members' work when requested.
- Test their own work before submission or review.
- Attend agreed team meetings.
- Communicate blockers, delays, or problems as early as possible.
- Assist other members when reasonably necessary.

## 3. Communication Plan

### Communication Tools

| Purpose | Tool |
|---|---|
| Primary communication | [Discord / Zalo / Slack / Messenger] |
| Online meetings | [Google Meet / Discord / Zoom] |
| Source code | [GitHub / GitLab] |
| Task tracking | [GitHub Projects / Trello / Notion / Jira] |
| Documentation | [Google Docs / Notion / GitHub Wiki] |

### Response Expectations

- Members should respond to normal messages within **[X hours]**.
- Urgent messages should be acknowledged within **[X hours]**, when reasonably possible.
- Members who expect to be unavailable for more than **[X hours/days]** should notify the team in advance when possible.
- Members should report blockers that may affect deadlines as soon as they are identified.

### Meetings

**Meeting frequency:** [e.g., Twice per week]  
**Regular meeting time:** [Day and time]  
**Meeting platform:** [Platform]

Meeting expectations:

- Members should arrive on time.
- Members should notify the team beforehand if they cannot attend.
- Important decisions should be recorded in [tool/document].
- Each meeting should end with clearly assigned tasks and deadlines.

## 4. Work Schedule and Deadlines

### Team Availability

| Member | General Availability |
|---|---|
| [Name] | [Days and times] |
| [Name] | [Days and times] |
| [Name] | [Days and times] |
| [Name] | [Days and times] |

### Project Milestones

| Milestone | Deliverable | Responsible Member(s) | Deadline |
|---|---|---|---|
| [Planning] | [Deliverable] | [Names] | [Date] |
| [Design] | [Deliverable] | [Names] | [Date] |
| [Implementation Phase 1] | [Deliverable] | [Names] | [Date] |
| [Implementation Phase 2] | [Deliverable] | [Names] | [Date] |
| [Testing] | [Deliverable] | [Names] | [Date] |
| [Final Submission] | [Deliverable] | [Names] | [Date] |

### Internal Deadlines

Whenever possible, internal deadlines will be set **[X days] before the official deadline** to allow time for integration, testing, review, and corrections.

### Missed Deadlines

If a member expects to miss a deadline:

1. The member must notify the team as soon as possible.
2. The member must explain the current status of the task and the remaining work.
3. The team will determine whether to:
    - Extend the internal deadline.
    - Provide assistance.
    - Reduce or modify the task.
    - Reassign part or all of the task.
4. Repeated missed deadlines without reasonable communication may result in the accountability process being applied.

## 5. Task Assignment and Workflow

Tasks will be tracked using **[tool]**.

Each task should include:

- A clear description.
- Assigned member(s).
- Expected completion date.
- Acceptance criteria where appropriate.
- Links to related issues, branches, pull requests, or documents.

### Task Status

The team will normally use the following workflow:

`To Do → In Progress → Review / Testing → Done`

A task is considered complete only when:

- The implementation is finished.
- Relevant testing has been completed.
- Required documentation has been updated.
- The work has been reviewed where necessary.

## 6. Code and Documentation Standards

### Technology Stack

- **Frontend:** [Technology]
- **Backend:** [Technology]
- **Database:** [Technology]
- **Testing:** [Technology]
- **Version Control:** [GitHub / GitLab]
- **Other Tools:** [Tools]

### Coding Standards

The team agrees to:

- Follow the standard conventions of the language or framework being used.
- Use meaningful names for variables, functions, classes, components, and files.
- Keep functions and components reasonably focused.
- Avoid unnecessary code duplication.
- Remove unused or obsolete code before merging.
- Add comments when the purpose or reasoning of the code is not obvious.
- Avoid committing passwords, API keys, credentials, or other confidential information.

### Formatting and Linting

**Formatter:** [Tool]  
**Linter:** [Tool]

Code should pass agreed formatting and linting checks before being merged.

### Git Workflow

The team will use the following branch naming convention:

- `main` for the stable version.
- `develop` for [optional shared development branch].
- `feature/<feature-name>` for new features.
- `fix/<bug-name>` for bug fixes.

Example:

```text
feature/user-login
feature/product-search
fix/login-validation
```

### Commit Messages

Commit messages should clearly describe the change.

Preferred format:

```text
<type>: <short description>
```

Examples:

```text
feat: add user registration endpoint
fix: prevent duplicate email registration
test: add login validation tests
docs: update API documentation
```

Avoid vague commit messages such as:

```text
update
changes
stuff
fix
```

### Code Review

Before significant changes are merged:

1. The author should review their own changes.
2. Required tests should pass.
3. At least **[X]** other team member(s) should review the changes.
4. Requested changes should be addressed before merging.
5. Code with known critical issues should not be merged into the main branch.

### Testing

Each member is responsible for testing their own implementation before requesting review.

The team will perform, where applicable:

- Unit testing.
- Integration testing.
- API testing.
- UI or functional testing.
- Regression testing before major submissions.

Bugs will be tracked using **[GitHub Issues / Jira / Trello / other tool]**.

### Documentation

The project should maintain relevant documentation, including where applicable:

- `README.md`
- Installation and setup instructions.
- System architecture.
- API documentation.
- Database schema.
- User documentation.
- Testing documentation.
- Meeting notes.
- Important technical decisions.

Members are responsible for updating documentation when their work makes existing documentation inaccurate or incomplete.

## 7. Decision-Making Process

The team will attempt to make decisions through discussion and consensus.

If consensus cannot be reached within a reasonable amount of time, the team will use a **majority vote**.

For major technical decisions:

1. Relevant options should be identified.
2. Advantages, disadvantages, risks, and constraints should be discussed.
3. The team should prioritize project requirements, feasibility, maintainability, and deadlines.
4. Important decisions should be documented.

### Final Decision Authority

If a vote results in a tie, the final decision will be made by:

**[Project Manager / Technical Lead / designated member]**

If the disagreement is significant or cannot reasonably be resolved internally, the matter may be escalated to the TA or instructor.

## 8. Accountability and Performance

Each member is expected to contribute fairly and consistently to the project.

Contribution may be evaluated based on:

- Completion of assigned tasks.
- Quality of work.
- Timeliness.
- Code contributions.
- Participation in meetings and discussions.
- Code reviews.
- Testing contributions.
- Documentation contributions.
- Communication and reliability.
- Assistance provided to other team members.

### Underperformance Process

If a member is not meeting agreed expectations:

1. The issue should first be discussed directly with the member.
2. Clear expectations and corrective actions should be agreed upon.
3. The member should be given a reasonable opportunity to improve.
4. If the problem continues, the issue should be discussed with the full team.
5. Responsibilities may be reassigned if necessary to protect project progress.
6. Continued serious underperformance may be documented and reported to the TA or instructor.

### Consequences

Failure to follow this contract may result in:

- Additional team discussion.
- Reassignment of responsibilities.
- Reduced responsibility for critical tasks.
- Documentation of the issue in team records.
- Escalation to the TA or instructor.
- Other consequences permitted by the course policies.

## 9. Conflict Resolution

Team members agree to discuss disagreements professionally and focus on project-related facts and behavior rather than personal criticism.

The following process will be used:

1. **Direct Discussion**  
   The members involved should discuss the issue directly and attempt to reach an agreement.

2. **Team Discussion**  
   If the issue remains unresolved, it should be discussed with the full team.

3. **Team Decision**  
   The team will use the decision-making process defined in this contract.

4. **External Escalation**  
   If the issue cannot be resolved internally or seriously affects the project, the team may involve the TA or instructor.

Important conflicts and their resolutions should be documented when they affect responsibilities, deadlines, project quality, or assessment.

## 10. Contingency Plan

If unexpected problems occur, including illness, technical issues, scheduling conflicts, or major delays:

- The affected member should notify the team as soon as reasonably possible.
- The team should identify which tasks are affected.
- Critical tasks may be temporarily reassigned.
- Lower-priority features may be postponed or reduced if necessary.
- Project scope may be adjusted when appropriate and permitted by the course requirements.
- The team should prioritize completing a stable and functional project over unfinished optional features.

## 11. Review and Update Process

This contract will be reviewed:

- [Weekly / Every two weeks / At the end of each milestone].
- When a major issue affects the team's workflow.
- When team responsibilities or project requirements change significantly.

Any member may propose a change to the contract.

Changes should be:

1. Discussed with the team.
2. Approved by **[consensus / majority vote]**.
3. Recorded in the contract.
4. Assigned a new version number or revision date.

### Revision History

| Version | Date | Description of Changes | Approved By |
|---|---|---|---|
| 1.0 | [Date] | Initial contract | [Names] |
| [Version] | [Date] | [Changes] | [Names] |

## 12. Team Agreement

By agreeing to this contract, each team member confirms that they understand the expectations, responsibilities, communication rules, development standards, and accountability procedures described above.

Each member agrees to make a reasonable and consistent effort to support the team's objectives and complete the project successfully.

| Team Member | Signature / Confirmation | Date |
|---|---|---|
| [Name] | [Signature / Agreed] | [Date] |
| [Name] | [Signature / Agreed] | [Date] |
| [Name] | [Signature / Agreed] | [Date] |
| [Name] | [Signature / Agreed] | [Date] |