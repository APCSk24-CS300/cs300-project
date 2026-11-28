-- All non-AI entity fixtures, including the 100 embedded original activities.
-- Included by seed.sql inside its transaction; lookup rows must already exist.
-- activities.csv is a source reference only and is not read at runtime.

CREATE TEMP TABLE activity_import_stage (
    activity_id TEXT,
    organization_name TEXT,
    title TEXT,
    description TEXT,
    eligibility_notes TEXT,
    category_name TEXT,
    capacity INTEGER,
    registration_opens_at TIMESTAMPTZ,
    registration_closes_at TIMESTAMPTZ,
    status TEXT,
    approval_required BOOLEAN,
    attendance_rule TEXT,
    created_at TIMESTAMPTZ
) ON COMMIT DROP;

INSERT INTO activity_import_stage (
    activity_id, organization_name, title, description, eligibility_notes, category_name, capacity, registration_opens_at, registration_closes_at, status, approval_required, attendance_rule, created_at
) VALUES
 ('ACT001', 'Academic Skills Club', 'Research Skills Bootcamp', 'A practical workshop on research questions, literature reviews, academic databases, and citation management.', 'Open to all undergraduate students.', 'Academic Workshop', '60', '2026-11-20 08:00:00+07', '2026-12-01 08:00:00+07', 'published', 'FALSE', 'Participants must check in and attend at least 80% of the session.', '2026-11-14 08:07:00+07'),
 ('ACT002', 'Academic Skills Club', 'Academic Writing Essentials', 'Learn to structure essays, develop clear arguments, and improve academic style through guided exercises.', 'Open to all students; basic English proficiency is recommended.', 'Academic Workshop', '50', '2026-11-20 08:00:00+07', '2026-12-02 08:00:00+07', 'published', 'FALSE', 'Arrive on time and complete the in-session writing activity.', '2026-11-14 08:14:00+07'),
 ('ACT003', 'Faculty of Mathematics and Computer Science', 'Introduction to Data Analysis', 'An introductory session covering data cleaning, descriptive statistics, and data visualization using practical examples.', 'Open to students interested in data analysis.', 'Academic Workshop', '70', '2026-11-20 08:00:00+07', '2026-12-03 08:00:00+07', 'published', 'FALSE', 'Bring a laptop with the required software installed.', '2026-11-14 08:21:00+07'),
 ('ACT004', 'English Speaking Club', 'Effective Presentation Techniques', 'Practice organizing presentations, designing slides, and speaking confidently to an audience.', 'Open to all students.', 'Academic Workshop', '45', '2026-11-20 08:00:00+07', '2026-12-04 08:00:00+07', 'published', 'FALSE', 'Participants should prepare a short introduction.', '2026-11-14 08:28:00+07'),
 ('ACT005', 'Academic Skills Club', 'Critical Thinking Seminar', 'Explore techniques for evaluating evidence, identifying assumptions, and constructing logical arguments.', 'Open to all undergraduate students.', 'Academic Workshop', '80', '2026-11-21 08:00:00+07', '2026-12-06 08:00:00+07', 'draft', 'FALSE', 'Attendance will be recorded at the entrance.', '2026-11-14 08:35:00+07'),
 ('ACT006', 'Career Services Center', 'Career Planning Day', 'A career guidance event featuring career planning activities, industry insights, and one-to-one consultations.', 'Open to undergraduate and postgraduate students.', 'Career Development', '120', '2026-11-21 08:00:00+07', '2026-12-07 08:00:00+07', 'published', 'FALSE', 'Check in at the registration desk and attend the opening briefing.', '2026-11-14 08:42:00+07'),
 ('ACT007', 'Career Services Center', 'CV and Cover Letter Clinic', 'Receive practical guidance on preparing a professional CV and writing tailored cover letters.', 'Open to students preparing for internships or employment.', 'Career Development', '40', '2026-11-21 08:00:00+07', '2026-12-08 08:00:00+07', 'published', 'FALSE', 'Bring a digital or printed copy of your current CV.', '2026-11-14 08:49:00+07'),
 ('ACT008', 'Business and Economics Club', 'Mock Interview Workshop', 'Practice common interview questions and receive feedback from volunteer interviewers.', 'Open to third- and fourth-year students.', 'Career Development', '30', '2026-11-21 08:00:00+07', '2026-12-01 08:00:00+07', 'published', 'TRUE', 'Selected participants must attend the full workshop.', '2026-11-14 08:56:00+07'),
 ('ACT009', 'Career Services Center', 'LinkedIn Profile Building', 'Learn how to build a professional online profile and connect with recruiters and alumni.', 'Open to all students.', 'Career Development', '60', '2026-11-22 08:00:00+07', '2026-12-03 08:00:00+07', 'published', 'FALSE', 'Bring a device to update your profile during the session.', '2026-11-14 09:03:00+07'),
 ('ACT010', 'Career Services Center', 'Internship Opportunities Fair', 'Meet recruiters and learn about internship opportunities across technology, business, and other industries.', 'Open to all students; some employers may set additional requirements.', 'Career Development', '250', '2026-11-22 08:00:00+07', '2026-12-04 08:00:00+07', 'draft', 'FALSE', 'Bring a student ID and follow exhibitor instructions.', '2026-11-14 09:10:00+07'),
 ('ACT011', 'Student Volunteer Network', 'Campus Clean-Up Day', 'Join volunteers in collecting litter and improving shared outdoor spaces around campus.', 'Open to all students and staff.', 'Community Service', '100', '2026-11-22 08:00:00+07', '2026-12-05 08:00:00+07', 'published', 'FALSE', 'Wear comfortable clothing and follow the safety briefing.', '2026-11-14 09:17:00+07'),
 ('ACT012', 'Student Volunteer Network', 'Book Donation Campaign', 'Collect gently used books and organize donations for community learning spaces.', 'Open to all members of the university community.', 'Community Service', '80', '2026-11-22 08:00:00+07', '2026-12-06 08:00:00+07', 'published', 'FALSE', 'Only clean and usable books will be accepted.', '2026-11-14 09:24:00+07'),
 ('ACT013', 'English Speaking Club', 'Community English Tutoring', 'Volunteer tutors support school pupils with basic English practice and learning activities.', 'Open to students with good English communication skills.', 'Community Service', '25', '2026-11-23 08:00:00+07', '2026-12-08 08:00:00+07', 'published', 'TRUE', 'Approved volunteers must attend the orientation session.', '2026-11-14 09:31:00+07'),
 ('ACT014', 'Student Affairs Office', 'Blood Donation Awareness Day', 'A campus awareness event providing information about blood donation and local donation opportunities.', 'Open to all students and staff; donation eligibility is determined by medical staff.', 'Community Service', '150', '2026-11-23 08:00:00+07', '2026-12-09 08:00:00+07', 'published', 'FALSE', 'Follow all instructions provided by healthcare professionals.', '2026-11-14 09:38:00+07'),
 ('ACT015', 'Student Volunteer Network', 'Winter Clothing Donation Drive', 'Collect and sort warm clothing for distribution to communities in need.', 'Open to all members of the university community.', 'Community Service', '100', '2026-11-23 08:00:00+07', '2026-12-10 08:00:00+07', 'draft', 'FALSE', 'Donations must be clean and in good condition.', '2026-11-14 09:45:00+07'),
 ('ACT016', 'International Student Club', 'International Food Festival', 'Celebrate cultural diversity through food booths, performances, and student-led cultural activities.', 'Open to all students, staff, and invited guests.', 'Cultural Event', '300', '2026-11-23 08:00:00+07', '2026-12-03 08:00:00+07', 'published', 'FALSE', 'Registered booth owners must arrive before setup time.', '2026-11-14 09:52:00+07'),
 ('ACT017', 'Arts and Culture Club', 'Traditional Music Showcase', 'A student performance event featuring traditional music from different regions and cultures.', 'Open to all members of the university community.', 'Cultural Event', '180', '2026-11-24 08:00:00+07', '2026-12-05 08:00:00+07', 'published', 'FALSE', 'Audience members must remain in designated seating areas.', '2026-11-14 09:59:00+07'),
 ('ACT018', 'International Student Club', 'Global Culture Exchange', 'Meet students from different backgrounds and take part in language and cultural exchange activities.', 'Open to all students.', 'Cultural Event', '100', '2026-11-24 08:00:00+07', '2026-12-06 08:00:00+07', 'published', 'FALSE', 'Participants should respect all cultures and viewpoints.', '2026-11-14 10:06:00+07'),
 ('ACT019', 'Student Union', 'Vietnamese Heritage Celebration', 'A celebration of Vietnamese heritage through exhibitions, games, music, and traditional activities.', 'Open to all students and staff.', 'Cultural Event', '250', '2026-11-24 08:00:00+07', '2026-12-07 08:00:00+07', 'published', 'FALSE', 'Please follow venue rules and event staff instructions.', '2026-11-14 10:13:00+07'),
 ('ACT020', 'International Student Club', 'International Film Night', 'Watch a selection of international short films followed by a moderated discussion.', 'Open to all students.', 'Cultural Event', '90', '2026-11-24 08:00:00+07', '2026-12-08 08:00:00+07', 'draft', 'FALSE', 'Late entry may be restricted after the screening begins.', '2026-11-14 10:20:00+07'),
 ('ACT021', 'University Sports Club', 'University Badminton Tournament', 'A friendly badminton tournament with singles and doubles divisions.', 'Open to currently enrolled students.', 'Sports and Recreation', '64', '2026-11-25 08:00:00+07', '2026-12-10 08:00:00+07', 'published', 'TRUE', 'Players must check in before their scheduled matches and follow tournament rules.', '2026-11-14 10:27:00+07'),
 ('ACT022', 'University Sports Club', 'Campus Fun Run', 'A non-competitive running event promoting physical activity and campus community spirit.', 'Open to students and staff who are able to participate safely.', 'Sports and Recreation', '200', '2026-11-25 08:00:00+07', '2026-12-11 08:00:00+07', 'published', 'FALSE', 'Participants must wear suitable running shoes and follow route marshals.', '2026-11-14 10:34:00+07'),
 ('ACT023', 'Student Affairs Office', 'Beginner Yoga Session', 'A guided beginner-friendly yoga session focused on flexibility, balance, and relaxation.', 'Open to all students; no prior experience is required.', 'Sports and Recreation', '35', '2026-11-25 08:00:00+07', '2026-12-12 08:00:00+07', 'published', 'FALSE', 'Bring a yoga mat and arrive ten minutes early.', '2026-11-14 10:41:00+07'),
 ('ACT024', 'University Sports Club', 'Five-a-Side Football Cup', 'A student football competition featuring teams from different faculties and clubs.', 'Open to currently enrolled students; team registration is required.', 'Sports and Recreation', '80', '2026-11-25 08:00:00+07', '2026-12-05 08:00:00+07', 'published', 'TRUE', 'Teams must arrive on time and comply with referee decisions.', '2026-11-14 10:48:00+07'),
 ('ACT025', 'University Sports Club', 'Table Tennis Open Day', 'An open day for students to learn table tennis basics and play friendly matches.', 'Open to all students.', 'Sports and Recreation', '50', '2026-11-26 08:00:00+07', '2026-12-07 08:00:00+07', 'draft', 'FALSE', 'Equipment will be provided; participants must take turns.', '2026-11-14 10:55:00+07'),
 ('ACT026', 'Computer Science Club', 'Introduction to Python Programming', 'A hands-on beginner workshop covering Python syntax, variables, conditions, loops, and simple functions.', 'Open to students interested in programming.', 'Technology and Innovation', '70', '2026-11-26 08:00:00+07', '2026-12-08 08:00:00+07', 'published', 'FALSE', 'Bring a laptop with Python installed or access to an online coding environment.', '2026-11-14 11:02:00+07'),
 ('ACT027', 'Computer Science Club', 'Web Development Hackathon', 'A team-based hackathon where participants build a working web prototype around a shared theme.', 'Open to university students with basic programming knowledge.', 'Technology and Innovation', '100', '2026-11-26 08:00:00+07', '2026-12-09 08:00:00+07', 'published', 'TRUE', 'Teams must submit their project before the announced deadline.', '2026-11-14 11:09:00+07'),
 ('ACT028', 'Robotics and AI Club', 'Robotics Demonstration Day', 'Explore student robotics projects and watch demonstrations of sensors, automation, and robot control.', 'Open to all students.', 'Technology and Innovation', '120', '2026-11-26 08:00:00+07', '2026-12-10 08:00:00+07', 'published', 'FALSE', 'Do not touch equipment unless invited by the demonstrator.', '2026-11-14 11:16:00+07'),
 ('ACT029', 'Robotics and AI Club', 'Introduction to Machine Learning', 'An introductory seminar explaining machine learning concepts, common workflows, and real-world applications.', 'Open to students with basic programming or mathematics knowledge.', 'Technology and Innovation', '80', '2026-11-27 08:00:00+07', '2026-12-12 08:00:00+07', 'published', 'FALSE', 'Participants are encouraged to bring a laptop.', '2026-11-14 11:23:00+07'),
 ('ACT030', 'Computer Science Club', 'Cybersecurity Awareness Workshop', 'Learn practical ways to recognize phishing, protect accounts, and improve personal digital security.', 'Open to all students and staff.', 'Technology and Innovation', '90', '2026-11-27 08:00:00+07', '2026-12-13 08:00:00+07', 'draft', 'FALSE', 'Do not share personal passwords or sensitive account information.', '2026-11-14 11:30:00+07'),
 ('ACT031', 'Photography Club', 'Student Photography Exhibition', 'An exhibition presenting student photographs on campus life, people, and everyday stories.', 'Open to all members of the university community.', 'Arts and Creativity', '150', '2026-11-27 08:00:00+07', '2026-12-14 08:00:00+07', 'published', 'FALSE', 'Visitors must not handle displayed photographs or equipment.', '2026-11-14 11:37:00+07'),
 ('ACT032', 'Arts and Culture Club', 'Creative Poster Design Workshop', 'Learn visual communication principles and create a poster using beginner-friendly design tools.', 'Open to all students.', 'Arts and Creativity', '40', '2026-11-27 08:00:00+07', '2026-12-07 08:00:00+07', 'published', 'FALSE', 'Bring a laptop if you wish to use digital design software.', '2026-11-14 11:44:00+07'),
 ('ACT033', 'Arts and Culture Club', 'Campus Sketching Meetup', 'A relaxed outdoor drawing meetup focused on observing and sketching campus architecture and scenery.', 'Open to all students; beginners are welcome.', 'Arts and Creativity', '30', '2026-11-28 08:00:00+07', '2026-12-09 08:00:00+07', 'published', 'FALSE', 'Bring your own sketchbook and drawing materials.', '2026-11-14 11:51:00+07'),
 ('ACT034', 'Arts and Culture Club', 'Student Music Open Mic', 'An open-mic event where students can perform music, poetry, or other short creative acts.', 'Open to all students; performers must register in advance.', 'Arts and Creativity', '100', '2026-11-28 08:00:00+07', '2026-12-10 08:00:00+07', 'published', 'FALSE', 'Performers must follow the stage schedule and content guidelines.', '2026-11-14 11:58:00+07'),
 ('ACT035', 'Photography Club', 'Short Film Production Challenge', 'Small teams create a short film based on a theme and present it to a student audience.', 'Open to all students; teams may include up to six members.', 'Arts and Creativity', '60', '2026-11-28 08:00:00+07', '2026-12-11 08:00:00+07', 'draft', 'TRUE', 'Teams must submit original work and obtain permission for copyrighted materials.', '2026-11-14 12:05:00+07'),
 ('ACT036', 'Green Campus Club', 'Tree Planting on Campus', 'Help plant and care for trees in designated campus areas to support a greener environment.', 'Open to all students and staff.', 'Environmental Sustainability', '75', '2026-11-28 08:00:00+07', '2026-12-12 08:00:00+07', 'published', 'FALSE', 'Wear closed-toe shoes and follow the gardening safety instructions.', '2026-11-14 12:12:00+07'),
 ('ACT037', 'Green Campus Club', 'Plastic-Free Campus Campaign', 'A campaign encouraging reusable items and reducing single-use plastic across campus.', 'Open to all members of the university community.', 'Environmental Sustainability', '120', '2026-11-29 08:00:00+07', '2026-12-14 08:00:00+07', 'published', 'FALSE', 'Participants should follow campaign guidelines when distributing materials.', '2026-11-14 12:19:00+07'),
 ('ACT038', 'Environmental Research Group', 'Sustainable Living Talk', 'A guest talk on practical sustainable habits, responsible consumption, and waste reduction.', 'Open to all students.', 'Environmental Sustainability', '100', '2026-11-29 08:00:00+07', '2026-12-15 08:00:00+07', 'published', 'FALSE', 'Please arrive before the speaker begins.', '2026-11-14 12:26:00+07'),
 ('ACT039', 'Green Campus Club', 'Recycling Awareness Booth', 'An interactive booth explaining waste sorting and recycling practices through short activities.', 'Open to all students and staff.', 'Environmental Sustainability', '80', '2026-11-29 08:00:00+07', '2026-12-16 08:00:00+07', 'published', 'FALSE', 'Use the marked bins and follow volunteer guidance.', '2026-11-14 12:33:00+07'),
 ('ACT040', 'Environmental Research Group', 'Campus Energy-Saving Challenge', 'A faculty and department challenge to identify practical ways to reduce energy use on campus.', 'Open to student groups and university departments.', 'Environmental Sustainability', '50', '2026-11-29 08:00:00+07', '2026-12-09 08:00:00+07', 'draft', 'TRUE', 'Teams must submit a short summary of their proposed actions.', '2026-11-14 12:40:00+07'),
 ('ACT041', 'Student Affairs Office', 'Mental Wellbeing Awareness Session', 'A supportive educational session about stress management, healthy routines, and available campus support services.', 'Open to all students.', 'Health and Wellbeing', '100', '2026-11-30 08:00:00+07', '2026-12-11 08:00:00+07', 'published', 'FALSE', 'Respect privacy and avoid sharing another participant''s personal information.', '2026-11-14 12:47:00+07'),
 ('ACT042', 'Student Affairs Office', 'Healthy Cooking Demonstration', 'A demonstration of simple, affordable, and balanced meals suitable for student life.', 'Open to all students.', 'Health and Wellbeing', '45', '2026-11-30 08:00:00+07', '2026-12-12 08:00:00+07', 'published', 'FALSE', 'Inform organizers of relevant food allergies before the session.', '2026-11-14 12:54:00+07'),
 ('ACT043', 'Student Affairs Office', 'First Aid Basics Workshop', 'Learn basic first aid awareness and how to respond while waiting for professional medical assistance.', 'Open to all students and staff.', 'Health and Wellbeing', '35', '2026-11-30 08:00:00+07', '2026-12-13 08:00:00+07', 'published', 'FALSE', 'Practical activities must be performed under instructor supervision.', '2026-11-14 13:01:00+07'),
 ('ACT044', 'Student Affairs Office', 'Sleep and Study Habits Seminar', 'Explore the relationship between sleep, concentration, and effective study routines.', 'Open to all students.', 'Health and Wellbeing', '90', '2026-11-30 08:00:00+07', '2026-12-14 08:00:00+07', 'published', 'FALSE', 'Keep mobile devices silent during the seminar.', '2026-11-14 13:08:00+07'),
 ('ACT045', 'Student Affairs Office', 'Campus Wellness Walk', 'A guided group walk designed to encourage movement, relaxation, and social connection.', 'Open to all students and staff.', 'Health and Wellbeing', '60', '2026-12-01 08:00:00+07', '2026-12-16 08:00:00+07', 'draft', 'FALSE', 'Wear comfortable footwear and remain with the group.', '2026-11-14 13:15:00+07'),
 ('ACT046', 'Student Union', 'Student Leadership Forum', 'A forum for students to discuss leadership, teamwork, and responsible participation in university life.', 'Open to student representatives and interested students.', 'Leadership and Personal Development', '120', '2026-12-01 08:00:00+07', '2026-12-17 08:00:00+07', 'published', 'FALSE', 'Participants are expected to contribute respectfully to discussions.', '2026-11-14 13:22:00+07'),
 ('ACT047', 'Student Union', 'Teamwork and Collaboration Workshop', 'Interactive activities that help students practice communication, delegation, and collaborative problem-solving.', 'Open to all students.', 'Leadership and Personal Development', '50', '2026-12-01 08:00:00+07', '2026-12-18 08:00:00+07', 'published', 'FALSE', 'Participants must take part in group exercises.', '2026-11-14 13:29:00+07'),
 ('ACT048', 'English Speaking Club', 'Public Speaking Competition', 'A student competition that develops public speaking skills through prepared speeches and judging.', 'Open to currently enrolled students; preliminary registration is required.', 'Leadership and Personal Development', '40', '2026-12-01 08:00:00+07', '2026-12-11 08:00:00+07', 'published', 'TRUE', 'Contestants must follow the time limit and competition rules.', '2026-11-14 13:36:00+07'),
 ('ACT049', 'Student Volunteer Network', 'Volunteer Leadership Training', 'Training for students who want to coordinate volunteer teams and community projects.', 'Open to current and prospective student volunteers.', 'Leadership and Personal Development', '35', '2026-12-02 08:00:00+07', '2026-12-13 08:00:00+07', 'published', 'TRUE', 'Attendance at all training modules is required.', '2026-11-14 13:43:00+07'),
 ('ACT050', 'Student Union', 'Student Project Management Bootcamp', 'A practical bootcamp covering project planning, task allocation, risk management, and progress tracking.', 'Open to all students; basic teamwork experience is helpful.', 'Leadership and Personal Development', '55', '2026-12-02 08:00:00+07', '2026-12-14 08:00:00+07', 'draft', 'FALSE', 'Participants should bring a laptop and complete the group exercise.', '2026-11-14 13:50:00+07'),
 ('ACT051', 'Computer Science Club', 'Database Design Challenge', 'A practical student event exploring current technology concepts through demonstrations, guided activities, and collaborative problem-solving.', 'Open to all currently enrolled students.', 'Technology and Innovation', '35', '2026-12-02 08:00:00+07', '2026-12-15 08:00:00+07', 'published', 'TRUE', 'Participants must check in at the registration desk.', '2026-11-14 13:57:00+07'),
 ('ACT052', 'Computer Science Club', 'UI/UX Design Sprint', 'A practical student event exploring current technology concepts through demonstrations, guided activities, and collaborative problem-solving.', 'Open to all students and university staff.', 'Technology and Innovation', '40', '2026-12-02 08:00:00+07', '2026-12-16 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 14:04:00+07'),
 ('ACT053', 'Computer Science Club', 'Open Source Contribution Meetup', 'A practical student event exploring current technology concepts through demonstrations, guided activities, and collaborative problem-solving.', 'Open to undergraduate students; beginners are welcome.', 'Technology and Innovation', '50', '2026-12-03 08:00:00+07', '2026-12-18 08:00:00+07', 'published', 'FALSE', 'Participants must follow the instructions of event organizers.', '2026-11-14 14:11:00+07'),
 ('ACT054', 'Robotics and AI Club', 'Cloud Computing Fundamentals', 'A practical student event exploring current technology concepts through demonstrations, guided activities, and collaborative problem-solving.', 'Open to students with an interest in the topic.', 'Technology and Innovation', '60', '2026-12-03 08:00:00+07', '2026-12-19 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 14:18:00+07'),
 ('ACT055', 'Robotics and AI Club', 'Internet of Things Project Showcase', 'A practical student event exploring current technology concepts through demonstrations, guided activities, and collaborative problem-solving.', 'Open to currently enrolled students; advance registration is required.', 'Technology and Innovation', '75', '2026-12-03 08:00:00+07', '2026-12-20 08:00:00+07', 'draft', 'FALSE', 'Participants are expected to stay for the full session.', '2026-11-14 14:25:00+07'),
 ('ACT056', 'Faculty of Mathematics and Computer Science', 'Mathematics Problem-Solving Contest', 'A learning-focused session that develops academic knowledge and practical study skills through examples and guided exercises.', 'Open to all currently enrolled students.', 'Academic Workshop', '90', '2026-12-03 08:00:00+07', '2026-12-13 08:00:00+07', 'published', 'FALSE', 'Participants must check in at the registration desk.', '2026-11-14 14:32:00+07'),
 ('ACT057', 'Faculty of Mathematics and Computer Science', 'Academic Research Poster Day', 'A learning-focused session that develops academic knowledge and practical study skills through examples and guided exercises.', 'Open to all students and university staff.', 'Academic Workshop', '100', '2026-12-04 08:00:00+07', '2026-12-15 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 14:39:00+07'),
 ('ACT058', 'English Speaking Club', 'English Debate Tournament', 'An interactive development session designed to strengthen communication, teamwork, decision-making, and leadership skills.', 'Open to undergraduate students; beginners are welcome.', 'Leadership and Personal Development', '120', '2026-12-04 08:00:00+07', '2026-12-16 08:00:00+07', 'published', 'TRUE', 'Participants must follow the instructions of event organizers.', '2026-11-14 14:46:00+07'),
 ('ACT059', 'English Speaking Club', 'IELTS Preparation Study Group', 'A learning-focused session that develops academic knowledge and practical study skills through examples and guided exercises.', 'Open to students with an interest in the topic.', 'Academic Workshop', '35', '2026-12-04 08:00:00+07', '2026-12-17 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 14:53:00+07'),
 ('ACT060', 'Academic Skills Club', 'Scientific Communication Workshop', 'A learning-focused session that develops academic knowledge and practical study skills through examples and guided exercises.', 'Open to currently enrolled students; advance registration is required.', 'Academic Workshop', '40', '2026-12-04 08:00:00+07', '2026-12-18 08:00:00+07', 'draft', 'FALSE', 'Participants are expected to stay for the full session.', '2026-11-14 15:00:00+07'),
 ('ACT061', 'Career Services Center', 'Alumni Networking Evening', 'A career-focused activity offering practical advice, professional insights, and opportunities to prepare for future employment.', 'Open to all currently enrolled students.', 'Career Development', '50', '2026-12-05 08:00:00+07', '2026-12-20 08:00:00+07', 'published', 'FALSE', 'Participants must check in at the registration desk.', '2026-11-14 15:07:00+07'),
 ('ACT062', 'Business and Economics Club', 'Entrepreneurship Idea Pitch', 'A career-focused activity offering practical advice, professional insights, and opportunities to prepare for future employment.', 'Open to all students and university staff.', 'Career Development', '60', '2026-12-05 08:00:00+07', '2026-12-21 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 15:14:00+07'),
 ('ACT063', 'Business and Economics Club', 'Personal Finance for Students', 'A career-focused activity offering practical advice, professional insights, and opportunities to prepare for future employment.', 'Open to undergraduate students; beginners are welcome.', 'Career Development', '75', '2026-12-05 08:00:00+07', '2026-12-22 08:00:00+07', 'published', 'FALSE', 'Participants must follow the instructions of event organizers.', '2026-11-14 15:21:00+07'),
 ('ACT064', 'Business and Economics Club', 'Business Case Competition', 'A career-focused activity offering practical advice, professional insights, and opportunities to prepare for future employment.', 'Open to students with an interest in the topic.', 'Career Development', '90', '2026-12-05 08:00:00+07', '2026-12-15 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 15:28:00+07'),
 ('ACT065', 'Career Services Center', 'Industry Guest Speaker Series', 'A career-focused activity offering practical advice, professional insights, and opportunities to prepare for future employment.', 'Open to currently enrolled students; advance registration is required.', 'Career Development', '100', '2026-12-06 08:00:00+07', '2026-12-17 08:00:00+07', 'draft', 'TRUE', 'Participants are expected to stay for the full session.', '2026-11-14 15:35:00+07'),
 ('ACT066', 'Student Volunteer Network', 'Children''s Learning Support Day', 'A volunteer activity supporting local communities and encouraging students to contribute their time and skills.', 'Open to all currently enrolled students.', 'Community Service', '120', '2026-12-06 08:00:00+07', '2026-12-18 08:00:00+07', 'published', 'FALSE', 'Participants must check in at the registration desk.', '2026-11-14 15:42:00+07'),
 ('ACT067', 'Green Campus Club', 'Community Garden Volunteer Day', 'A volunteer activity supporting local communities and encouraging students to contribute their time and skills.', 'Open to all students and university staff.', 'Community Service', '35', '2026-12-06 08:00:00+07', '2026-12-19 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 15:49:00+07'),
 ('ACT068', 'Student Union', 'Charity Fundraising Fair', 'A volunteer activity supporting local communities and encouraging students to contribute their time and skills.', 'Open to undergraduate students; beginners are welcome.', 'Community Service', '40', '2026-12-06 08:00:00+07', '2026-12-20 08:00:00+07', 'published', 'FALSE', 'Participants must follow the instructions of event organizers.', '2026-11-14 15:56:00+07'),
 ('ACT069', 'Computer Science Club', 'Digital Literacy for Seniors', 'A volunteer activity supporting local communities and encouraging students to contribute their time and skills.', 'Open to students with an interest in the topic.', 'Community Service', '50', '2026-12-07 08:00:00+07', '2026-12-22 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 16:03:00+07'),
 ('ACT070', 'Student Volunteer Network', 'Public Library Volunteer Visit', 'A volunteer activity supporting local communities and encouraging students to contribute their time and skills.', 'Open to currently enrolled students; advance registration is required.', 'Community Service', '60', '2026-12-07 08:00:00+07', '2026-12-23 08:00:00+07', 'draft', 'FALSE', 'Participants are expected to stay for the full session.', '2026-11-14 16:10:00+07'),
 ('ACT071', 'Arts and Culture Club', 'Traditional Dance Workshop', 'A student-led event celebrating cultural diversity through shared experiences, performances, and discussion.', 'Open to all currently enrolled students.', 'Cultural Event', '75', '2026-12-07 08:00:00+07', '2026-12-24 08:00:00+07', 'published', 'FALSE', 'Participants must check in at the registration desk.', '2026-11-14 16:17:00+07'),
 ('ACT072', 'International Student Club', 'Language Exchange Café', 'A student-led event celebrating cultural diversity through shared experiences, performances, and discussion.', 'Open to all students and university staff.', 'Cultural Event', '90', '2026-12-07 08:00:00+07', '2026-12-17 08:00:00+07', 'published', 'TRUE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 16:24:00+07'),
 ('ACT073', 'Photography Club', 'Cultural Photography Walk', 'A student-led event celebrating cultural diversity through shared experiences, performances, and discussion.', 'Open to undergraduate students; beginners are welcome.', 'Cultural Event', '100', '2026-12-08 08:00:00+07', '2026-12-19 08:00:00+07', 'published', 'FALSE', 'Participants must follow the instructions of event organizers.', '2026-11-14 16:31:00+07'),
 ('ACT074', 'International Student Club', 'Board Games Around the World', 'A student-led event celebrating cultural diversity through shared experiences, performances, and discussion.', 'Open to students with an interest in the topic.', 'Cultural Event', '120', '2026-12-08 08:00:00+07', '2026-12-20 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 16:38:00+07'),
 ('ACT075', 'Arts and Culture Club', 'Student Theatre Performance', 'A student-led event celebrating cultural diversity through shared experiences, performances, and discussion.', 'Open to currently enrolled students; advance registration is required.', 'Cultural Event', '35', '2026-12-08 08:00:00+07', '2026-12-21 08:00:00+07', 'draft', 'FALSE', 'Participants are expected to stay for the full session.', '2026-11-14 16:45:00+07'),
 ('ACT076', 'University Sports Club', 'Basketball Skills Clinic', 'A recreational activity that promotes physical fitness, friendly competition, and positive student connections.', 'Open to all currently enrolled students.', 'Sports and Recreation', '40', '2026-12-08 08:00:00+07', '2026-12-22 08:00:00+07', 'published', 'FALSE', 'Participants must check in at the registration desk.', '2026-11-14 16:52:00+07'),
 ('ACT077', 'University Sports Club', 'Volleyball Friendly Cup', 'A recreational activity that promotes physical fitness, friendly competition, and positive student connections.', 'Open to all students and university staff.', 'Sports and Recreation', '50', '2026-12-09 08:00:00+07', '2026-12-24 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 16:59:00+07'),
 ('ACT078', 'Student Union', 'Chess Tournament', 'A recreational activity that promotes physical fitness, friendly competition, and positive student connections.', 'Open to undergraduate students; beginners are welcome.', 'Sports and Recreation', '60', '2026-12-09 08:00:00+07', '2026-12-25 08:00:00+07', 'published', 'FALSE', 'Participants must follow the instructions of event organizers.', '2026-11-14 17:06:00+07'),
 ('ACT079', 'University Sports Club', 'Morning Fitness Meetup', 'A recreational activity that promotes physical fitness, friendly competition, and positive student connections.', 'Open to students with an interest in the topic.', 'Sports and Recreation', '75', '2026-12-09 08:00:00+07', '2026-12-26 08:00:00+07', 'published', 'TRUE', 'Attendance will be recorded at the venue.', '2026-11-14 17:13:00+07'),
 ('ACT080', 'University Sports Club', 'Table Tennis Doubles Tournament', 'A recreational activity that promotes physical fitness, friendly competition, and positive student connections.', 'Open to currently enrolled students; advance registration is required.', 'Sports and Recreation', '90', '2026-12-09 08:00:00+07', '2026-12-19 08:00:00+07', 'draft', 'FALSE', 'Participants are expected to stay for the full session.', '2026-11-14 17:20:00+07'),
 ('ACT081', 'Arts and Culture Club', 'Digital Illustration Workshop', 'A creative activity where students can explore artistic ideas, learn techniques, and share their work.', 'Open to all currently enrolled students.', 'Arts and Creativity', '100', '2026-12-10 08:00:00+07', '2026-12-21 08:00:00+07', 'published', 'FALSE', 'Participants must check in at the registration desk.', '2026-11-14 17:27:00+07'),
 ('ACT082', 'Photography Club', 'Mobile Photography Walk', 'A creative activity where students can explore artistic ideas, learn techniques, and share their work.', 'Open to all students and university staff.', 'Arts and Creativity', '120', '2026-12-10 08:00:00+07', '2026-12-22 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 17:34:00+07'),
 ('ACT083', 'Arts and Culture Club', 'Student Poetry Reading', 'A creative activity where students can explore artistic ideas, learn techniques, and share their work.', 'Open to undergraduate students; beginners are welcome.', 'Arts and Creativity', '35', '2026-12-10 08:00:00+07', '2026-12-23 08:00:00+07', 'published', 'FALSE', 'Participants must follow the instructions of event organizers.', '2026-11-14 17:41:00+07'),
 ('ACT084', 'Arts and Culture Club', 'Handmade Crafts Workshop', 'A creative activity where students can explore artistic ideas, learn techniques, and share their work.', 'Open to students with an interest in the topic.', 'Arts and Creativity', '40', '2026-12-10 08:00:00+07', '2026-12-24 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 17:48:00+07'),
 ('ACT085', 'Arts and Culture Club', 'Campus Mural Design Project', 'A creative activity where students can explore artistic ideas, learn techniques, and share their work.', 'Open to currently enrolled students; advance registration is required.', 'Arts and Creativity', '50', '2026-12-11 08:00:00+07', '2026-12-26 08:00:00+07', 'draft', 'FALSE', 'Participants are expected to stay for the full session.', '2026-11-14 17:55:00+07'),
 ('ACT086', 'Green Campus Club', 'Electronic Waste Collection Day', 'An activity promoting environmental awareness and practical actions for a more sustainable campus.', 'Open to all currently enrolled students.', 'Environmental Sustainability', '60', '2026-12-11 08:00:00+07', '2026-12-27 08:00:00+07', 'published', 'TRUE', 'Participants must check in at the registration desk.', '2026-11-14 18:02:00+07'),
 ('ACT087', 'Environmental Research Group', 'Biodiversity on Campus Walk', 'An activity promoting environmental awareness and practical actions for a more sustainable campus.', 'Open to all students and university staff.', 'Environmental Sustainability', '75', '2026-12-11 08:00:00+07', '2026-12-28 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 18:09:00+07'),
 ('ACT088', 'Green Campus Club', 'Sustainable Transport Campaign', 'An activity promoting environmental awareness and practical actions for a more sustainable campus.', 'Open to undergraduate students; beginners are welcome.', 'Environmental Sustainability', '90', '2026-12-11 08:00:00+07', '2026-12-21 08:00:00+07', 'published', 'FALSE', 'Participants must follow the instructions of event organizers.', '2026-11-14 18:16:00+07'),
 ('ACT089', 'Environmental Research Group', 'Water Conservation Awareness Day', 'An activity promoting environmental awareness and practical actions for a more sustainable campus.', 'Open to students with an interest in the topic.', 'Environmental Sustainability', '100', '2026-12-12 08:00:00+07', '2026-12-23 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 18:23:00+07'),
 ('ACT090', 'Green Campus Club', 'Upcycling Workshop', 'An activity promoting environmental awareness and practical actions for a more sustainable campus.', 'Open to currently enrolled students; advance registration is required.', 'Environmental Sustainability', '120', '2026-12-12 08:00:00+07', '2026-12-24 08:00:00+07', 'draft', 'FALSE', 'Participants are expected to stay for the full session.', '2026-11-14 18:30:00+07'),
 ('ACT091', 'Student Affairs Office', 'Healthy Habits Challenge', 'An educational and practical activity encouraging healthy routines, wellbeing, and a supportive campus community.', 'Open to all currently enrolled students.', 'Health and Wellbeing', '35', '2026-12-12 08:00:00+07', '2026-12-25 08:00:00+07', 'published', 'FALSE', 'Participants must check in at the registration desk.', '2026-11-14 18:37:00+07'),
 ('ACT092', 'Student Affairs Office', 'Mindfulness and Relaxation Workshop', 'An educational and practical activity encouraging healthy routines, wellbeing, and a supportive campus community.', 'Open to all students and university staff.', 'Health and Wellbeing', '40', '2026-12-12 08:00:00+07', '2026-12-26 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 18:44:00+07'),
 ('ACT093', 'Student Affairs Office', 'Ergonomics for Students Seminar', 'An educational and practical activity encouraging healthy routines, wellbeing, and a supportive campus community.', 'Open to undergraduate students; beginners are welcome.', 'Health and Wellbeing', '50', '2026-12-13 08:00:00+07', '2026-12-28 08:00:00+07', 'published', 'TRUE', 'Participants must follow the instructions of event organizers.', '2026-11-14 18:51:00+07'),
 ('ACT094', 'Student Affairs Office', 'Healthy Campus Food Fair', 'An educational and practical activity encouraging healthy routines, wellbeing, and a supportive campus community.', 'Open to students with an interest in the topic.', 'Health and Wellbeing', '60', '2026-12-13 08:00:00+07', '2026-12-29 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 18:58:00+07'),
 ('ACT095', 'Student Affairs Office', 'Peer Support Skills Workshop', 'An educational and practical activity encouraging healthy routines, wellbeing, and a supportive campus community.', 'Open to currently enrolled students; advance registration is required.', 'Health and Wellbeing', '75', '2026-12-13 08:00:00+07', '2026-12-30 08:00:00+07', 'draft', 'FALSE', 'Participants are expected to stay for the full session.', '2026-11-14 19:05:00+07'),
 ('ACT096', 'Student Union', 'Conflict Resolution Workshop', 'An interactive development session designed to strengthen communication, teamwork, decision-making, and leadership skills.', 'Open to all currently enrolled students.', 'Leadership and Personal Development', '90', '2026-12-13 08:00:00+07', '2026-12-23 08:00:00+07', 'published', 'FALSE', 'Participants must check in at the registration desk.', '2026-11-14 19:12:00+07'),
 ('ACT097', 'Business and Economics Club', 'Negotiation Skills Seminar', 'An interactive development session designed to strengthen communication, teamwork, decision-making, and leadership skills.', 'Open to all students and university staff.', 'Leadership and Personal Development', '100', '2026-12-14 08:00:00+07', '2026-12-25 08:00:00+07', 'published', 'FALSE', 'Please arrive ten minutes before the scheduled start.', '2026-11-14 19:19:00+07'),
 ('ACT098', 'Student Union', 'Student Organization Fair', 'An interactive development session designed to strengthen communication, teamwork, decision-making, and leadership skills.', 'Open to undergraduate students; beginners are welcome.', 'Leadership and Personal Development', '120', '2026-12-14 08:00:00+07', '2026-12-26 08:00:00+07', 'published', 'FALSE', 'Participants must follow the instructions of event organizers.', '2026-11-14 19:26:00+07'),
 ('ACT099', 'Student Volunteer Network', 'Event Planning Volunteer Workshop', 'An interactive development session designed to strengthen communication, teamwork, decision-making, and leadership skills.', 'Open to students with an interest in the topic.', 'Leadership and Personal Development', '35', '2026-12-14 08:00:00+07', '2026-12-27 08:00:00+07', 'published', 'FALSE', 'Attendance will be recorded at the venue.', '2026-11-14 19:33:00+07'),
 ('ACT100', 'International Student Club', 'Cross-Cultural Communication Workshop', 'An interactive development session designed to strengthen communication, teamwork, decision-making, and leadership skills.', 'Open to currently enrolled students; advance registration is required.', 'Leadership and Personal Development', '40', '2026-12-14 08:00:00+07', '2026-12-28 08:00:00+07', 'draft', 'TRUE', 'Participants are expected to stay for the full session.', '2026-11-14 19:40:00+07');

INSERT INTO "User" (user_id, is_active, email, password_hash, full_name, created_at)
SELECT id, TRUE, email, '$2a$10$8yqVXXbgTCqVjhcKmQSqUuwq8nMqMYap.dK2liR8kTFK3olHmtrv6',
       name, '2026-09-01 08:00+07'
FROM (VALUES
 ('SEED-ADMIN', 'admin@example.com', 'Demo Administrator'),
 ('SEED-MANAGER', 'manager@example.com', 'Nguyen Tran Anh Dung'),
 ('SEED-STUDENT-1', 'student1@example.com', 'Nguyen Minh Anh'),
 ('SEED-STUDENT-2', 'student2@example.com', 'Tran Bao Chau'),
 ('SEED-STUDENT-3', 'student3@example.com', 'Le Quang Huy')
) u(id, email, name);
INSERT INTO "Administrator" (user_id, office_name, position_title)
VALUES ('SEED-ADMIN', 'Student Affairs Office', 'System Administrator');
INSERT INTO "Manager" (user_id, position_title) VALUES ('SEED-MANAGER', 'Activity Coordinator');
INSERT INTO "Student" (user_id, major_id, faculty_id, enrollment_year) VALUES
 ('SEED-STUDENT-1', 'SEED-MAJ-CS', 'SEED-FAC-MCS', 2024),
 ('SEED-STUDENT-2', 'SEED-MAJ-SE', 'SEED-FAC-IT', 2024),
 ('SEED-STUDENT-3', 'SEED-MAJ-CS', 'SEED-FAC-MCS', 2025);

-- Original 100 activities, embedded from activities.csv.
INSERT INTO "Activity" (
    activity_id,
    organization_id,
    title,
    description,
    eligibility_notes,
    category_id,
    semester_id,
    capacity,
    registration_opens_at,
    registration_closes_at,
    status,
    approval_required,
    attendance_rule,
    created_by_user_id,
    created_at
)
SELECT
    s.activity_id,
    o.organization_id,
    s.title,
    s.description,
    s.eligibility_notes,
    c.category_id,
    20261,
    s.capacity,
    s.registration_opens_at,
    s.registration_closes_at,
    s.status,
    s.approval_required,
    s.attendance_rule,
    'SEED-MANAGER',
    s.created_at
FROM activity_import_stage s
JOIN "Organization" o
  ON o.name = s.organization_name
 AND o.is_active = TRUE
JOIN "ActivityCategory" c
  ON c.name = s.category_name
ORDER BY s.activity_id;

-- Completed historical fixture keeps the original CSV activity statuses intact.
INSERT INTO "Activity" (
 activity_id, organization_id, title, description, category_id, semester_id,
 capacity, registration_opens_at, registration_closes_at, status,
 approval_required, attendance_rule, created_by_user_id, created_at)
SELECT 'SEED-ACT-COMPLETED', o.organization_id, 'November Community Outreach',
 'Completed demo activity for attendance, participation and score history.',
 c.category_id, 20261, 30, '2026-11-01 08:00+07', '2026-11-10 08:00+07',
 'completed', FALSE, 'Attend the full session.', 'SEED-MANAGER', '2026-10-25 08:00+07'
FROM "Organization" o CROSS JOIN "ActivityCategory" c
WHERE o.name = 'Student Volunteer Network' AND c.name = 'Community Service';

INSERT INTO "ActivitySchedule" (activity_id, starts_at, ends_at, location)
SELECT activity_id, registration_closes_at + INTERVAL '1 day',
 registration_closes_at + INTERVAL '1 day 3 hours', 'HCMUS Campus - Main Hall'
FROM "Activity" WHERE created_by_user_id = 'SEED-MANAGER';

-- Historical confirmed participation plus a live pending and confirmed registration.
INSERT INTO "Registration" (activity_id, user_id, attempt_number, status, registered_at, confirmed_at)
VALUES
 ('SEED-ACT-COMPLETED', 'SEED-STUDENT-1', 1, 'confirmed', '2026-11-02 09:00+07', '2026-11-02 09:00+07'),
 ('SEED-ACT-COMPLETED', 'SEED-STUDENT-2', 1, 'confirmed', '2026-11-03 09:00+07', '2026-11-03 09:00+07'),
 ('ACT001', 'SEED-STUDENT-1', 1, 'confirmed', '2026-11-21 09:00+07', '2026-11-21 09:00+07'),
 ('ACT008', 'SEED-STUDENT-3', 1, 'pending_approval', '2026-11-22 09:00+07', NULL);
INSERT INTO "Participation" (registration_id, verified_by_user_id, verified_at, verification_reason)
SELECT registration_id, 'SEED-MANAGER', '2026-11-11 12:00+07', 'Full session attendance confirmed.'
FROM "Registration" WHERE activity_id = 'SEED-ACT-COMPLETED' AND user_id = 'SEED-STUDENT-1';
INSERT INTO "TrainingScore" (participation_id, policy_version_id, criterion_id, semester_id,
 base_points, weighted_points, points_awarded, awarded_at, awarded_by_user_id)
SELECT part.participation_id, p.policy_version_id, p.criterion_id, p.semester_id,
 5, 5, 5, '2026-11-12 08:00+07', 'SEED-MANAGER'
FROM "Participation" part JOIN "Registration" r ON r.registration_id = part.registration_id
JOIN "Activity" a ON a.activity_id = r.activity_id
JOIN "ScoringPolicyVersion" p ON p.semester_id = a.semester_id
JOIN "ScoreCriterion" c ON c.criterion_id = p.criterion_id
WHERE r.activity_id = 'SEED-ACT-COMPLETED' AND c.code = 'SEED-COMMUNITY';

-- Capture generated IDs rather than overriding identity sequences.
DO $$
DECLARE
 recognition_appeal BIGINT;
 participation_appeal BIGINT;
 correction_appeal BIGINT;
 recognition_record BIGINT;
 participation_score BIGINT;
 score_change BIGINT;
 score_adjustment BIGINT;
 policy "ScoringPolicyVersion"%ROWTYPE;
BEGIN
 SELECT p.* INTO STRICT policy FROM "ScoringPolicyVersion" p
 JOIN "ScoreCriterion" c USING (criterion_id)
 WHERE c.code = 'SEED-COMMUNITY' AND p.semester_id = 20261;
 SELECT ts.score_id INTO STRICT participation_score FROM "TrainingScore" ts
 JOIN "Participation" p USING (participation_id)
 JOIN "Registration" r USING (registration_id)
 WHERE r.user_id = 'SEED-STUDENT-1' AND r.activity_id = 'SEED-ACT-COMPLETED';

 INSERT INTO "Appeal" (submitted_by_user_id, type, description, status,
 assigned_to_user_id, reviewed_by_user_id, response, submitted_at, reviewed_at)
 VALUES ('SEED-STUDENT-1', 'recognition', 'Please recognize my external community service.',
 'approved', 'SEED-MANAGER', 'SEED-MANAGER', 'Participation verified from the submitted certificate.',
 '2026-11-14 09:00+07', '2026-11-16 10:00+07') RETURNING appeal_id INTO recognition_appeal;
 INSERT INTO "RecognitionRequestDetail" (appeal_id, title, occurred_at, is_internal,
 category, target_semester_id, proposed_criterion_id)
 VALUES (recognition_appeal, 'Community Library Volunteering', '2026-11-13 08:00+07',
 FALSE, 'volunteering', 20261, policy.criterion_id);
 INSERT INTO "Recognition" (appeal_id, student_user_id, title, occurred_at, semester_id,
 criterion_id, policy_version_id, verified_by_user_id, verified_at)
 VALUES (recognition_appeal, 'SEED-STUDENT-1', 'Community Library Volunteering',
 '2026-11-13 08:00+07', 20261, policy.criterion_id, policy.policy_version_id,
 'SEED-MANAGER', '2026-11-16 10:00+07') RETURNING recognition_id INTO recognition_record;
 INSERT INTO "TrainingScore" (recognition_id, policy_version_id, criterion_id, semester_id,
 base_points, weighted_points, points_awarded, awarded_at, awarded_by_user_id)
 VALUES (recognition_record, policy.policy_version_id, policy.criterion_id, 20261,
 4, 4, 4, '2026-11-16 10:00+07', 'SEED-MANAGER');

 INSERT INTO "Appeal" (submitted_by_user_id, activity_id, registration_id, type,
 description, status, assigned_to_user_id, submitted_at)
 SELECT 'SEED-STUDENT-2', activity_id, registration_id, 'participation_correction',
 'My student ID was not captured at check-in; please review the attendance sheet.',
 'under_review', 'SEED-MANAGER', '2026-11-14 11:00+07'
 FROM "Registration" WHERE activity_id = 'SEED-ACT-COMPLETED' AND user_id = 'SEED-STUDENT-2'
 RETURNING appeal_id INTO participation_appeal;
 INSERT INTO "RequestRevision" (appeal_id, edited_by_user_id, edited_at, previous_values, new_values)
 VALUES (participation_appeal, 'SEED-STUDENT-2', '2026-11-14 12:00+07',
 '{"description":"Please review my attendance."}',
 '{"description":"My student ID was not captured at check-in; please review the attendance sheet."}');

 INSERT INTO "Appeal" (submitted_by_user_id, activity_id, score_id, type, issue_type,
 description, status, assigned_to_user_id, reviewed_by_user_id, response, submitted_at, reviewed_at)
 VALUES ('SEED-STUDENT-1', 'SEED-ACT-COMPLETED', participation_score,
 'score_correction', 'incorrect_score', 'The organizer confirmed one additional service point.',
 'approved', 'SEED-MANAGER', 'SEED-MANAGER', 'Corrected the award from five to six points.',
 '2026-11-17 09:00+07', '2026-11-18 10:00+07') RETURNING appeal_id INTO correction_appeal;
 INSERT INTO "ScoreChange" (score_id, appeal_id, old_points, new_points, changed_by_user_id, changed_at, reason)
 VALUES (participation_score, correction_appeal, 5, 6, 'SEED-MANAGER', '2026-11-18 10:00+07',
 'Approved additional service point.') RETURNING change_id INTO score_change;
 INSERT INTO "ScoreAdjustment" (score_id, change_id, appeal_id, delta, approved_by_user_id, approved_at, reason)
 VALUES (participation_score, score_change, correction_appeal, 1, 'SEED-MANAGER',
 '2026-11-18 10:00+07', 'Approved additional service point.')
 RETURNING adjustment_id INTO score_adjustment;
 -- Original TrainingScore is immutable; the adjustment records the extra point.

 INSERT INTO "AppealEvidence" (appeal_id, storage_key, description, mime_type, size_bytes, uploaded_at)
 SELECT id, 'demo/appeals/' || id || '/certificate.pdf',
 'Demo metadata only; provision a matching file in storage before downloading.',
 'application/pdf', 1024, uploaded_at
 FROM (VALUES (recognition_appeal, '2026-11-14 09:00+07'::timestamptz),
 (participation_appeal, '2026-11-14 11:00+07'::timestamptz),
 (correction_appeal, '2026-11-17 09:00+07'::timestamptz)) e(id, uploaded_at);
 INSERT INTO "AuditLog" (actor_user_id, entity_type, entity_id, action, reason,
 before_values, after_values, occurred_at)
 VALUES ('SEED-MANAGER', 'ScoreAdjustment', score_adjustment::text, 'score.adjust',
 'Approved score correction.', '{"points":5}', '{"points":6}', '2026-11-18 10:00+07');
END $$;

INSERT INTO "ActivityAnnouncement" (activity_id, author_user_id, title, body, published_at)
VALUES ('ACT001', 'SEED-MANAGER', 'Prepare for the research bootcamp',
 'Bring your student ID and a laptop. Check the schedule for the room and start time.', '2026-11-23 09:00+07');
INSERT INTO "Notification" (recipient_user_id, activity_id, announcement_id, type, message, created_at)
SELECT 'SEED-STUDENT-1', activity_id, announcement_id, 'activity_announcement',
 'Research Skills Bootcamp: please bring your student ID and a laptop.', published_at
FROM "ActivityAnnouncement" WHERE activity_id = 'ACT001' AND author_user_id = 'SEED-MANAGER';
INSERT INTO "Notification" (recipient_user_id, appeal_id, type, message, created_at)
SELECT submitted_by_user_id, appeal_id, 'appeal_decision', response, reviewed_at
FROM "Appeal" WHERE submitted_by_user_id LIKE 'SEED-%' AND status = 'approved';
INSERT INTO "NotificationDelivery" (notification_id, channel, status)
SELECT notification_id, 'email', 'pending' FROM "Notification"
WHERE recipient_user_id LIKE 'SEED-%';
-- Synthetic, non-issued token identifier for development table coverage.
INSERT INTO "RefreshToken" (refresh_token_id, user_id)
VALUES ('seed-demo-not-an-issued-refresh-token', 'SEED-STUDENT-1');

