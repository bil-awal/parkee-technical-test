-- V1__Create_tables.sql

-- Tabel Members
CREATE TABLE members (
    id BIGSERIAL PRIMARY KEY,
    member_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    vehicle_plate_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    phone_number VARCHAR(20),
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN NOT NULL DEFAULT true,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_vehicle_plate ON members(vehicle_plate_number);
CREATE INDEX idx_email ON members(email);
CREATE INDEX idx_phone ON members(phone_number);

-- Tabel Parking Tickets
CREATE TABLE parking_tickets (
    id BIGSERIAL PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20),
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP,
    check_in_photo_path TEXT,
    check_out_photo_path TEXT,
    check_in_gate VARCHAR(50),
    check_out_gate VARCHAR(50),
    check_in_operator VARCHAR(100),
    check_out_operator VARCHAR(100),
    member_id BIGINT REFERENCES members(id),
    member_name VARCHAR(100),
    parking_fee DECIMAL(10,2),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_plate_number ON parking_tickets(plate_number);
CREATE INDEX idx_check_in_time ON parking_tickets(check_in_time);
CREATE INDEX idx_status ON parking_tickets(status);

-- Tabel Vouchers
CREATE TABLE vouchers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200) NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2) DEFAULT 0.00,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    terminated_at TIMESTAMP
);

CREATE INDEX idx_voucher_code ON vouchers(code);
CREATE INDEX idx_valid_dates ON vouchers(valid_from, valid_until);

-- Tabel Payments
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    parking_ticket_id BIGINT NOT NULL REFERENCES parking_tickets(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_time TIMESTAMP NOT NULL,
    reference_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_time ON payments(payment_time);
CREATE INDEX idx_payment_method ON payments(payment_method);
CREATE INDEX idx_reference_number ON payments(reference_number);

-- Tabel Invoice Receipts
CREATE TABLE invoice_receipts (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    parking_ticket_id BIGINT NOT NULL REFERENCES parking_tickets(id),
    invoice_date TIMESTAMP NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP NOT NULL,
    duration_minutes BIGINT NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    member_name VARCHAR(100),
    voucher_code VARCHAR(50),
    operator_name VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_number ON invoice_receipts(invoice_number);
CREATE INDEX idx_invoice_date ON invoice_receipts(invoice_date);

-- V2__Insert_initial_data.sql
-- Seeder untuk data awal

-- Insert sample members
INSERT INTO members (member_code, name, vehicle_plate_number, email, phone_number, balance) VALUES
('MBR001', 'Budi Santoso', 'B1234ABC', 'budi.santoso@gmail.com', '081234567890', 500000.00),
('MBR002', 'Siti Rahayu', 'B5678DEF', 'siti.rahayu@gmail.com', '081234567891', 250000.00),
('MBR003', 'Ahmad Wijaya', 'B9012GHI', 'ahmad.wijaya@gmail.com', '081234567892', 750000.00),
('MBR004', 'Dewi Lestari', 'B3456JKL', 'dewi.lestari@gmail.com', '081234567893', 300000.00),
('MBR005', 'Rudi Hermawan', 'B7890MNO', 'rudi.hermawan@gmail.com', '081234567894', 150000.00);

-- Insert sample vouchers
INSERT INTO vouchers (code, description, discount_type, discount_value, minimum_amount, valid_from, valid_until) VALUES
('NEWMEMBER', 'Diskon member baru 20%', 'PERCENTAGE', 20.00, 10000.00, '2025-01-01', '2025-12-31'),
('WEEKEND50', 'Diskon weekend 50%', 'PERCENTAGE', 50.00, 20000.00, '2025-01-01', '2025-12-31'),
('PARKEE10K', 'Potongan Rp 10.000', 'FIXED_AMOUNT', 10000.00, 15000.00, '2025-01-01', '2025-06-30'),
('LEBARAN2025', 'Spesial Lebaran 30%', 'PERCENTAGE', 30.00, 0.00, '2025-03-01', '2025-04-30'),
('FLAT5K', 'Potongan langsung Rp 5.000', 'FIXED_AMOUNT', 5000.00, 5000.00, '2025-01-01', '2025-12-31');

-- Insert sample parking tickets (beberapa aktif, beberapa selesai)
INSERT INTO parking_tickets (plate_number, vehicle_type, check_in_time, check_out_time, check_in_gate, check_out_gate,
                           check_in_operator, check_out_operator, member_id, member_name, parking_fee, status) VALUES
-- Ticket yang sudah selesai
('B1111AAA', 'CAR', '2025-06-14 08:00:00', '2025-06-14 10:30:00', 'Gate A', 'Gate B', 'Op. Andi', 'Op. Budi', NULL, NULL, 9000.00, 'COMPLETED'),
('B2222BBB', 'MOTORCYCLE', '2025-06-14 09:15:00', '2025-06-14 11:45:00', 'Gate A', 'Gate A', 'Op. Andi', 'Op. Andi', NULL, NULL, 9000.00, 'COMPLETED'),
('B1234ABC', 'CAR', '2025-06-14 10:00:00', '2025-06-14 14:00:00', 'Gate B', 'Gate B', 'Op. Budi', 'Op. Citra', 1, 'Budi Santoso', 10800.00, 'COMPLETED'), -- Member dengan diskon 10%
('B3333CCC', 'CAR', '2025-06-14 11:30:00', '2025-06-14 15:00:00', 'Gate A', 'Gate A', 'Op. Citra', 'Op. Dedi', NULL, NULL, 12000.00, 'COMPLETED'),
('B5678DEF', 'CAR', '2025-06-14 12:00:00', '2025-06-14 16:30:00', 'Gate B', 'Gate A', 'Op. Dedi', 'Op. Eka', 2, 'Siti Rahayu', 13500.00, 'COMPLETED'), -- Member dengan diskon 10%

-- Ticket yang masih aktif
('B4444DDD', 'CAR', '2025-06-15 07:30:00', NULL, 'Gate A', NULL, 'Op. Andi', NULL, NULL, NULL, NULL, 'ACTIVE'),
('B5555EEE', 'MOTORCYCLE', '2025-06-15 08:45:00', NULL, 'Gate B', NULL, 'Op. Budi', NULL, NULL, NULL, NULL, 'ACTIVE'),
('B6666FFF', 'TRUCK', '2025-06-15 09:00:00', NULL, 'Gate A', NULL, 'Op. Citra', NULL, NULL, NULL, NULL, 'ACTIVE');

-- Insert sample payments untuk ticket yang sudah selesai
INSERT INTO payments (parking_ticket_id, amount, payment_method, payment_time, reference_number, status) VALUES
(1, 9000.00, 'CASH', '2025-06-14 10:30:00', 'CS-1718343000001', 'SUCCESS'),
(2, 9000.00, 'QRIS', '2025-06-14 11:45:00', 'QR-1718347500001', 'SUCCESS'),
(3, 10800.00, 'MEMBER_BALANCE', '2025-06-14 14:00:00', 'MB-1718355600001', 'SUCCESS'),
(4, 12000.00, 'FLAZZ', '2025-06-14 15:00:00', 'FL-1718359200001', 'SUCCESS'),
(5, 13500.00, 'MEMBER_BALANCE', '2025-06-14 16:30:00', 'MB-1718364600001', 'SUCCESS');

-- Insert sample invoice receipts
INSERT INTO invoice_receipts (invoice_number, parking_ticket_id, invoice_date, plate_number, check_in_time,
                            check_out_time, duration_minutes, base_amount, discount_amount, total_amount,
                            payment_method, payment_reference, member_name, operator_name) VALUES
('INV-202506140001', 1, '2025-06-14 10:30:00', 'B1111AAA', '2025-06-14 08:00:00', '2025-06-14 10:30:00', 150, 9000.00, 0.00, 9000.00, 'Tunai', 'CS-1718343000001', NULL, 'Op. Budi'),
('INV-202506140002', 2, '2025-06-14 11:45:00', 'B2222BBB', '2025-06-14 09:15:00', '2025-06-14 11:45:00', 150, 9000.00, 0.00, 9000.00, 'QRIS', 'QR-1718347500001', NULL, 'Op. Andi'),
('INV-202506140003', 3, '2025-06-14 14:00:00', 'B1234ABC', '2025-06-14 10:00:00', '2025-06-14 14:00:00', 240, 12000.00, 1200.00, 10800.00, 'Saldo Member', 'MB-1718355600001', 'Budi Santoso', 'Op. Citra'),
('INV-202506140004', 4, '2025-06-14 15:00:00', 'B3333CCC', '2025-06-14 11:30:00', '2025-06-14 15:00:00', 210, 12000.00, 0.00, 12000.00, 'Flazz BCA', 'FL-1718359200001', NULL, 'Op. Dedi'),
('INV-202506140005', 5, '2025-06-14 16:30:00', 'B5678DEF', '2025-06-14 12:00:00', '2025-06-14 16:30:00', 270, 15000.00, 1500.00, 13500.00, 'Saldo Member', 'MB-1718364600001', 'Siti Rahayu', 'Op. Eka');

-- Update member balances after payments
UPDATE members SET balance = balance - 10800.00, last_activity = '2025-06-14 14:00:00' WHERE id = 1;
UPDATE members SET balance = balance - 13500.00, last_activity = '2025-06-14 16:30:00' WHERE id = 2;

-- V3__Create_admin_views.sql
-- View untuk dashboard admin

-- View statistik harian
CREATE VIEW daily_parking_statistics AS
SELECT
    DATE(check_in_time) as parking_date,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_vehicles,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_vehicles,
    SUM(parking_fee) as total_revenue,
    AVG(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) as avg_duration_hours
FROM parking_tickets
GROUP BY DATE(check_in_time);

-- View metode pembayaran populer
CREATE VIEW payment_method_statistics AS
SELECT
    payment_method,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM payments
WHERE status = 'SUCCESS'
GROUP BY payment_method
ORDER BY transaction_count DESC;

-- View member paling aktif
CREATE VIEW active_members_statistics AS
SELECT
    m.id,
    m.member_code,
    m.name,
    m.vehicle_plate_number,
    COUNT(pt.id) as total_parkings,
    SUM(pt.parking_fee) as total_spent,
    m.balance as current_balance,
    m.last_activity
FROM members m
LEFT JOIN parking_tickets pt ON m.id = pt.member_id
WHERE m.active = true
GROUP BY m.id
ORDER BY total_parkings DESC;