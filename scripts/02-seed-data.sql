-- Insert test users
INSERT INTO users (email, full_name, role, department, phone, is_active) VALUES
('admin@company.com', 'Admin User', 'admin', 'IT', '+1-555-0001', true),
('manager@company.com', 'John Manager', 'manager', 'Operations', '+1-555-0002', true),
('alice@company.com', 'Alice Johnson', 'user', 'Sales', '+1-555-0003', true),
('bob@company.com', 'Bob Smith', 'user', 'Marketing', '+1-555-0004', true),
('carol@company.com', 'Carol Davis', 'user', 'Engineering', '+1-555-0005', true),
('david@company.com', 'David Wilson', 'manager', 'Finance', '+1-555-0006', true);

-- Set up admin users with permissions
INSERT INTO admin_users (user_id, permissions) VALUES
((SELECT id FROM users WHERE email = 'admin@company.com'), '{"view_analytics": true, "manage_bookings": true, "approve_bookings": true, "manage_rooms": true, "manage_users": true, "configure_integrations": true}'),
((SELECT id FROM users WHERE email = 'manager@company.com'), '{"view_analytics": true, "manage_bookings": true, "approve_bookings": true, "manage_rooms": false, "manage_users": false, "configure_integrations": false}');

-- Insert conference rooms
INSERT INTO rooms (name, location, capacity, amenities, equipment, booking_advance_days, max_booking_duration_hours, auto_approval_enabled, is_active) VALUES
('Board Room A', 'Floor 2', 12, '["projector", "whiteboard", "video_conference"]', '["tv", "sound_system"]', 30, 4, false, true),
('Meeting Room B', 'Floor 1', 6, '["whiteboard", "video_conference"]', '["tv"]', 30, 3, true, true),
('Conference Room C', 'Floor 3', 8, '["projector", "whiteboard"]', '["tv", "sound_system"]', 30, 4, false, true),
('Collaboration Space D', 'Floor 1', 4, '["whiteboard"]', '["tv"]', 14, 2, true, true),
('Executive Suite', 'Floor 4', 20, '["projector", "video_conference", "coffee_machine"]', '["tv", "sound_system", "dock"]', 60, 6, false, true);

-- Insert sample bookings
INSERT INTO bookings (room_id, user_id, title, description, start_time, end_time, status, approver_id, approved_at) VALUES
((SELECT id FROM rooms WHERE name = 'Board Room A'), (SELECT id FROM users WHERE email = 'alice@company.com'), 'Q1 Planning Meeting', 'Quarterly planning session', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '2 hours', 'approved', (SELECT id FROM users WHERE email = 'manager@company.com'), NOW()),
((SELECT id FROM rooms WHERE name = 'Meeting Room B'), (SELECT id FROM users WHERE email = 'bob@company.com'), 'Client Presentation', 'Presentation for XYZ Corp', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'approved', (SELECT id FROM users WHERE email = 'manager@company.com'), NOW()),
((SELECT id FROM rooms WHERE name = 'Conference Room C'), (SELECT id FROM users WHERE email = 'carol@company.com'), 'Team Standup', 'Daily engineering standup', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '30 minutes', 'pending', NULL, NULL),
((SELECT id FROM rooms WHERE name = 'Collaboration Space D'), (SELECT id FROM users WHERE email = 'alice@company.com'), 'Brainstorming Session', 'New product ideas', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '2 hours', 'pending', NULL, NULL),
((SELECT id FROM rooms WHERE name = 'Executive Suite'), (SELECT id FROM users WHERE email = 'david@company.com'), 'Board Meeting', 'Monthly board review', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', 'pending', NULL, NULL),
((SELECT id FROM rooms WHERE name = 'Board Room A'), (SELECT id FROM users WHERE email = 'bob@company.com'), 'Budget Review', 'Review annual budget proposals', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '2 hours', 'completed', (SELECT id FROM users WHERE email = 'manager@company.com'), NOW() - INTERVAL '2 days');

-- Insert some cancellation requests
INSERT INTO cancellation_requests (booking_id, reason, status, approver_id, approved_at) VALUES
((SELECT id FROM bookings WHERE title = 'Budget Review'), 'Meeting postponed to next quarter', 'approved', (SELECT id FROM users WHERE email = 'manager@company.com'), NOW() - INTERVAL '12 hours');

-- Insert approval workflow rules
INSERT INTO approval_workflows (name, user_role_required, requires_approval, approval_required_hours_before) VALUES
('Default Admin Approval', 'admin', true, 24),
('Manager Quick Approval', 'manager', true, 12),
('Same-day Bookings', 'manager', false, 0);

-- Insert notification settings
INSERT INTO notification_settings (user_id, channel, event_type, enabled, recipient_email, quiet_hours_enabled, quiet_hours_start, quiet_hours_end) VALUES
((SELECT id FROM users WHERE email = 'admin@company.com'), 'email', 'booking_created', true, 'admin@company.com', false, '17:00', '09:00'),
((SELECT id FROM users WHERE email = 'admin@company.com'), 'email', 'booking_approved', true, 'admin@company.com', false, '17:00', '09:00'),
((SELECT id FROM users WHERE email = 'manager@company.com'), 'email', 'booking_created', true, 'manager@company.com', true, '17:00', '09:00'),
(NULL, 'email', 'cancellation_requested', true, 'admin@company.com', false, '17:00', '09:00');

-- Insert email config (mock - in production, use environment variables)
INSERT INTO email_config (smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, enabled) VALUES
('smtp.gmail.com', 587, 'your-email@gmail.com', 'your-app-password', 'noreply@roombooking.com', 'Room Booking System', false);

-- Insert analytics events
INSERT INTO analytics_events (event_type, room_id, user_id, metadata) VALUES
('booking_created', (SELECT id FROM rooms WHERE name = 'Board Room A'), (SELECT id FROM users WHERE email = 'alice@company.com'), '{"duration_minutes": 120}'),
('booking_created', (SELECT id FROM rooms WHERE name = 'Meeting Room B'), (SELECT id FROM users WHERE email = 'bob@company.com'), '{"duration_minutes": 60}'),
('booking_approved', (SELECT id FROM rooms WHERE name = 'Board Room A'), NULL, '{"approver": "manager@company.com"}'),
('room_occupied', (SELECT id FROM rooms WHERE name = 'Board Room A'), (SELECT id FROM users WHERE email = 'alice@company.com'), '{"duration_minutes": 120}'),
('booking_cancelled', (SELECT id FROM rooms WHERE name = 'Board Room A'), (SELECT id FROM users WHERE email = 'bob@company.com'), '{"reason": "Schedule conflict"}');
