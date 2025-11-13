-- ============================================
-- Smart UNI-BOT Database Schema
-- Azure SQL Database
-- ============================================

-- Tabla de Usuarios
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(100) NULL,
    LastName NVARCHAR(100) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME NULL,
    INDEX IX_Users_Email (Email)
);

-- Tabla de Clases/Horarios
CREATE TABLE Classes (
    ClassID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    SubjectName NVARCHAR(200) NOT NULL,
    DayOfWeek INT NOT NULL CHECK (DayOfWeek BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Location NVARCHAR(100) NULL,
    Professor NVARCHAR(100) NULL,
    SemesterYear INT NOT NULL,
    SemesterPeriod NVARCHAR(20) NOT NULL CHECK (SemesterPeriod IN ('Otoño', 'Primavera')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX IX_Classes_UserID_Day (UserID, DayOfWeek),
    INDEX IX_Classes_UserID_Semester (UserID, SemesterYear, SemesterPeriod)
);

-- Tabla de Tareas
CREATE TABLE Tasks (
    TaskID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    Title NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    RelatedSubject NVARCHAR(200) NULL,
    DueDate DATE NOT NULL,
    Priority NVARCHAR(20) NULL CHECK (Priority IN ('Alta', 'Media', 'Baja')),
    IsCompleted BIT DEFAULT 0,
    CompletedAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX IX_Tasks_UserID_DueDate (UserID, DueDate),
    INDEX IX_Tasks_UserID_Completed (UserID, IsCompleted)
);

-- Tabla de Sesiones
CREATE TABLE Sessions (
    SessionID NVARCHAR(255) PRIMARY KEY,
    UserID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX IX_Sessions_UserID (UserID),
    INDEX IX_Sessions_ExpiresAt (ExpiresAt)
);

-- Procedimientos almacenados para operaciones comunes

-- Limpiar sesiones expiradas
CREATE PROCEDURE CleanExpiredSessions
AS
BEGIN
    DELETE FROM Sessions WHERE ExpiresAt < GETDATE();
END;
GO

-- Obtener horario del día
CREATE PROCEDURE GetScheduleForDay
    @UserID INT,
    @DayOfWeek INT
AS
BEGIN
    SELECT 
        ClassID,
        SubjectName,
        DayOfWeek,
        StartTime,
        EndTime,
        Location,
        Professor
    FROM Classes
    WHERE UserID = @UserID AND DayOfWeek = @DayOfWeek
    ORDER BY StartTime;
END;
GO

-- Obtener tareas pendientes
CREATE PROCEDURE GetPendingTasks
    @UserID INT
AS
BEGIN
    SELECT 
        TaskID,
        Title,
        Description,
        RelatedSubject,
        DueDate,
        Priority,
        CreatedAt
    FROM Tasks
    WHERE UserID = @UserID AND IsCompleted = 0
    ORDER BY DueDate ASC, Priority DESC;
END;
GO

-- Obtener próxima tarea
CREATE PROCEDURE GetNextTask
    @UserID INT
AS
BEGIN
    SELECT TOP 1
        TaskID,
        Title,
        Description,
        RelatedSubject,
        DueDate,
        Priority
    FROM Tasks
    WHERE UserID = @UserID AND IsCompleted = 0 AND DueDate >= CAST(GETDATE() AS DATE)
    ORDER BY DueDate ASC, Priority DESC;
END;
GO
