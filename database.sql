-- Create the database
CREATE DATABASE IF NOT EXISTS donation_db;
USE donation_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('user', 'admin') DEFAULT 'user'
);

-- Create blood_donation_camps table
CREATE TABLE IF NOT EXISTS blood_donation_camps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    required_blood_groups VARCHAR(50) NOT NULL,
    organizer_id INT,
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Create blood_donation_requests table
CREATE TABLE IF NOT EXISTS blood_donation_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_name VARCHAR(100) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_address TEXT NOT NULL,
    required_blood_group VARCHAR(3) NOT NULL,
    units_required INT NOT NULL,
    urgency_level ENUM('urgent', 'normal') NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    additional_notes TEXT,
    request_date DATE NOT NULL,
    status ENUM('active', 'fulfilled', 'cancelled') DEFAULT 'active',
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create blood_donations table
CREATE TABLE IF NOT EXISTS blood_donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    donation_type ENUM('camp', 'request') NOT NULL,
    camp_id INT,
    request_id INT,
    blood_group VARCHAR(3) NOT NULL,
    donation_date DATE NOT NULL,
    donation_time TIME NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (camp_id) REFERENCES blood_donation_camps(id),
    FOREIGN KEY (request_id) REFERENCES blood_donation_requests(id)
);

-- Create fundraising_campaigns table
CREATE TABLE IF NOT EXISTS fundraising_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    goal_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category ENUM('medical', 'education', 'disaster', 'social', 'other') NOT NULL,
    image_url VARCHAR(255),
    organizer_id INT,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Create fundraising_donations table
CREATE TABLE IF NOT EXISTS fundraising_donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    campaign_id INT,
    amount DECIMAL(10,2) NOT NULL,
    donation_date DATE NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'upi', 'net_banking') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (campaign_id) REFERENCES fundraising_campaigns(id)
);

-- Create item_donation_campaigns table
CREATE TABLE IF NOT EXISTS item_donation_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category ENUM('clothing', 'food', 'books', 'toys', 'furniture', 'electronics', 'other') NOT NULL,
    organizer_id INT,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Create item_donations table
CREATE TABLE IF NOT EXISTS item_donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    campaign_id INT,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    `condition` ENUM('new', 'like_new', 'good', 'fair', 'poor') NOT NULL,
    description TEXT,
    donation_date DATE NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'collected', 'delivered') DEFAULT 'pending',
    collection_address TEXT,
    delivery_address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (campaign_id) REFERENCES item_donation_campaigns(id)
);


-- Insert sample data

INSERT INTO users (username, password, email, full_name, phone, role) VALUES
('admin', 'admin123', 'admin@donation.com', 'Admin User', '1234567890', 'admin'),
('john_doe', 'john123', 'john@example.com', 'John Doe', '9876543210', 'user'),
('jane_smith', 'jane123', 'jane@example.com', 'Jane Smith', '8765432109', 'user');


-- Insert sample blood donation camps
INSERT INTO blood_donation_camps (title, description, location, date, start_time, end_time, required_blood_groups, organizer_id, status) VALUES
('Blood Donation Drive - City Hospital', 'Annual blood donation drive at City Hospital', 'City Hospital, Main Street', '2024-05-15', '09:00:00', '17:00:00', 'A+,B+,O+,AB+', 1, 'upcoming'),
('Emergency Blood Camp', 'Emergency blood donation camp for accident victims', 'Red Cross Center, Park Avenue', '2024-04-20', '10:00:00', '16:00:00', 'A-,B-,O-,AB-', 1, 'ongoing');

-- Insert sample blood donation requests
INSERT INTO blood_donation_requests (patient_name, hospital_name, hospital_address, required_blood_group, units_required, urgency_level, contact_person, contact_number, additional_notes, request_date, status, created_by) VALUES
('Robert Wilson', 'City General Hospital', '123 Hospital Road', 'B+', 2, 'urgent', 'Dr. Sarah Brown', '9876543210', 'Patient needs immediate surgery', '2024-04-18', 'active', 1),
('Maria Garcia', 'St. Mary Hospital', '456 Medical Center', 'O-', 3, 'normal', 'Nurse John Smith', '8765432109', 'Regular blood transfusion required', '2024-04-17', 'active', 2);

-- Insert sample blood donations
INSERT INTO blood_donations (user_id, donation_type, camp_id, request_id, blood_group, donation_date, donation_time, status) VALUES
(2, 'camp', 1, NULL, 'A+', '2024-05-15', '10:30:00', 'scheduled'),
(3, 'camp', 2, NULL, 'B-', '2024-04-20', '11:00:00', 'scheduled'),
(2, 'request', NULL, 1, 'B+', '2024-04-19', '14:00:00', 'scheduled');

-- Insert sample fundraising campaigns
INSERT INTO fundraising_campaigns (title, description, goal_amount, current_amount, start_date, end_date, category, organizer_id) VALUES
('Help Build a School', 'We are raising funds to build a primary school in a rural area.', 500000.00, 150000.00, '2024-04-01', '2024-07-01', 'education', 1),
('Medical Treatment Fund', 'Support cancer treatment for underprivileged patients.', 300000.00, 75000.00, '2024-04-01', '2024-06-01', 'medical', 2);

-- Insert sample fundraising donations
INSERT INTO fundraising_donations (user_id, campaign_id, amount, donation_date, payment_method, payment_status, transaction_id, anonymous, message) VALUES
(2, 1, 5000.00, '2024-04-10', 'credit_card', 'completed', 'TXN123456', FALSE, 'Happy to help!'),
(3, 1, 3000.00, '2024-04-11', 'upi', 'completed', 'TXN123457', TRUE, 'Best wishes'),
(2, 2, 2000.00, '2024-04-12', 'net_banking', 'completed', 'TXN123458', FALSE, 'Get well soon');

-- Insert sample item donation campaigns
INSERT INTO item_donation_campaigns (title, description, location, start_date, end_date, category, organizer_id) VALUES
('Winter Clothing Drive', 'Collecting warm clothes for the homeless', 'Community Center, Downtown', '2024-04-01', '2024-04-30', 'clothing', 1),
('School Supplies Collection', 'Gathering school supplies for underprivileged children', 'City Library, Main Branch', '2024-04-15', '2024-05-15', 'books', 2);

-- Insert sample item donations
INSERT INTO item_donations (user_id, campaign_id, item_name, quantity, `condition`, description, donation_date, status, collection_address) VALUES
(2, 1, 'Winter Jackets', 5, 'good', 'Gently used winter jackets in various sizes', '2024-04-05', 'pending', '123 Main St, Apt 4B'),
(3, 1, 'Blankets', 3, 'new', 'New fleece blankets', '2024-04-06', 'approved', '456 Park Ave'),
(2, 2, 'Textbooks', 10, 'good', 'High school textbooks', '2024-04-16', 'pending', '123 Main St, Apt 4B');
