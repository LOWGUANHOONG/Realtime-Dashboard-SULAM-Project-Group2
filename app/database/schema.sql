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

-- 3. Table for Organizational Growth (Supports Multiple-Year Line Chart & KPIs)
CREATE TABLE org_stats (
    year INTEGER NOT NULL,
    month_num INTEGER NOT NULL, -- 1 for Jan, 2 for Feb (easier to find latest)
    month_name TEXT NOT NULL, -- "Jan", "Feb", etc.
    total_members INTEGER DEFAULT 0,
    council_members INTEGER DEFAULT 0,
    PRIMARY KEY (year, month_num)
);

-- 4. Table for Demographics (Supports Gender & Age Charts)
CREATE TABLE org_demographics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month TEXT NOT NULL, -- "Jan", "Feb", etc.
    category TEXT NOT NULL, -- "gender" or "age_range"
    label TEXT NOT NULL,    -- "Male", "Female", "18-23", etc.
    value INTEGER DEFAULT 0
);