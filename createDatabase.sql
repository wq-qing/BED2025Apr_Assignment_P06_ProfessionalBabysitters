CREATE DATABASE BED_ASSG

CREATE TABLE Users (
  Id       VARCHAR(10)   PRIMARY KEY,
  Name     NVARCHAR(100) NOT NULL,
  Email    VARCHAR(100)  NOT NULL UNIQUE,
  Password VARCHAR(255)  NOT NULL,
  Role     VARCHAR(20)   NOT NULL  -- "Doctor" or "Elderly"

);CREATE TABLE Conditions (
    id INT PRIMARY KEY NOT NULL,
    name NVARCHAR(255) NULL,
    startDate DATE NULL,
    status NVARCHAR(50) NULL,
    notes NVARCHAR(MAX) NULL
);

CREATE TABLE Appointments (
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,
    Date DATE NOT NULL,
    StartTime CHAR(5) NOT NULL,   -- e.g., '14:45'
    EndTime CHAR(5) NOT NULL,     -- e.g., '14:59'
    Doctor VARCHAR(50) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Reminders(
ReminderId CHAR(3) NOT NULL PRIMARY KEY,
MedName CHAR(20) NOT NULL,
MedDosage CHAR(6) NOT NULL,
ReminderTime CHAR(5) NOT NULL,
Frequency CHAR(15) NOT NULL
)

CREATE TABLE CallLogs (
  RoomId     UNIQUEIDENTIFIER NOT NULL,
  UserId     NVARCHAR(20)     NOT NULL,
  StartTime  BIGINT           NOT NULL,
  EndTime    BIGINT           NULL,
  Duration   INT              NULL,
  PRIMARY KEY (RoomId, UserId)
);

CREATE TABLE dbo.Rooms (
  RoomId    UNIQUEIDENTIFIER PRIMARY KEY,
  DoctorId  NVARCHAR(20)     NOT NULL,  
  Status    NVARCHAR(20)     NOT NULL
            CONSTRAINT DF_Rooms_Status DEFAULT ('open'),
  CONSTRAINT CHK_Rooms_Status CHECK (Status IN ('open','in use','closed'))
);

CREATE TABLE Notifications (
  id INT IDENTITY(1,1) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  message NVARCHAR(255) NOT NULL,
  createdAt DATETIME DEFAULT GETDATE(),
  isRead BIT DEFAULT 0
);