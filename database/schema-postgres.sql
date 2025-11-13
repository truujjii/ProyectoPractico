-- ============================================
-- Smart UNI-BOT Database Schema
-- PostgreSQL (Supabase)
-- ============================================

-- Tabla de Usuarios
CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastLogin TIMESTAMP
);

CREATE INDEX idx_users_email ON Users(Email);

-- Tabla de Clases/Horarios
CREATE TABLE Classes (
    ClassID SERIAL PRIMARY KEY,
    UserID INTEGER NOT NULL,
    SubjectName VARCHAR(200) NOT NULL,
    DayOfWeek INTEGER NOT NULL CHECK (DayOfWeek BETWEEN 0 AND 6),
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Location VARCHAR(100),
    Professor VARCHAR(100),
    SemesterYear INTEGER NOT NULL,
    SemesterPeriod VARCHAR(20) NOT NULL CHECK (SemesterPeriod IN ('Otoño', 'Primavera')),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE INDEX idx_classes_userid_day ON Classes(UserID, DayOfWeek);
CREATE INDEX idx_classes_userid_semester ON Classes(UserID, SemesterYear, SemesterPeriod);

-- Tabla de Tareas
CREATE TABLE Tasks (
    TaskID SERIAL PRIMARY KEY,
    UserID INTEGER NOT NULL,
    Title VARCHAR(300) NOT NULL,
    Description TEXT,
    Subject VARCHAR(200),
    DueDate DATE NOT NULL,
    Priority VARCHAR(20) CHECK (Priority IN ('Alta', 'Media', 'Baja')),
    IsCompleted BOOLEAN DEFAULT FALSE,
    CompletedAt TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_userid_duedate ON Tasks(UserID, DueDate);
CREATE INDEX idx_tasks_userid_completed ON Tasks(UserID, IsCompleted);

-- Tabla de Sesiones
CREATE TABLE Sessions (
    SessionID VARCHAR(255) PRIMARY KEY,
    UserID INTEGER NOT NULL,
    ExpiresAt TIMESTAMP NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_userid ON Sessions(UserID);
CREATE INDEX idx_sessions_expiresat ON Sessions(ExpiresAt);

-- Función para limpiar sesiones expiradas (se puede llamar periódicamente)
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM Sessions WHERE ExpiresAt < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
