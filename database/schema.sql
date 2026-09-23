-- TESLA Management - PostgreSQL schema
-- Run: psql -d tesla_management -f database/schema.sql

CREATE TYPE record_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');
CREATE TYPE discount_type AS ENUM ('PERCENT', 'AMOUNT', 'NONE');

-- Package: a product/plan that can be offered
CREATE TABLE packages (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(30)  NOT NULL UNIQUE,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  price        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  status       record_status NOT NULL DEFAULT 'DRAFT',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign: a time-bounded promotion
CREATE TABLE campaigns (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(30)  NOT NULL UNIQUE,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  discount_type   discount_type NOT NULL DEFAULT 'NONE',
  discount_value  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  status          record_status NOT NULL DEFAULT 'DRAFT',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_date_range CHECK (end_date >= start_date),
  CONSTRAINT campaigns_percent_max CHECK (discount_type <> 'PERCENT' OR discount_value <= 100)
);

-- Agent: an individual sales agent
CREATE TABLE agents (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(30)  NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150),
  phone       VARCHAR(30),
  status      record_status NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent group: a named set of agents
CREATE TABLE agent_groups (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(30)  NOT NULL UNIQUE,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  status       record_status NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_group_members (
  group_id  INT NOT NULL REFERENCES agent_groups(id) ON DELETE CASCADE,
  agent_id  INT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, agent_id)
);

-- Combination: Package + Agent group + Campaign
CREATE TABLE combinations (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  package_id      INT NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  agent_group_id  INT NOT NULL REFERENCES agent_groups(id) ON DELETE RESTRICT,
  campaign_id     INT REFERENCES campaigns(id) ON DELETE RESTRICT,
  status          record_status NOT NULL DEFAULT 'DRAFT',
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT combinations_unique_set UNIQUE NULLS NOT DISTINCT (package_id, agent_group_id, campaign_id)
);

CREATE INDEX idx_members_agent ON agent_group_members(agent_id);
CREATE INDEX idx_comb_package ON combinations(package_id);
CREATE INDEX idx_comb_group ON combinations(agent_group_id);
CREATE INDEX idx_comb_campaign ON combinations(campaign_id);
