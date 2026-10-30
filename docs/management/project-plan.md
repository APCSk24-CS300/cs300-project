# myHCMUS - Software Development Plan

**Version:** 1.0 

**Team:** debug docker vào 25h sáng

## 1. Introduction
**Workers**: Phạm Vân Trang  
**Reviewers**: Phan Minh Khôi

The project is being developed by a six-member team as part of the CS300 - Elements of Software Engineering course. The team follows Scrum through five sprints corresponding to PA1-PA5. It involves developing myHCMUS, a web-based platform for managing extracurricular activities and student training scores at Ho Chi Minh City University of Science (HCMUS), along with the required documentation.

## 2. Project Overview
**Workers**: Phạm Vân Trang  
**Reviewers**: Phan Minh Khôi

**Goals:**

1. Develop a functional web-based platform that enables HCMUS students to discover and register for extracurricular activities, track their participation, and monitor their training scores, while providing organizers and administrators with tools to manage related activities and records.
2. Deliver the agreed software increments and required project artifacts through five Scrum sprints, with work tracked in Jira and completed by the applicable course deadlines.
3. Apply collaborative software engineering practices through task assignment, peer review, testing, documentation, and regular Scrum activities.
   
**Scope:** 

The project covers the development of the myHCMUS web application and the related software engineering artifacts required throughout PA1–PA5. The application is intended for HCMUS students, activity organizers, and administrators. The project does not include replacing existing university systems, integrating directly with official university databases, production deployment, or university-wide adoption.

**Project Deliverables:** 

The project is expected to produce the following deliverables:

1. **Project Documentation:** The management, requirements, reporting, design, and testing documents required by the project assignments, including the Project Plan, Vision Document, weekly reports, and AI usage reports.

2. **Web Application:** A functional web-based application that supports extracurricular activity management, registration, participation tracking, training-score management, and other proposed features.

3. **Source Code:** The complete source code of the application, including the necessary configuration files and database scripts.

4. **Spec Kit Artifacts:** All Spec Kit artifacts produced throughout the development process, including specifications, implementation plans, task lists, and generated tests.

5. **Testing Documentation:** Test plans, test cases, test execution results, and bug reports documenting the testing process and identified issues.

All deliverables will be developed and maintained throughout the five Scrum sprints and consolidated into a single final submission package at the end of the project.

**Assumptions:**

The project is based on the following assumptions:

1. Team availability: Team members will allocate sufficient time to complete assigned tasks and participate in Scrum activities throughout the semester.
2. Development resources: Team members will have access to the necessary hardware, software, development tools, and internet connectivity.
3. Requirements stability: The core requirements identified during the initial planning stage will remain sufficiently stable. Any changes will be reviewed and prioritized according to the available time and resources.
4. Project timeline: The recommended five-sprint schedule will remain feasible given the course deadlines, team availability, and changes resulting from instructor or TA feedback.

## 3. Project Organization
**Worker**: Phạm Vân Trang  
**Reviewer**: Phan Minh Khôi   
**Editor**: Phạm Vân Trang  

**Team Structure and Members' Role:**

The project is carried out by a student development team using Scrum practices. A Project Manager coordinates planning, task tracking, team communication, and deliverable preparation. Each member has a primary area of responsibility, while all members may contribute to requirements, documentation, frontend, backend, database, and testing work as needed.
In addition, the course instructor and teaching assistants provide feedback and review deliverables. 

| Role | Name | Responsibilities |
|---|---|---|
| Project Manager/Scrum Master | Trần Tôn Minh Kỳ | Coordinate Scrum activities, maintain the project schedule and Jira board, monitor progress. |
| UI/UX Manager | Nguyễn Khang Thịnh | Design application screens, oversee frontend development, and ensure UI/UX consistency. |
| UI/UX Designer | Nguyễn Văn Tĩnh | Develop the application frontend and integrate it with the backend. |
| Database Developer | Quách Thiên Lạc | Design the database schema, prepare data, and manage database structures. |
| Backend Developer | Phan Minh Khôi | Develop the application server, implement backend functionality, manage hosting, and handle AI-related features. |
| Tester | Phạm Vân Trang | Prepare test cases, test features, track defects, and verify fixes before each planned build. |

Note: The roles above define each member's primary responsibilities rather than exclusive tasks. Due to the course's learning objectives and the team's small size, all members are expected to contribute as full-stack developers. 

**Risk Management:**

The team will review risks during sprint planning and update mitigation actions when issues arise. The following are initial project risks; their likelihood and impact can be updated as the team gains more information.

| Risk | Likelihood | Impact | Potential effect | Mitigation strategy |
|---|---|---|---|---|
| **Member unavailability** | Medium | High | Delays in assigned tasks or reviews when a member is absent or has competing deadlines. | Assign a clear owner and reviewer for each task, keep tasks small, document progress in Jira and GitHub, and redistribute tasks early when availability changes. |
| **Technology or integration issues** | Medium | High | Delays caused by unfamiliar tools, API failures, database problems, or the AI service. | Run early technical experiments, implement and test features incrementally, keep fallback approaches, and avoid making core workflows depend on optional AI features. |
| **Scope creep** | High | High | Additional feature requests may prevent completion of essential functionality by PA5. | Prioritize core features, review changes during sprint planning, defer low-priority requests, and revise scope only after assessing time and effort. |
| **Schedule Delays** | Medium | High | Late completion of dependent tasks may reduce the time available for integration, testing, and correction before submission. | Break down large tasks into smaller, manageable tasks with clear deadlines. Monitor progress through Jira and regular Scrum meetings. Prioritize critical features and reserve time for integration and testing before the final sprint. |
| **Data or authorization errors** | Medium | High | Incorrect participation records, training scores, or access permissions may affect system correctness. | Use role-based authorization, validate inputs and business rules, test critical workflows, and use sample or authorized data during development. |

