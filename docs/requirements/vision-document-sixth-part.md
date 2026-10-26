# 6.Non-Functional Requirements

<!-- [Provide non-functional requirements that globally affect the product features descrived in the previous section. 

At a high level, list applicable standards, hardware, or platform requirements; performance requirements; and environmental requirements.

Define the quality ranges for performance, robustness, fault tolerance, usability, and similar characteristics that are not captured in the Feature Set.

Note any design constraints, external constraints, or other dependencies.

Define any specific documentation requirements, including user manuals, online help, installation, labeling, and packaging requirements.

Define the priority of these other product requirements. Include, if useful, attributes such as stability, benefit, effort, and risk.]
 -->

## 6.1 Overview of Non-Functional Requirements

**Purpose:** Provide non-functional requirements that globally affect the product features descrived in the previous section.  
**Worker:** Nguyễn Khang Thịnh   
**Reviewer(s):** Quách Thiên Lạc   
**Editor(s):** Nguyễn Khang Thịnh  
**Version:** Draft  
**Amendment:** 2026/26/10

<!-- Version: [v1.x / Draft / Final]  -->

## 6.2 Detailed Requirements

### I. Performance
> an indicator of how efficiently a digital solution uses the resources needed to perform its features. In other words, it helps track how quickly the system responds to users’ requests.

| NFR ID              | Requirement  |
| :----------------: | :------  |
| NFR-PER-01 | The overall response time from when a user sends request to receive the respond is less than 3 seconds |
| NFR-PER-02 | The system shall load the main pages within 2 seconds under the stable connection |
| NFR-PER-03 | If the system loads more than 1 second, the system shall show the loading indicators |
| NFR-PER-04 | The errors rate of the system shall be less than 5 percents |
| NFR-PER-05 | The errors rate of user making errors or having difficulties while completing a task be less than 10 percents |
| NFR-PER-06 | The delay after clikcs, taps or keyboard inputs on the features(e.g., button) is immediately interactive within 0.01 second  |
| NFR-PER-07| User cannot interact with the main page while the system in still in loading progress, response receiving,... |
| NFR-PER-08| The system shall avoid repeating unnecessary database queries when retrieving the same data multiple times with a single user request  |


### II. Scalability
> the ability of the system to demonstrate performance change in direct proportion to the growth of workloads. It allows you to check whether the program can perform its tasks as efficiently if the number of simultaneous visits increases.

#### 1. Physical

> Components that must scale, the feature that makes each scalable, the parameter to measure, and the target value.

| NFR ID              | Requirement  |
| :----------------: | :------  |
| NFR-SCA-PHY-01 | The system shall operate at least 1,000 users (includings students, organizers) at normal condition and approximate 5,000 at peak |
| NFR-SCA-PHY-02 | The system shall process over 200 requests per mininute for registration on a single event |
| NFR-SCA-PHY-03 | The system never allows to accept the requests that exceed the capability of an event |
| NFR-SCA-PHY-04 | The system shall store at least 3 years of an event history, including event information, registers, training score with no more than 10% slow down for searching & listing pages |
| NFR-SCA-PHY-05 | The system shall send reminders & event notifications to at least 1,000 users within 15 minutes when appropriate events are uploaded officially |
| NFR-SCA-PHY-06 | The AI-based assistant shall handle at least 200 concurrent requests, eahc answers within 30 seconds |
| NFR-SCA-PHY-07 | The system storage shall be up to 400GB-500GB to store files, photos (appeal evidence, avatar) and the storage shall be extensible without interrupting the service |


#### 2. Intangible

> Business growth, not technology growth, for a university activity and training-score platform.


### III. Portability
> a characteristic of a software product in terms of its portability from one environment to another. By the environment, in this case, we mean the operating system, the device used, the browser, and their versions.

### IV. Compability
> the ability of software to interact with other system components: apps, and processes in the current environment.

### V. Reliability
> the ability of the app to function smoothly for a specified time and under specified conditions.

### VI. Maintainability
> the time it takes to restore the program functionality after an error occurs. The term MTTRS – Mean Time to Restore Service – is often used to measure this indicator.

### VII. Availability
> the ratio of the time when the system is available to users and the downtime due to failures. A quality app is characterized by rapid recoverability; ideally, this process should be automated.

### VIII. Security
> the degree of security of the entire system and the data stored in it from unauthorized access due to hacker attacks.

### IX. Localization
> an indicator of how much a digital product is adapted to the specifics of a particular country. This can include interface and documentation translation, support for national standards, and more.

### X. Usability
>  the degree of ease of access to the program functions through the user interface. This indicator determines how many user actions  will be needed to achieve the goal.