// script.js
// Dynamically loads data from donation_db via REST APIs and manages UI interactions

// Helper function to make authenticated API requests
async function fetchWithAuth(url, options = {}) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.log('No user ID found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Check if session is expired (24 hours)
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            console.log('Session expired, redirecting to login');
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        ...options.headers
    };

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            console.log('Authentication failed, redirecting to login');
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Check if user is logged in
function checkAuth() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.log('No user ID found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Check if session is expired (24 hours)
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            console.log('Session expired, redirecting to login');
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }
    }

    // Update user info in the UI
    const username = localStorage.getItem('username');
    const fullName = localStorage.getItem('fullName');
    const userInfoElement = document.getElementById('userInfo');
    
    if (userInfoElement) {
        userInfoElement.textContent = `Welcome, ${fullName || username || 'User'}`;
    }
}

// Handle logout
function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    showFundraising(); // Show fundraising section by default
});

// Navigation functions
function showBloodDonation() {
    document.getElementById('blood-donation').classList.remove('hidden');
    document.getElementById('fundraising').classList.add('hidden');
    document.getElementById('item-donation').classList.add('hidden');
    
    // Update active button
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-button[onclick="showBloodDonation()"]').classList.add('active');
    
    // Load blood donation data
    loadBloodCamps();
    loadBloodRequests();
}

function showFundraising() {
    document.getElementById('blood-donation').classList.add('hidden');
    document.getElementById('fundraising').classList.remove('hidden');
    document.getElementById('item-donation').classList.add('hidden');
    
    // Update active button
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-button[onclick="showFundraising()"]').classList.add('active');
    
    // Load fundraising data
    loadFundraisingCampaigns();
}

function showItemDonation() {
    document.getElementById('blood-donation').classList.add('hidden');
    document.getElementById('fundraising').classList.add('hidden');
    document.getElementById('item-donation').classList.remove('hidden');
    
    // Update active button
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.nav-button[onclick="showItemDonation()"]').classList.add('active');
    
    // Load item donation data
    loadItemDonations();
}

// Load and display data
async function loadBloodCamps() {
    try {
        const camps = await fetchWithAuth('/api/blood-camps');
        const container = document.getElementById('blood-camps-list');
        
        if (camps.length === 0) {
            container.innerHTML = '<p class="no-data">No upcoming blood donation camps.</p>';
            return;
        }

        container.innerHTML = camps.map(camp => `
            <div class="card">
                <h3>${camp.title}</h3>
                <p>${camp.description || ''}</p>
                <p><strong>Location:</strong> ${camp.location}</p>
                <p><strong>Date:</strong> ${new Date(camp.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${camp.start_time} - ${camp.end_time}</p>
                <p><strong>Required Blood Groups:</strong> ${camp.required_blood_groups}</p>
                <p><strong>Status:</strong> ${camp.status}</p>
                <div class="action-buttons">
                    ${camp.status === 'upcoming' ? `
                        <button onclick="registerForCamp(${camp.id})" class="btn-primary">Register to Donate</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading blood camps:', error);
        showError('Failed to load blood donation camps');
    }
}

async function loadBloodRequests() {
    try {
        const requests = await fetchWithAuth('/api/blood-requests');
        const container = document.getElementById('blood-requests-list');
        
        if (requests.length === 0) {
            container.innerHTML = '<p class="no-data">No active blood requests.</p>';
            return;
        }

        container.innerHTML = requests.map(request => `
            <div class="card ${request.urgency_level === 'urgent' ? 'urgent' : ''}">
                <h3>${request.required_blood_group} Blood Needed - ${request.urgency_level.toUpperCase()}</h3>
                <p><strong>Patient:</strong> ${request.patient_name}</p>
                <p><strong>Hospital:</strong> ${request.hospital_name}</p>
                <p><strong>Location:</strong> ${request.hospital_address}</p>
                <p><strong>Units Required:</strong> ${request.units_required}</p>
                <p><strong>Contact:</strong> ${request.contact_person} (${request.contact_number})</p>
                ${request.additional_notes ? `<p><strong>Notes:</strong> ${request.additional_notes}</p>` : ''}
                <p><strong>Requested on:</strong> ${new Date(request.request_date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${request.status}</p>
                <div class="action-buttons">
                    ${request.status === 'active' ? `
                        <button onclick="respondToRequest(${request.id})" class="btn-primary">Respond to Request</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading blood requests:', error);
        showError('Failed to load blood requests');
    }
}

async function loadFundraisingCampaigns() {
    try {
        const campaigns = await fetchWithAuth('/api/fundraising');
        const container = document.getElementById('fundraising-campaigns');
        
        // Only filter by active status
        const activeCampaigns = campaigns.filter(campaign => {
            console.log(`Campaign ${campaign.title}:`, {
                current: campaign.current_amount,
                goal: campaign.goal_amount,
                status: campaign.status
            });
            return campaign.status === 'active';
        });
        
        if (activeCampaigns.length === 0) {
            container.innerHTML = '<p class="no-data">No active fundraising campaigns.</p>';
            return;
        }

        container.innerHTML = activeCampaigns.map(campaign => `
            <div class="card">
                <h3>${campaign.title}</h3>
                <p>${campaign.description}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(campaign.current_amount / campaign.goal_amount * 100)}%"></div>
                </div>
                <p class="amount">
                    <span>₹${campaign.current_amount.toLocaleString('en-IN')} raised</span>
                    <span>of ₹${campaign.goal_amount.toLocaleString('en-IN')}</span>
                </p>
                <p><strong>Category:</strong> ${campaign.category}</p>
                <p><strong>Duration:</strong> ${new Date(campaign.start_date).toLocaleDateString()} - ${new Date(campaign.end_date).toLocaleDateString()}</p>
                ${campaign.image_url ? `<img src="${campaign.image_url}" alt="${campaign.title}">` : ''}
                <div class="action-buttons">
                    <button onclick="showDonateModal(${campaign.id})" class="btn-primary">Donate Now</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading fundraising campaigns:', error);
        showError('Failed to load fundraising campaigns');
    }
}

async function loadItemDonations() {
    try {
        const [campaigns, donations] = await Promise.all([
            fetchWithAuth('/api/item-campaigns'),
            fetchWithAuth('/api/item-donations')
        ]);
        
        const container = document.getElementById('item-categories');
        
        // Calculate total donations for each campaign
        const campaignTotals = {};
        donations.forEach(donation => {
            if (!campaignTotals[donation.campaign_id]) {
                campaignTotals[donation.campaign_id] = 0;
            }
            campaignTotals[donation.campaign_id] += donation.quantity;
        });

        // Filter out completed campaigns
        const activeCampaigns = campaigns.filter(campaign => {
            const totalDonated = campaignTotals[campaign.id] || 0;
            return totalDonated < (campaign.required_quantity || Infinity) && campaign.status !== 'completed';
        });
        
        if (activeCampaigns.length === 0) {
            container.innerHTML = '<p class="no-data">No active item donation campaigns.</p>';
            return;
        }

        // Group active campaigns by category
        const categorizedCampaigns = {};
        activeCampaigns.forEach(campaign => {
            if (!categorizedCampaigns[campaign.category]) {
                categorizedCampaigns[campaign.category] = [];
            }
            
            // Find donations for this campaign
            const campaignDonations = donations.filter(d => d.campaign_id === campaign.id);
            campaign.donations = campaignDonations;
            
            categorizedCampaigns[campaign.category].push(campaign);
        });

        container.innerHTML = Object.entries(categorizedCampaigns).map(([category, campaigns]) => `
            <div class="category-section">
                <h3>${category} ${getCategoryIcon(category)}</h3>
                <div class="campaigns-grid">
                    ${campaigns.map(campaign => `
                        <div class="campaign-card">
                            <h4>${campaign.title}</h4>
                            <p>${campaign.description}</p>
                            <p><strong>Location:</strong> ${campaign.location}</p>
                            <p><strong>Duration:</strong> ${new Date(campaign.start_date).toLocaleDateString()} - ${new Date(campaign.end_date).toLocaleDateString()}</p>
                            <div class="donations-list">
                                <h5>Current Donations:</h5>
                                ${campaign.donations.length > 0 ? `
                                    <ul>
                                        ${campaign.donations.map(donation => `
                                            <li>
                                                ${donation.quantity}x ${donation.item_name} (${donation.condition})
                                                <span class="status ${donation.status}">${donation.status}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                ` : '<p>No donations yet</p>'}
                            </div>
                            <button onclick="showItemDonationModal(${campaign.id})" class="btn-primary">Donate Items</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading item donations:', error);
        showError('Failed to load item donations');
    }
}

// Helper function to get category icon
function getCategoryIcon(category) {
    const icons = {
        'clothing': '👕',
        'food': '🍲',
        'books': '📚',
        'toys': '🧸',
        'medical': '💊',
        'other': '📦'
    };
    return icons[category.toLowerCase()] || icons.other;
}

// Error display helper
function showError(message, type = 'error') {
    const errorDiv = document.createElement('div');
    errorDiv.className = type === 'error' ? 'error-message' : 'success-message';
    errorDiv.textContent = message;
    document.querySelector('main').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Modal controls
function showAddBloodEvent() {
    document.getElementById('addBloodCampModal').classList.remove('hidden');
}

function showAddBloodRequest() {
    document.getElementById('addBloodRequestModal').classList.remove('hidden');
}

function showAddFundraiser() {
    document.getElementById('addFundraiserModal').classList.remove('hidden');
}

function showAddItemCampaign() {
    document.getElementById('addItemCampaignModal').classList.remove('hidden');
}

function showDonateModal(campaignId) {
    document.getElementById('donate-campaign-id').value = campaignId;
    document.getElementById('donateModal').classList.remove('hidden');
}

function showItemDonationModal(campaignId) {
    document.getElementById('donate-item-campaign-id').value = campaignId;
    document.getElementById('donateItemModal').classList.remove('hidden');
}

function hideModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Form handlers
async function handleAddBloodCamp(e) {
    e.preventDefault();
    try {
        const formData = {
            title: document.getElementById('camp-title').value,
            description: document.getElementById('camp-description').value,
            location: document.getElementById('camp-location').value,
            date: document.getElementById('camp-date').value,
            start_time: document.getElementById('camp-start-time').value,
            end_time: document.getElementById('camp-end-time').value,
            required_blood_groups: document.getElementById('camp-blood-groups').value,
            organizer_id: localStorage.getItem('userId')
        };

        await fetchWithAuth('/api/blood-camps', {
        method: 'POST',
            body: JSON.stringify(formData)
        });

      hideModal('addBloodCampModal');
      loadBloodCamps();
    } catch (error) {
        console.error('Error adding blood camp:', error);
        showError('Failed to add blood donation camp');
    }
}

  async function handleAddBloodRequest(e) {
    e.preventDefault();
    try {
        const formData = {
            patient_name: document.getElementById('request-patient').value,
            hospital_name: document.getElementById('request-hospital').value,
            hospital_address: document.getElementById('request-location').value,
            required_blood_group: document.getElementById('request-blood-type').value,
            units_required: parseInt(document.getElementById('request-units').value),
            urgency_level: document.getElementById('request-urgency').value,
            contact_person: document.getElementById('request-contact-person').value,
            contact_number: document.getElementById('request-contact').value,
            additional_notes: document.getElementById('request-notes').value,
          request_date: new Date().toISOString().split('T')[0],
            created_by: localStorage.getItem('userId')
        };

        await fetchWithAuth('/api/blood-requests', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

      hideModal('addBloodRequestModal');
      loadBloodRequests();
    } catch (error) {
        console.error('Error adding blood request:', error);
        showError('Failed to add blood request');
    }
}

  async function handleAddFundraiser(e) {
    e.preventDefault();
    try {
        const formData = {
            title: document.getElementById('fundraiser-title').value,
            description: document.getElementById('fundraiser-description').value,
            goal_amount: parseFloat(document.getElementById('fundraiser-target').value),
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + parseInt(document.getElementById('fundraiser-days').value) * 86400000).toISOString().split('T')[0],
            category: document.getElementById('fundraiser-category').value,
            image_url: document.getElementById('fundraiser-image').value || null
        };

        await fetchWithAuth('/api/fundraising', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

      hideModal('addFundraiserModal');
      loadFundraisingCampaigns();
        showError('Fundraiser created successfully', 'success');
    } catch (error) {
        console.error('Error adding fundraiser:', error);
        showError('Failed to create fundraiser');
    }
}

async function handleDonation(e) {
    e.preventDefault();
    try {
        const campaignId = document.getElementById('donate-campaign-id').value;
        const formData = {
            amount: parseFloat(document.getElementById('donate-amount').value),
            payment_method: document.getElementById('donate-payment').value,
            anonymous: document.getElementById('donate-anonymous').checked,
            message: document.getElementById('donate-message').value || ''
        };

        await fetchWithAuth(`/api/fundraising/${campaignId}/donate`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        hideModal('donateModal');
        loadFundraisingCampaigns();
        showError('Thank you for your donation!', 'success');
    } catch (error) {
        console.error('Error processing donation:', error);
        showError('Failed to process donation');
    }
}

async function handleAddItemCampaign(e) {
    e.preventDefault();
    try {
        const formData = {
            title: document.getElementById('item-campaign-title').value,
            description: document.getElementById('item-campaign-description').value,
            location: document.getElementById('item-campaign-location').value,
            start_date: document.getElementById('item-campaign-start').value,
            end_date: document.getElementById('item-campaign-end').value,
            category: document.getElementById('item-campaign-category').value
        };

        await fetchWithAuth('/api/item-campaigns', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        hideModal('addItemCampaignModal');
        loadItemDonations();
        showError('Item donation campaign created successfully', 'success');
    } catch (error) {
        console.error('Error adding item campaign:', error);
        showError('Failed to create item donation campaign');
    }
}

async function handleItemDonation(e) {
    e.preventDefault();
    try {
        const campaignId = document.getElementById('donate-item-campaign-id').value;
        const formData = {
            campaign_id: campaignId,
            item_name: document.getElementById('donate-item-name').value,
            quantity: parseInt(document.getElementById('donate-item-quantity').value),
            condition: document.getElementById('donate-item-condition').value,
            description: document.getElementById('donate-item-description').value,
            collection_address: document.getElementById('donate-item-address').value
        };

        await fetchWithAuth('/api/item-donations', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        hideModal('donateItemModal');
        loadItemDonations();
        showError('Thank you for your donation!', 'success');
    } catch (error) {
        console.error('Error adding item donation:', error);
        showError('Failed to register item donation');
    }
}

// Function to handle donation button click
function registerForCamp(campId) {
    alert('Thank you for your interest in donating blood! The organizers will contact you soon with more details.');
}

function respondToRequest(requestId) {
    alert('Thank you for your willingness to donate blood! The requester will contact you with more details.');
}

// Function to clean up completed campaigns
async function cleanupCompletedCampaigns() {
    try {
        const response = await fetchWithAuth('/api/cleanup-completed-campaigns', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        showError(`Cleaned up ${result.fundraisingDeleted} fundraising campaigns and ${result.itemDonationsDeleted} item donation campaigns`, 'success');
        
        // Refresh all sections
        loadFundraisingCampaigns();
        loadItemDonations();
    } catch (error) {
        console.error('Error cleaning up campaigns:', error);
        showError('Failed to clean up completed campaigns');
    }
}

// Update registration form submission
async function handleRegistration(e) {
    e.preventDefault();
    try {
        const formData = {
            username: document.getElementById('register-username').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value,
            full_name: document.getElementById('register-fullname').value,
            phone: document.getElementById('register-phone').value,
            address: document.getElementById('register-address').value
        };

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }

        const userData = await response.json();
        showError('Registration successful! Please login.', 'success');
        hideModal('registerModal');
        showLoginForm();
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message || 'Registration failed');
    }
  }
  