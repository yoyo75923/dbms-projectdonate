const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
    
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'aryaman1@1',  // Updated password1@
    database: 'donation_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
    });

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid user' });
        }

        req.user = users[0];
        next();
    } catch (err) {
        console.error('Auth error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password }); // Debug log

    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // First, let's check if we can query the database
        const [rows] = await pool.execute('SELECT 1');
        console.log('Database connection test successful');

        // Now try to find the user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        console.log('Query result:', users); // Debug log

        if (users.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        console.log('Found user:', { 
            id: user.id,
            email: user.email,
            providedPassword: password,
            storedPassword: user.password
        });

        // Direct password comparison
        if (password !== user.password) {
            console.log('Password mismatch');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user data without password
        const { password: _, ...userData } = user;
        console.log('Login successful:', userData);
        res.json(userData);
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email, full_name, phone, address } = req.body;
    
        // Validate required fields
        if (!username || !password || !email || !full_name) {
            return res.status(400).json({ error: 'Username, password, email, and full name are required' });
        }
    
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
    
        // Check if username or email already exists
        const [existingUsers] = await pool.execute(
            'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
    
        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.email === email) {
                return res.status(400).json({ error: 'Email already registered' });
            } else {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }
    
        try {
            // Attempt to insert new user
            await pool.execute(
                'INSERT INTO users (username, password, email, full_name, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [username, password, email, full_name, phone || null, address || null, 'user']
            );
            
            // Check if user was created by looking up the email
            const [newUser] = await pool.execute(
                'SELECT id, username, email, full_name, phone, address, role FROM users WHERE email = ?',
                [email]
            );
            
            if (newUser && newUser.length > 0) {
                // User was successfully created
                console.log('User registered successfully:', newUser[0]);
                return res.status(201).json(newUser[0]);
            }
        } catch (insertErr) {
            console.error('Error during user insertion:', insertErr);
            
            // Check if user exists despite the error
            const [existingUser] = await pool.execute(
                'SELECT id, username, email, full_name, phone, address, role FROM users WHERE email = ?',
                [email]
            );
            
            if (existingUser && existingUser.length > 0) {
                // User exists, registration was actually successful
                console.log('User exists after error, registration successful:', existingUser[0]);
                return res.status(201).json(existingUser[0]);
            }
        }
        
        // If we get here, registration failed
        throw new Error('Failed to register user');
    } catch (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ error: 'Failed to register user. Please try again.' });
    }
});

// Protected routes
app.get('/api/blood-camps', authenticateUser, async (req, res) => {
    try {
        const [camps] = await pool.execute('SELECT * FROM blood_donation_camps');
        res.json(camps);
    } catch (err) {
        console.error('Error fetching blood camps:', err);
        res.status(500).json({ error: 'Failed to fetch blood camps' });
    }
});

app.get('/api/blood-requests', authenticateUser, async (req, res) => {
    try {
        const [requests] = await pool.execute('SELECT * FROM blood_donation_requests');
        res.json(requests);
    } catch (err) {
        console.error('Error fetching blood requests:', err);
        res.status(500).json({ error: 'Failed to fetch blood requests' });
    }
});

app.post('/api/blood-camps', authenticateUser, async (req, res) => {
    try {
        const { title, description, location, date, start_time, end_time, required_blood_groups } = req.body;
        const organizer_id = req.headers['x-user-id'];

        const [result] = await pool.execute(
            'INSERT INTO blood_donation_camps (title, description, location, date, start_time, end_time, required_blood_groups, organizer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, location, date, start_time, end_time, required_blood_groups, organizer_id]
        );

        res.json({ id: result.insertId, message: 'Blood donation camp created successfully' });
    } catch (err) {
        console.error('Error creating blood camp:', err);
        res.status(500).json({ error: 'Failed to create blood donation camp' });
    }
});

app.post('/api/blood-requests', authenticateUser, async (req, res) => {
    try {
        const {
            patient_name,
            hospital_name,
            hospital_address,
            required_blood_group,
            units_required,
            urgency_level,
            contact_person,
            contact_number,
            additional_notes
        } = req.body;
        const created_by = req.headers['x-user-id'];
        const request_date = new Date().toISOString().split('T')[0];

        const [result] = await pool.execute(
            'INSERT INTO blood_donation_requests (patient_name, hospital_name, hospital_address, required_blood_group, units_required, urgency_level, contact_person, contact_number, additional_notes, request_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [patient_name, hospital_name, hospital_address, required_blood_group, units_required, urgency_level, contact_person, contact_number, additional_notes, request_date, created_by]
        );

        res.json({ id: result.insertId, message: 'Blood request created successfully' });
    } catch (err) {
        console.error('Error creating blood request:', err);
        res.status(500).json({ error: 'Failed to create blood request' });
    }
});

app.get('/api/fundraising', authenticateUser, async (req, res) => {
    try {
        const [campaigns] = await pool.execute('SELECT * FROM fundraising_campaigns');
        res.json(campaigns);
    } catch (err) {
        console.error('Error fetching fundraising campaigns:', err);
        res.status(500).json({ error: 'Failed to fetch fundraising campaigns' });
    }
});

app.post('/api/fundraising', authenticateUser, async (req, res) => {
    try {
        const { 
            title, 
            description, 
            goal_amount, 
            start_date, 
            end_date, 
            category = 'other', 
            image_url = null 
        } = req.body;
        const organizer_id = req.headers['x-user-id'];

        const [result] = await pool.execute(
            'INSERT INTO fundraising_campaigns (title, description, goal_amount, current_amount, start_date, end_date, category, image_url, organizer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, goal_amount, 0, start_date, end_date, category, image_url, organizer_id]
        );

        res.json({ id: result.insertId, message: 'Fundraising campaign created successfully' });
    } catch (err) {
        console.error('Error creating fundraising campaign:', err);
        res.status(500).json({ error: 'Failed to create fundraising campaign' });
    }
});

app.post('/api/fundraising/:id/donate', authenticateUser, async (req, res) => {
    try {
        const { amount, payment_method, anonymous = false, message = '' } = req.body;
        const campaign_id = req.params.id;
        const user_id = req.headers['x-user-id'];
        const donation_date = new Date().toISOString().split('T')[0];
        const transaction_id = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);

        // Begin transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Insert donation record
            const [result] = await connection.execute(
                'INSERT INTO fundraising_donations (user_id, campaign_id, amount, donation_date, payment_method, payment_status, transaction_id, anonymous, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [user_id, campaign_id, amount, donation_date, payment_method, 'completed', transaction_id, anonymous, message]
            );

            // 2. Update campaign current amount
            await connection.execute(
                'UPDATE fundraising_campaigns SET current_amount = current_amount + ? WHERE id = ?',
                [amount, campaign_id]
            );

            // 3. Check if campaign has met its goal
            const [campaigns] = await connection.execute(
                'SELECT id, current_amount, goal_amount FROM fundraising_campaigns WHERE id = ? AND current_amount >= goal_amount',
                [campaign_id]
            );

            if (campaigns.length > 0) {
                // Campaign has met its goal, delete it and its donations
                await connection.execute(
                    'DELETE FROM fundraising_donations WHERE campaign_id = ?',
                    [campaign_id]
                );
                await connection.execute(
                    'DELETE FROM fundraising_campaigns WHERE id = ?',
                    [campaign_id]
                );
                console.log(`Campaign ${campaign_id} met its goal and was deleted`);
            }

            await connection.commit();
            res.json({ 
                id: result.insertId, 
                transaction_id, 
                message: 'Donation processed successfully',
                campaign_completed: campaigns.length > 0
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error processing donation:', err);
        res.status(500).json({ error: 'Failed to process donation' });
    }
});

app.get('/api/item-campaigns', authenticateUser, async (req, res) => {
    try {
        const [campaigns] = await pool.execute('SELECT * FROM item_donation_campaigns');
        res.json(campaigns);
    } catch (err) {
        console.error('Error fetching item donation campaigns:', err);
        res.status(500).json({ error: 'Failed to fetch item donation campaigns' });
    }
});

app.get('/api/item-donations', authenticateUser, async (req, res) => {
    try {
        const [donations] = await pool.execute('SELECT * FROM item_donations');
        res.json(donations);
    } catch (err) {
        console.error('Error fetching item donations:', err);
        res.status(500).json({ error: 'Failed to fetch item donations' });
    }
});

app.post('/api/item-campaigns', authenticateUser, async (req, res) => {
    try {
        const { 
            title, 
            description, 
            location, 
            start_date, 
            end_date, 
            category = 'other'
        } = req.body;
        const organizer_id = req.headers['x-user-id'];

        const [result] = await pool.execute(
            'INSERT INTO item_donation_campaigns (title, description, location, start_date, end_date, category, organizer_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, location, start_date, end_date, category, organizer_id]
        );

        res.json({ id: result.insertId, message: 'Item donation campaign created successfully' });
    } catch (err) {
        console.error('Error creating item campaign:', err);
        res.status(500).json({ error: 'Failed to create item donation campaign' });
    }
});

app.post('/api/item-donations', authenticateUser, async (req, res) => {
    try {
        const { 
            campaign_id,
            item_name,
            quantity,
            condition,
            description,
            collection_address,
            delivery_address = null
        } = req.body;
        const user_id = req.headers['x-user-id'];
        const donation_date = new Date().toISOString().split('T')[0];

        const [result] = await pool.execute(
            'INSERT INTO item_donations (user_id, campaign_id, item_name, quantity, `condition`, description, donation_date, collection_address, delivery_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, campaign_id, item_name, quantity, condition, description, donation_date, collection_address, delivery_address]
        );

        res.json({ id: result.insertId, message: 'Item donation registered successfully' });
    } catch (err) {
        console.error('Error registering item donation:', err);
        res.status(500).json({ error: 'Failed to register item donation' });
    }
});

// Delete completed campaigns
app.delete('/api/cleanup-completed-campaigns', authenticateUser, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            console.log('Starting cleanup of campaigns that met their goals...');
            
            // 1. Get fundraising campaigns that met their goals
            const [completedCampaigns] = await connection.execute(
                'SELECT id, title, current_amount, goal_amount FROM fundraising_campaigns WHERE current_amount >= goal_amount AND status = "active"'
            );
            console.log('Found fundraising campaigns that met goals:', completedCampaigns);
            
            let fundraisingDeleted = 0;
            
            // 2. Delete these campaigns and their donations
            if (completedCampaigns.length > 0) {
                const campaignIds = completedCampaigns.map(c => c.id);
                const placeholders = campaignIds.map(() => '?').join(',');
                
                // Delete related donations first
                const [donationResult] = await connection.execute(
                    `DELETE FROM fundraising_donations WHERE campaign_id IN (${placeholders})`,
                    campaignIds
                );
                console.log(`Deleted ${donationResult.affectedRows} fundraising donations`);
                
                // Delete the campaigns that met their goals
                const [fundraisingResult] = await connection.execute(
                    `DELETE FROM fundraising_campaigns WHERE id IN (${placeholders})`,
                    campaignIds
                );
                
                fundraisingDeleted = fundraisingResult.affectedRows;
                console.log(`Deleted ${fundraisingDeleted} fundraising campaigns that met their goals`);
            }
            
            // Get item donation campaigns that met their goals
            const [completedItemCampaigns] = await connection.execute(`
                SELECT idc.id, idc.title, idc.required_quantity, COALESCE(SUM(id.quantity), 0) as total_donated
                FROM item_donation_campaigns idc
                LEFT JOIN item_donations id ON id.campaign_id = idc.id
                WHERE idc.status = 'active'
                GROUP BY idc.id
                HAVING total_donated >= required_quantity
            `);
            console.log('Found item campaigns that met goals:', completedItemCampaigns);
            
            let itemDeleted = 0;
            
            // Delete these item campaigns and their donations
            if (completedItemCampaigns.length > 0) {
                const campaignIds = completedItemCampaigns.map(c => c.id);
                const placeholders = campaignIds.map(() => '?').join(',');
                
                // Delete related donations first
                const [itemDonationResult] = await connection.execute(
                    `DELETE FROM item_donations WHERE campaign_id IN (${placeholders})`,
                    campaignIds
                );
                console.log(`Deleted ${itemDonationResult.affectedRows} item donations`);
                
                // Delete the campaigns that met their goals
                const [itemResult] = await connection.execute(
                    `DELETE FROM item_donation_campaigns WHERE id IN (${placeholders})`,
                    campaignIds
                );
                
                itemDeleted = itemResult.affectedRows;
                console.log(`Deleted ${itemDeleted} item campaigns that met their goals`);
            }
            
            await connection.commit();
            console.log('Cleanup completed successfully');
            
            res.json({
                message: 'Campaigns that met their goals have been removed',
                fundraisingDeleted: fundraisingDeleted,
                itemDonationsDeleted: itemDeleted
            });
        } catch (err) {
            await connection.rollback();
            console.error('Error during cleanup, rolling back:', err);
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error cleaning up campaigns:', err);
        res.status(500).json({ error: 'Failed to clean up campaigns' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
