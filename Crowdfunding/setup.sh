#!/bin/bash

# Crowdfunding Platform Setup Script
# Creates the complete project structure with all necessary files

set -e

PROJECT_NAME="crowdfunding-platform"
echo "🚀 Setting up $PROJECT_NAME..."

# Create main project directory
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Initialize git
git init
echo "node_modules/
.env*
.next/
dist/
build/
coverage/
*.log
.DS_Store
.vscode/
.idea/" > .gitignore

# Create project structure
mkdir -p {frontend,backend,database,infrastructure,docs,scripts,tests}
mkdir -p frontend/{src/{components,pages,hooks,utils,types,styles},public}
mkdir -p backend/{src/{controllers,services,models,middleware,utils,types},tests}
mkdir -p database/{migrations,seeds,schemas}
mkdir -p infrastructure/{terraform,docker,k8s}
mkdir -p scripts/{dev,deploy,maintenance}

# Create package.json for workspace
cat > package.json << 'EOF'
{
  "name": "crowdfunding-platform",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "db:migrate": "cd backend && npm run db:migrate",
    "db:seed": "cd backend && npm run db:seed",
    "setup": "./scripts/dev/setup.sh",
    "deploy": "./scripts/deploy/deploy.sh"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
EOF

echo "✅ Project structure created"

# Setup database schema
cat > database/schemas/schema.sql << 'EOF'
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL DEFAULT 'backer' CHECK (role IN ('backer', 'creator', 'admin', 'moderator')),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'required')),
    country VARCHAR(2),
    email_verified BOOLEAN DEFAULT FALSE,
    oauth_providers JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    verified_badges TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE creators (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_info JSONB DEFAULT '{}',
    payout_account_id VARCHAR(100),
    risk_score INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending',
    total_raised DECIMAL(12,2) DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    goal_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    funding_model VARCHAR(10) NOT NULL DEFAULT 'aon' CHECK (funding_model IN ('aon', 'kia', 'milestone')),
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'submitted', 'live', 'succeeded', 'failed', 'cancelled', 'paid')),
    story_md TEXT,
    risks_md TEXT,
    timeline JSONB DEFAULT '[]',
    budget_breakdown JSONB DEFAULT '{}',
    media JSONB DEFAULT '{"cover": null, "gallery": [], "video": null}',
    country VARCHAR(2),
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT FALSE,
    staff_pick BOOLEAN DEFAULT FALSE,
    current_amount DECIMAL(12,2) DEFAULT 0,
    backers_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    updates_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    launch_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward Tiers
CREATE TABLE reward_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity_total INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    est_delivery_month INTEGER,
    est_delivery_year INTEGER,
    is_digital BOOLEAN DEFAULT FALSE,
    shipping_required BOOLEAN DEFAULT TRUE,
    max_per_backer INTEGER DEFAULT 1,
    early_bird BOOLEAN DEFAULT FALSE,
    early_bird_expires TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT quantity_check CHECK (quantity_sold <= quantity_total)
);

-- Add-ons
CREATE TABLE add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity_total INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping Rules
CREATE TABLE shipping_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    zone VARCHAR(50) NOT NULL,
    cost DECIMAL(8,2) NOT NULL,
    countries TEXT[] NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pledges and Orders
CREATE TABLE pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    reward_tier_id UUID REFERENCES reward_tiers(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'disputed')),
    payment_intent_id VARCHAR(100),
    transaction_id VARCHAR(100),
    referral_code VARCHAR(50),
    coupon_code VARCHAR(50),
    shipping_address JSONB,
    shipping_cost DECIMAL(8,2) DEFAULT 0,
    tax_amount DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id, reward_tier_id)
);

CREATE TABLE pledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pledge_id UUID NOT NULL REFERENCES pledges(id) ON DELETE CASCADE,
    reward_tier_id UUID REFERENCES reward_tiers(id),
    add_on_id UUID REFERENCES add_ons(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((reward_tier_id IS NOT NULL) OR (add_on_id IS NOT NULL))
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pledge_id UUID REFERENCES pledges(id),
    provider VARCHAR(20) NOT NULL,
    intent_id VARCHAR(100),
    charge_id VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    fee DECIMAL(8,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fulfillment
CREATE TABLE fulfillment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pledge_id UUID NOT NULL REFERENCES pledges(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'returned')),
    carrier VARCHAR(50),
    tracking_number VARCHAR(100),
    shipping_label_url VARCHAR(500),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updates and Communication
CREATE TABLE updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body_md TEXT NOT NULL,
    is_backers_only BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES comments(id),
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    payload JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System tables
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(500),
    processed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    transfer_id VARCHAR(100),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE moderation_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    reporter_id UUID REFERENCES users(id),
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing and Analytics
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('percent', 'fixed', 'free_shipping')),
    value DECIMAL(8,2) NOT NULL,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    partner VARCHAR(100),
    code VARCHAR(50) NOT NULL,
    source_url VARCHAR(500),
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    commission_rate DECIMAL(4,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_state ON projects(state);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_featured ON projects(featured) WHERE featured = true;
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_pledges_project ON pledges(project_id);
CREATE INDEX idx_pledges_user ON pledges(user_id);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_updates_project ON updates(project_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pledges_updated_at BEFORE UPDATE ON pledges FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EOF

echo "✅ Database schema created"
echo "🎉 Setup complete! Run 'cd $PROJECT_NAME && npm run setup' to continue"
