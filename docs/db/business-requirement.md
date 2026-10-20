# Business requirements analysis

This document describes the business purpose, actors, entities and attributes, relationships and cardinalities, and constraints of the app myHCMUS. The source of product requirements is the [project proposal](../management/project-proposal.md), supported by the [product survey](../survey/existing-app-survey.md). 

# Business purpose

myHCMUS helps university students discover and take part in extracurricular activities while keeping their participation history and training scores visible in one web-based platform. Students can browse activities, check eligibility and schedules, register or cancel within the permitted period, follow registration updates, and view their activities in a personal calendar. They can also review scores by semester and evaluation criterion, receive relevant reminders, and request recognition or correction when a participation record or score is missing or inaccurate.

Activity organizers use the platform to create and manage activities, capacity, schedules, eligibility and training-score criteria; review registrations and waiting lists; record attendance; and submit verified participation results. Staff review appeals and supporting evidence, while administrators manage system-wide criteria and use reports and statistics to monitor participation, registration trends, and score distribution. Accounts and roles control access to each workflow, and profiles hold the personal and academic information needed to support them.

The business record connects **activity → registration → attendance and verified participation → training score → appeal or correction** so students and staff can trace how a score was earned or changed. The platform also provides a hub for university services and an AI student assistant that recommends activities using students' interests, schedules, participation history, and training-score needs.
