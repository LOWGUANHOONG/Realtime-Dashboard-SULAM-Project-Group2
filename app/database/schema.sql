-- 1. Table for the 5 Cultural Sites
CREATE TABLE sites (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    established_year INTEGER
);

-- 2. Table for Monthly Site Data (Supports 15 Site Charts + Master Graph)
CREATE TABLE site_monthly_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    year INTEGER NOT NULL,
    month TEXT NOT NULL, -- "Jan", "Feb", etc.
    donations DECIMAL(10, 2) DEFAULT 0,
    sponsorships DECIMAL(10, 2) DEFAULT 0,
    volunteers INTEGER DEFAULT 0,
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- 3. Table for Organizational Growth (Supports 5-Year Line Chart & KPIs)
CREATE TABLE org_stats (
    year INTEGER PRIMARY KEY,
    total_members INTEGER DEFAULT 0,
    council_members INTEGER DEFAULT 0,
    total_volunteers INTEGER DEFAULT 0
);

-- 4. Table for Demographics (Supports Gender & Age Charts)
CREATE TABLE org_demographics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL, -- "gender" or "age_range"
    label TEXT NOT NULL,    -- "Male", "Female", "18-24", etc.
    value INTEGER DEFAULT 0,
    as_of_year INTEGER NOT NULL
);