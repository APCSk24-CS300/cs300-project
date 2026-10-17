# Existing App Survey
**Workers**: Phan Minh Khôi  
**Reviewers**: Trần Tôn Minh Kỳ  
**Editors**: Phan Minh Khôi

After consulting with teammates and TAs, this survey is therefore reduced and mainly focus on conduct score features. This survey covers two existing websites that are similar to myHCMUS: the UEH and HCMUS conduct score website.

## App 1: UEH Conduct Score Website

| | |
|---|---|
| **Platform** | Website |
| **Purpose** | A dedicated website for everything related to conduct scoring of UEH students |
| **Target users** | UEH students and Staff |
| **Main sections** | Dashboard, Activities, Requests, Conduct Score, Profile, Utilities |

### Homepage 

![][image0]

### Dashboard

![][image1]  
![][image2]

### Activities

- All activities

![][image3]  
![][image4]  
Note: The activity statuses include: “Approved”, “In progress”, “Awaiting participant list update”, “Registration open”, etc.  
![][image5]

- Activities open for registration

![][image6]

### Requests

- Evidence documents for activities outside UEH

![][image7]  
![][image8]  
![][image9]

- GreenCampus score appeal 

![][image10]

- Conduct score appeal

![][image11]  
![][image12]

### Conduct Score

- Current semester score:

![][image13]  
![][image14]  
![][image15]  
![][image16]

- Full-course history

![][image17]  
![][image18]  
![][image19]

### Profile

(This page displays the student's personal information, so no screenshot is attached.)

### Utilities

- QR check-in scan

![][image20]

- Check-in history

![][image21]

### Review 

- Strengths: The user interface (UI) and user experience (UX) are intuitive, easy to use and convenient.  
- Weaknesses: None identified yet.

## App 2: HCMUS Conduct Score Website

| | |
|---|---|
| **Platform** | Website |
| **Purpose** | A dedicated website for everything related to conduct scoring of HCMUS students |
| **Target users** | HCMUS students and Staff |
| **Main sections** | Dashboard, Certificate Registration, Complaint History, Profile, Sign Out |

### Dashboard (Homepage)

![][image22]

### Certificate Registration

![][image23]

### Complaint History

![][image24]

### Profile 

![][image25]

### Sign Out
This feature is not a new page but a button. When clicked, immediately sign out.

### Review 

- Strengths: The user interface (UI) and user experience (UX) are intuitive, easy to use and convenient. Have `Certificate Registration` section that UEH's doesn't have.
- Weaknesses: Not much functionality compare to UEH's (e.g., `Activities` registration)

## Comparison Summary

### Feature comparison

Legend: $\checkmark$ = found, - = not observed (only the student view of each site was surveyed).

| myHCMUS feature (from the proposal) | UEH Conduct Score | HCMUS Conduct Score |
|---|---|---|
| Authentication and role-based access | $\checkmark$ Student login | $\checkmark$ Student login, Sign Out button |
| Profile management | $\checkmark$ Profile | $\checkmark$ Account info (name, date of birth and email editable, academic info read-only) |
| Activity discovery (browse, search, filter) | $\checkmark$ Search by name or code; filters by academic year/semester, status, conduct-score criteria, Green Campus criteria and organizing unit | - |
| Activity registration management | $\checkmark$ "Open for registration" list with capacity bars and roles, "View my registration results" | - |
| Activity management for organizers | - | - |
| Training score by semester and criteria | $\checkmark$ Current semester and full-course history | $\checkmark$ Per semester, broken down by the 5 criteria, with total and classification |
| Participation tracking / attendance | $\checkmark$ QR check-in and check-in history | - |
| Calendar and reminders | - | - |
| Scheduling conflict detection | - | - |
| Appeal management | $\checkmark$ Conduct score appeal, GreenCampus appeal, evidence for activities outside UEH | $\checkmark$ Appeal button on the dashboard (time-limited), Complaint History with filters |
| Certificate of conduct score | - | $\checkmark$ Certificate Registration (by semester, year or full course; quantity; pickup campus) |
| System administration and reports | - | - |
| University Services Hub (links to Moodle, Student Portal, tuition) | - | - |
| AI Student Assistant | - | - |

### Common ground

- **The conduct score is the centre of the site.** Both sites open on a dashboard about the student's score.
- **Scores are organised by semester.** Students can switch between semesters and look back at earlier results.
- **There is a formal appeal process.** Both sites let students appeal their score and track what happened to the appeal.
- **Navigation is short and simple.** Both use a few top-level sections with clear labels.

Neither site shows a calendar, reminders, links to other university systems or any recommendations. Activities (UEH) and scores (both sites) are shown as lists and tables, not as a plan of what the student should do next.

### What myHCMUS will do differently or better

1. **Activities and scores in one place at HCMUS.** The current HCMUS site only shows the result: the score, appeals and certificates. Students cannot find or register for activities there. myHCMUS adds activity discovery, registration and participation tracking for HCMUS students, as UEH already does.
2. **Activity discovery that goes further than UEH's.** UEH already has strong search: students can search by activity name or code and filter by academic year/semester, status, conduct-score criteria, Green Campus criteria and organizing unit. myHCMUS keeps these filters (faculty, criteria, registration status) and adds category, date and location filters. Each activity will also show its eligibility requirements and registration deadline, which the UEH list does not.
3. **Fuller registration management.** UEH shows how many places are left and marks full activities as "full", but registration stops there. In myHCMUS, a full activity gets a waiting list instead. Students can also cancel within the allowed period, and organizers can approve or reject applications.
4. **A personal calendar with reminders.** Neither site has a calendar. myHCMUS puts registered activities in a calendar, sends reminders for upcoming activities, deadlines and schedule changes, and warns students before they register for overlapping activities.
5. **Tools for organizers and administrators.** Both sites were seen only as student portals. myHCMUS gives organizers tools to create activities, publish announcements, submit verified participation results, adjust scores, answer appeals, and view statistics or export reports. Administrators manage categories and system settings.
6. **Appeals linked to the evidence.** Both sites have appeals, but they are separate from the activity records. In myHCMUS, a student can appeal a specific missing or incorrect participation record, and the organizer's response updates the status of the case.
7. **University Services Hub.** Students reach Moodle, the Student Portal and tuition payment from one dashboard. They no longer need to remember separate URLs.
8. **AI Student Assistant.** Neither site helps students choose activities. The myHCMUS assistant recommends activities based on the student's interests, schedule, participation history and the training-score criteria they still need.

### UI/UX patterns we plan to adopt

| Pattern | Source | How we will use it |
|---|---|---|
| Short, intuitive top-level sections (Dashboard, Activities, Requests, Score, Profile, Utilities) | UEH Conduct Score | Navigation structure, adapted to myHCMUS features |
| Score summary card (total and classification) next to a breakdown by criteria | HCMUS Conduct Score (Dashboard) | Training-score page, organized by semester and evaluation criteria |
| Semester / academic-year selectors | HCMUS Conduct Score (Dashboard) | Switch between semesters on score and history pages |
| Current-semester score plus full-course history | UEH Conduct Score (Conduct Score) | Training-score history for students |
| Filter panel (year/semester, status, criteria, organizing unit) with keyword search and a reset button | UEH Conduct Score (All activities) | Activity discovery page |
| Status tags and an "open for registration" view | UEH Conduct Score (Activities) | Activity list with registration status |
| Capacity bar with places remaining, and each role showing its criterion and points | UEH Conduct Score (Open for registration) | Activity cards, so students see capacity and score value before registering |
| QR check-in and check-in history | UEH Conduct Score (Utilities) | Attendance at activities, feeding the participation records |
| Separate request types (evidence, score appeal) | UEH Conduct Score (Requests) | Appeal management for missing or incorrect records |
| Appeal button that is disabled outside the appeal period, with a clear message | HCMUS Conduct Score (Dashboard) | Show students when they can and cannot appeal |
| History table with filters by semester and status, and pagination | HCMUS Conduct Score (Complaint History) | Appeal history and registration history |
| Profile where only some fields can be edited | HCMUS Conduct Score (Account info) | Profile management: personal info editable, academic info read-only |

[image0]: ../assets/survey/UEH_Conduct_HomePage.png
[image1]: ../assets/survey/UEH_Conduct_Dashboard_0.png
[image2]: ../assets/survey/UEH_Conduct_Dashboard_1.png
[image3]: ../assets/survey/UEH_Conduct_ActivitiesAll_0.png
[image4]: ../assets/survey/UEH_Conduct_ActivitiesAll_1.png
[image5]: ../assets/survey/UEH_Conduct_ActivitiesAll_2.png
[image6]: ../assets/survey/UEH_Conduct_ActivitiesOpenRegistration.png
[image7]: ../assets/survey/UEH_Conduct_RequestsEvidence_0.png
[image8]: ../assets/survey/UEH_Conduct_RequestsEvidence_1.png
[image9]: ../assets/survey/UEH_Conduct_RequestsEvidence_2.png
[image10]: ../assets/survey/UEH_Conduct_RequestsGreenCampusAppeal.png
[image11]: ../assets/survey/UEH_Conduct_RequestsConductScoreAppeal_0.png
[image12]: ../assets/survey/UEH_Conduct_RequestsConductScoreAppeal_1.png
[image13]: ../assets/survey/UEH_Conduct_ScoreCurrentSemester_0.png
[image14]: ../assets/survey/UEH_Conduct_ScoreCurrentSemester_1.png
[image15]: ../assets/survey/UEH_Conduct_ScoreCurrentSemester_2.png
[image16]: ../assets/survey/UEH_Conduct_ScoreCurrentSemester_3.png
[image17]: ../assets/survey/UEH_Conduct_ScoreHistory_0.png
[image18]: ../assets/survey/UEH_Conduct_ScoreHistory_1.png
[image19]: ../assets/survey/UEH_Conduct_ScoreHistory_2.png
[image20]: ../assets/survey/UEH_Conduct_UtilitiesQRCheckIn.png
[image21]: ../assets/survey/UEH_Conduct_UtilitiesCheckInHistory.png
[image22]: ../assets/survey/HCMUS_Conduct_Dashboard.png
[image23]: ../assets/survey/HCMUS_Conduct_CertificateRegistration.png
[image24]: ../assets/survey/HCMUS_Conduct_ComplaintHistory.png
[image25]: ../assets/survey/HCMUS_Conduct_Profile.png
