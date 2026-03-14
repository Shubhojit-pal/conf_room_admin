-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed');
CREATE TYPE cancellation_status AS ENUM ('pending', 'approved', 'denied', 'completed');
CREATE TYPE notification_channel AS ENUM ('email', 'slack', 'in_app');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'user',
  department TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table for access control
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"view_analytics": true, "manage_bookings": false, "approve_bookings": false, "manage_rooms": false, "manage_users": false, "configure_integrations": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conference rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER NOT NULL,
  amenities JSONB DEFAULT '[]', -- ["projector", "whiteboard", "video_conference", "coffee_machine"]
  equipment JSONB DEFAULT '[]', -- ["tv", "sound_system", "dock"]
  booking_advance_days INTEGER DEFAULT 30,
  max_booking_duration_hours INTEGER DEFAULT 4,
  auto_approval_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_status DEFAULT 'pending',
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  calendar_sync_id TEXT, -- Google Calendar or Outlook event ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Cancellation requests table
CREATE TABLE cancellation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reason TEXT,
  status cancellation_status DEFAULT 'pending',
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval workflow rules table
CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE, -- NULL = apply to all rooms
  user_role_required user_role DEFAULT 'manager',
  auto_approve_condition JSONB DEFAULT '{}',
  -- Example: {"time_of_day": "business_hours", "requires_approval": false}
  requires_approval BOOLEAN DEFAULT true,
  approval_required_hours_before INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar sync connections
CREATE TABLE calendar_syncs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'outlook'
  provider_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL, -- encrypted in production
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT, -- Google Calendar ID or Outlook calendar
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE, -- which room to sync
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, provider_account_id)
);

-- Notification settings
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = global settings
  channel notification_channel NOT NULL,
  event_type TEXT NOT NULL, -- 'booking_created', 'booking_approved', 'cancellation_requested', etc.
  enabled BOOLEAN DEFAULT true,
  recipient_email TEXT, -- for email channel
  slack_webhook_url TEXT, -- encrypted in production
  quiet_hours_start TEXT, -- "09:00"
  quiet_hours_end TEXT, -- "17:00"
  quiet_hours_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email configuration
CREATE TABLE email_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_user TEXT NOT NULL,
  smtp_password TEXT NOT NULL, -- encrypted in production
  from_email TEXT NOT NULL,
  from_name TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slack configuration
CREATE TABLE slack_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_url TEXT NOT NULL,
  channel TEXT,
  enabled BOOLEAN DEFAULT true,
  events_to_notify JSONB DEFAULT '["booking_created", "booking_approved", "booking_rejected"]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification history
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel notification_channel,
  event_type TEXT,
  recipient TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- 'booking_created', 'booking_cancelled', 'room_occupied'
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);
CREATE INDEX idx_cancellations_booking_id ON cancellation_requests(booking_id);
CREATE INDEX idx_calendar_syncs_user_id ON calendar_syncs(user_id);
CREATE INDEX idx_calendar_syncs_provider ON calendar_syncs(provider);
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_analytics_events_room_id ON analytics_events(room_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_audit_log_admin_user_id ON audit_log(admin_user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cancellation_requests_updated_at BEFORE UPDATE ON cancellation_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER approval_workflows_updated_at BEFORE UPDATE ON approval_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER calendar_syncs_updated_at BEFORE UPDATE ON calendar_syncs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER email_config_updated_at BEFORE UPDATE ON email_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER slack_config_updated_at BEFORE UPDATE ON slack_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
