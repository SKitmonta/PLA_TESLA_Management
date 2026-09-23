-- Sample data for local development

INSERT INTO packages (code, name, description, price, status) VALUES
  ('PKG-BASIC',   'Basic Plan',    'แพ็กเกจเริ่มต้นสำหรับลูกค้าใหม่', 1990,  'ACTIVE'),
  ('PKG-SILVER',  'Silver Plan',   'ความคุ้มครองระดับกลาง',          4990,  'ACTIVE'),
  ('PKG-GOLD',    'Gold Plan',     'ความคุ้มครองครบถ้วน',            9990,  'ACTIVE'),
  ('PKG-PLAT',    'Platinum Plan', 'แพ็กเกจพรีเมียม',               19990, 'DRAFT');

INSERT INTO campaigns (code, name, description, discount_type, discount_value, start_date, end_date, status) VALUES
  ('CMP-NY',     'New Year Sale',     'ส่วนลดต้อนรับปีใหม่',   'PERCENT', 15,  CURRENT_DATE - 30, CURRENT_DATE + 30, 'ACTIVE'),
  ('CMP-MID',    'Mid Year Boost',    'กระตุ้นยอดกลางปี',      'AMOUNT',  500, CURRENT_DATE + 10, CURRENT_DATE + 60, 'DRAFT'),
  ('CMP-LOYAL',  'Loyalty Reward',    'สำหรับลูกค้าเก่า',       'PERCENT', 10,  CURRENT_DATE - 90, CURRENT_DATE - 5,  'INACTIVE');

INSERT INTO agents (code, name, email, phone, status) VALUES
  ('AG001', 'สมชาย ใจดี',     'somchai@example.com', '0810000001', 'ACTIVE'),
  ('AG002', 'สมหญิง รักงาน',  'somying@example.com', '0810000002', 'ACTIVE'),
  ('AG003', 'วิชัย ขยัน',      'wichai@example.com',  '0810000003', 'ACTIVE'),
  ('AG004', 'มาลี สดใส',      'malee@example.com',   '0810000004', 'ACTIVE'),
  ('AG005', 'ประเสริฐ มั่นคง', 'prasert@example.com', '0810000005', 'INACTIVE');

INSERT INTO agent_groups (code, name, description, status) VALUES
  ('GRP-BKK',   'Bangkok Team',  'ทีมขายกรุงเทพฯ',  'ACTIVE'),
  ('GRP-NORTH', 'North Team',    'ทีมขายภาคเหนือ',  'ACTIVE'),
  ('GRP-VIP',   'VIP Team',      'ทีมดูแลลูกค้า VIP', 'ACTIVE');

INSERT INTO agent_group_members (group_id, agent_id) VALUES
  (1, 1), (1, 2), (2, 3), (2, 4), (3, 1), (3, 5);

INSERT INTO combinations (name, package_id, agent_group_id, campaign_id, status) VALUES
  ('BKK - Gold - New Year',     3, 1, 1, 'ACTIVE'),
  ('North - Basic - New Year',  1, 2, 1, 'ACTIVE'),
  ('VIP - Silver - Mid Year',   2, 3, 2, 'DRAFT');
