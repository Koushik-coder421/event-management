CREATE DATABASE IF NOT EXISTS campus_connect;
USE campus_connect;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('Student', 'ClubAdmin', 'CollegeAdmin') DEFAULT 'Student',
    Department VARCHAR(100),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clubs Table
CREATE TABLE IF NOT EXISTS Clubs (
    ClubID INT AUTO_INCREMENT PRIMARY KEY,
    ClubName VARCHAR(255) UNIQUE NOT NULL,
    Description TEXT,
    LogoURL VARCHAR(500),
    CreatedBy INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID) ON DELETE SET NULL
);

-- Events Table
CREATE TABLE IF NOT EXISTS Events (
    EventID INT AUTO_INCREMENT PRIMARY KEY,
    EventTitle VARCHAR(255) NOT NULL,
    Description TEXT,
    Rules TEXT,
    EventType VARCHAR(50) DEFAULT 'Single',
    TeamSize INT DEFAULT 1,
    EntryFee DECIMAL(10, 2) DEFAULT 0,
    Date DATE NOT NULL,
    Time TIME NOT NULL,
    Venue VARCHAR(255) NOT NULL,
    PosterURL VARCHAR(500),
    QRCode VARCHAR(500),
    MaxParticipants INT DEFAULT 0,
    RegistrationDeadline DATETIME,
    Status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    ClubID INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ClubID) REFERENCES Clubs(ClubID) ON DELETE CASCADE
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS Registrations (
    RegistrationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    EventID INT,
    RollNumber VARCHAR(50),
    StudentName VARCHAR(100),
    Email VARCHAR(255),
    Branch VARCHAR(100),
    Section VARCHAR(10),
    PhoneNumber VARCHAR(15),
    Year VARCHAR(10),
    Semester VARCHAR(10),
    TeamName VARCHAR(100),
    TeamMembers TEXT,
    TransactionID VARCHAR(100),
    PaymentScreenshot VARCHAR(500),
    PaymentMode VARCHAR(20) DEFAULT 'Online',
    EntryOTP VARCHAR(10),
    OTPUsed BOOLEAN DEFAULT FALSE,
    RegistrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE
    -- Removed UNIQUE constraint on UserID, EventID because a user might register multiple teams or try again? 
    -- Actually, usually unique is good, but let's keep it simple or allow re-registration if cancelled.
    -- The previous schema had UNIQUE(UserID, EventID). If I remove it, I should be careful.
    -- But wait, if I register as a team, maybe UserID is the leader.
    -- Let's stick to the previous UNIQUE constraint if it makes sense, but the model code doesn't explicitly enforce it on DB side, just inserts.
    -- However, the original schema had it. I'll keep it for now but note that with team registrations, maybe one user registers multiple times?
    -- No, usually one user one registration per event.
    , UNIQUE(UserID, EventID)
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS Announcements (
    AnnouncementID INT AUTO_INCREMENT PRIMARY KEY,
    EventID INT,
    Message TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS Notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Title VARCHAR(255),
    Message TEXT,
    Type ENUM('EventUpdate', 'Reminder', 'General') DEFAULT 'General',
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
