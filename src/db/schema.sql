CREATE DATABASE "myHCMUS";


-------------------------------
--------- ENTITIES ------------
-------------------------------

--------- USER AND INTEREST ---------
CREATE TABLE "User" (
    user_id TEXT NOT NULL,
    role_id INT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, 
    full_name TEXT,

    student_name TEXT,
    faculty_id TEXT,
    avatar_url TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,

    CONSTRAINT PK_User_user_id
        PRIMARY KEY (user_id),
    
    CONSTRAINT FK_User_role_id
        FOREIGN KEY (role_id) REFERENCES Role(role_id),
    
    CONSTRAINT  FK_User_faculty_id
        FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id),
    
);

CREATE TABLE "UserInterest" (
    user_id TEXT, 
    category_id INT,

    CONSTRAINT FK_UserInterest_user_id
        FOREIGN KEY (user_id) REFERENCES "User"(user_id),
    
    CONSTRAINT FK_UserInterest_category_id 
        FOREIGN KEY (category_id) REFERENCES Category(category_id),

);

--------- Activity and Participation ---------

CREATE TABLE "Activity"(
    activity_id TEXT, 
    title TEXT,
    "description" TEXT,
    eligibility_notes TEXT,
    category_id INT,
    semester_id INT,
    capacity INT,
    registration_opens_at TIMESTAMP,
    registration_closes_at TIMESTAMP,
    "status" INT, 
    creator_id TEXT,
    created_at TIMESTAMP,

    CONSTRAINT PK_Activity_activity_id
        PRIMARY KEY (activity_id),

    CONSTRAINT FK_Activity_category_id
        FOREIGN KEY (category_id) REFERENCES "Category"(category_id),

    CONSTRAINT FK_Activity_semester_id
        FOREIGN KEY (semster_id)
        REFERENCES "Semester"(semester_id),
    
    CONSTRAINT FK_Activity_creator_id
        FOREIGN KEY (creator_id)
        REFERENCES "User"(user_id)

);
