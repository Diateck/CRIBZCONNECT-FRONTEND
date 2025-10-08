// Fetch and update dashboard stats for logged-in user
    async function updateDashboardStats() {
        const API_BASE_URL = 'https://cribzconnect-backend.onrender.com'; // <-- use your actual backend URL
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || !user.token) return;
        try {
            // Fetch user's listings, hotels, and profile (for balance)
            const [listingsRes, hotelsRes, profileRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/listings/me`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }),
                fetch(`${API_BASE_URL}/api/hotels/me`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }),
                fetch(`${API_BASE_URL}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                })
            ]);
            if (!listingsRes.ok) throw new Error('Failed to fetch listings');
            if (!hotelsRes.ok) throw new Error('Failed to fetch hotels');
            if (!profileRes.ok) throw new Error('Failed to fetch profile');
            const listings = await listingsRes.json();
            const hotels = await hotelsRes.json();
            const profile = await profileRes.json();
            // Update Active Listings count (listings + hotels)
            const activeListingsEl = document.querySelector('.stat-card .stat-content h3');
            if (activeListingsEl) {
                activeListingsEl.textContent = listings.length + hotels.length;
            }
            // Update balance everywhere
            const balance = profile.balance || 0;
            // Dashboard Earnings Balance
            const earningsBalanceEls = document.querySelectorAll('.balance-amount, .earnings-amount, .wallet-stat-card .stat-amount');
            earningsBalanceEls.forEach(el => {
                el.textContent = `${balance} XAF`;
            });
        } catch (err) {
            console.error('Dashboard stats error:', err);
        }
    }
    // Call on dashboard load
    updateDashboardStats();
// DOM Elements
function toggleSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.toggle('open');
    overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : 'auto';
}
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const submenuToggles = document.querySelectorAll('.has-submenu');
    const payoutMethodSelect = document.getElementById('payout-method-select');
    const paypalDetails = document.getElementById('paypal-details');
    const skrillDetails = document.getElementById('skrill-details');
    const wireDetails = document.getElementById('wire-details');

function closeSidebarMenu() {
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}


if (menuToggle) {
    menuToggle.addEventListener('click', toggleSidebar);
}

if (closeSidebar) {
    closeSidebar.addEventListener('click', closeSidebarMenu);
}

// Dynamic email display for verification page (localStorage first, backend fallback)
document.addEventListener('DOMContentLoaded', async function() {
    var emailSpan = document.querySelector('.email-verification .email-address');
    var user = JSON.parse(localStorage.getItem('user') || '{}');
    if (emailSpan) {
        if (user && user.email) {
            emailSpan.textContent = user.email;
        } else if (user && user.token) {
            try {
                const res = await fetch('https://cribzconnect-backend.onrender.com/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const profile = await res.json();
                    if (profile.email) {
                        emailSpan.textContent = profile.email;
                    } else {
                        emailSpan.textContent = "Email not found";
                    }
                } else {
                    emailSpan.textContent = "Unable to load email";
                }
            } catch (err) {
                emailSpan.textContent = "Error loading email";
                console.error('Failed to fetch user profile:', err);
            }
        } else {
            emailSpan.textContent = "Not logged in";
        }
    }
});

if (overlay) {
    overlay.addEventListener('click', closeSidebarMenu);
}

// Submenu Toggle
submenuToggles.forEach(submenu => {
    const link = submenu.querySelector('.nav-link');
    link.addEventListener('click', (e) => {
        if (submenu.querySelector('.submenu')) {
            e.preventDefault();
            submenu.classList.toggle('open');
        }
    });
});

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    console.debug('showPage called for:', pageId, 'targetPageExists:', !!targetPage);
    if (targetPage) {
        targetPage.classList.add('active');
        // Force visible layout to override any inline styles left in HTML
        targetPage.style.display = 'block';
        // Ensure there's visible spacing/background so empty pages are noticeable
        targetPage.style.backgroundColor = targetPage.style.backgroundColor || '#ffffff';
        targetPage.style.padding = targetPage.style.padding || '24px 0';
        targetPage.style.minHeight = targetPage.style.minHeight || '300px';
    }

    // Hide all other .page elements (for legacy inline style)
    pages.forEach(page => {
        if (page !== targetPage) {
            page.classList.remove('active');
            page.style.display = 'none';
        }
    });

    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
        closeSidebarMenu();
    }

    // Update URL hash
    window.location.hash = pageId;
}

// Navigation Link Click Handlers
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const pageId = link.getAttribute('data-page');
        if (pageId && pageId !== 'logout') {
            e.preventDefault();
            showPage(pageId);
        } else if (pageId === 'logout') {
            e.preventDefault();
            handleLogout();
        }
    });
});

// Handle submenu link clicks
document.querySelectorAll('.submenu a').forEach(link => {
    link.addEventListener('click', (e) => {
        const pageId = link.getAttribute('data-page');
        if (pageId) {
            e.preventDefault();
            showPage(pageId);
        }
    });
});

// Handle View Profile link click
document.querySelectorAll('.view-profile').forEach(link => {
    link.addEventListener('click', (e) => {
        const pageId = link.getAttribute('data-page');
        if (pageId) {
            e.preventDefault();
            showPage(pageId);
        }
    });
});

// Handle dropdown menu link clicks using event delegation
document.addEventListener('click', (e) => {
    if (e.target.closest('.dropdown-menu a')) {
        const link = e.target.closest('.dropdown-menu a');
        const pageId = link.getAttribute('data-page');
        if (pageId) {
            e.preventDefault();
            
            // Handle logout specifically
            if (pageId === 'logout') {
                handleLogout();
            } else {
                showPage(pageId);
            }
            
            // Close dropdown after navigation
            const dropdownMenu = document.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.style.display = 'none';
            }
        }
    }
});

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored user data
        localStorage.clear();
        sessionStorage.clear();
        
        // Show logout message
        showNotification('You have been successfully logged out', 'success');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// Handle initial page load
function initializePage() {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash + '-page')) {
        showPage(hash);
    } else {
        showPage('dashboard');
    }
}

// User Menu Dropdown (Mobile)
const userToggle = document.querySelector('.user-toggle');
const dropdownMenu = document.querySelector('.dropdown-menu');

if (userToggle && dropdownMenu) {
    userToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });
}

// Desktop User Menu Dropdown
const desktopUserToggle = document.querySelector('.desktop-user-toggle');
const desktopDropdownMenu = document.querySelector('.desktop-dropdown');

if (desktopUserToggle && desktopDropdownMenu) {
    desktopUserToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        desktopDropdownMenu.style.display = desktopDropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-user-menu')) {
            desktopDropdownMenu.style.display = 'none';
        }
    });
}

// Desktop notification button
const desktopNotificationBtn = document.querySelector('.desktop-notification');
if (desktopNotificationBtn) {
    desktopNotificationBtn.addEventListener('click', () => {
        showNotification('You have no new notifications', 'info');
    });
}

// Form Handling
function setupForms() {
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailOrUsername = loginForm.querySelector('input[type="text"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            try {
                const res = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailOrUsername, password })
                });
                const result = await res.json();
                if (res.ok) {
                    localStorage.setItem('user', JSON.stringify({
                        token: result.token,
                        fullName: result.fullName,
                        username: result.username,
                        email: result.email // Store email for dynamic display
                    }));
                    showNotification(`Welcome back, ${result.fullName || result.username}!`, 'success');
                    setTimeout(() => {
                        window.location.href = 'admin-dashboard.html';
                    }, 1500);
                } else {
                    showNotification(result.message || 'Login failed.', 'error');
                }
            } catch (err) {
                showNotification('Server error. Please try again.', 'error');
            }
        });
    }

    // Registration Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = registerForm.querySelector('input[placeholder="Enter your full name"]').value;
            const email = registerForm.querySelector('input[placeholder="Enter your email address"]').value;
            const username = registerForm.querySelector('input[placeholder="Choose a username"]').value;
            const password = registerForm.querySelector('input[placeholder="Create a strong password"]').value;
            const confirmPassword = registerForm.querySelector('input[placeholder="Confirm your password"]').value;
            if (password !== confirmPassword) {
                showNotification('Passwords do not match.', 'error');
                return;
            }
            try {
                const res = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, username, email, password })
                });
                const result = await res.json();
                if (res.ok) {
                    showNotification('Registration successful! Please login.', 'success');
                    setTimeout(() => {
                        document.querySelector('.tab-button[data-tab="login"]').click();
                    }, 1500);
                } else {
                    showNotification(result.message || 'Registration failed.', 'error');
                }
            } catch (err) {
                showNotification('Server error. Please try again.', 'error');
            }
        });
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Get user name from localStorage
    let name = '';
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            if (user.fullName && user.fullName.trim()) {
                name = user.fullName;
            } else if (user.username && user.username.trim()) {
                name = user.username;
            } else if (user.email && user.email.trim()) {
                name = user.email;
            } else {
                name = '';
            }
        }
    } catch (e) {
        name = '';
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${name ? `Hello, ${name}! ` : ''}${message}</span>
        <button class="notification-close">&times;</button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1002;
        max-width: 400px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        animation: slideIn 0.3s ease;
    `;

    // Add slide in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: inherit;
        padding: 0;
        margin-left: 0.5rem;
    `;

    closeBtn.addEventListener('click', () => {
        notification.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Photo Upload Handler
function setupPhotoUpload() {
    const browseBtn = document.querySelector('.upload-buttons .btn-primary');
    const deleteBtn = document.querySelector('.upload-buttons .btn-secondary');
    const photoPlaceholder = document.querySelector('.photo-placeholder');

    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        photoPlaceholder.innerHTML = `<img src="${e.target.result}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                        showNotification('Profile picture uploaded successfully!', 'success');
                    };
                    reader.readAsDataURL(file);
                }
            });
            input.click();
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (photoPlaceholder.querySelector('img')) {
                photoPlaceholder.innerHTML = '<i class="fas fa-user-circle"></i>';
                showNotification('Profile picture removed', 'info');
            }
        });
    }
}

// Responsive Handling
function handleResize() {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Password Strength Checker
function checkPasswordStrength(password) {
    let strength = 0;
    const feedback = [];

    if (password.length >= 8) {
        strength++;
    } else {
        feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
        strength++;
    } else {
        feedback.push('Include lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
        strength++;
    } else {
        feedback.push('Include uppercase letters');
    }

    if (/[0-9]/.test(password)) {
        strength++;
    } else {
        feedback.push('Include numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
        strength++;
    } else {
        feedback.push('Include special characters');
    }

    return { strength, feedback };
}

// Setup Password Form
function setupPasswordForm() {
    const passwordForm = document.querySelector('.password-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    if (newPasswordInput) {
        // Add password strength indicator
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        newPasswordInput.parentNode.appendChild(strengthIndicator);

        newPasswordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const { strength, feedback } = checkPasswordStrength(password);

            let strengthClass = 'strength-weak';
            let strengthText = 'Weak';

            if (strength >= 4) {
                strengthClass = 'strength-strong';
                strengthText = 'Strong';
            } else if (strength >= 2) {
                strengthClass = 'strength-medium';
                strengthText = 'Medium';
            }

            strengthIndicator.className = `password-strength ${strengthClass}`;
            strengthIndicator.textContent = password ? `Password strength: ${strengthText}` : '';
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showNotification('Password must be at least 8 characters long!', 'error');
                return;
            }

            // Simulate password change
            showNotification('Password changed successfully!', 'success');
            passwordForm.reset();
        });
    }
}

// Setup Verification Page
function setupVerificationPage() {
    const uploadBtn = document.querySelector('.upload-area .btn-secondary');
    const verifyBtn = document.querySelector('.verify-btn');
    const uploadArea = document.querySelector('.upload-area');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;

            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    uploadArea.style.borderColor = '#28a745';
                    uploadArea.style.backgroundColor = '#d4edda';

                    const fileNames = files.map(f => f.name).join(', ');
                    const uploadedText = document.createElement('p');
                    uploadedText.textContent = `Uploaded: ${fileNames}`;
                    uploadedText.style.color = '#28a745';
                    uploadedText.style.fontWeight = '500';

                    // Remove existing uploaded text
                    const existingText = uploadArea.querySelector('.uploaded-text');
                    if (existingText) {
                        existingText.remove();
                    }

                    uploadedText.className = 'uploaded-text';
                    uploadArea.appendChild(uploadedText);

                    showNotification('ID documents uploaded successfully!', 'success');
                }
            });

            input.click();
        });
    }

    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => {
            const uploadedText = uploadArea.querySelector('.uploaded-text');
            if (!uploadedText) {
                showNotification('Please upload your ID documents first!', 'error');
                return;
            }

            // Simulate verification process
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            setTimeout(() => {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verified';
                verifyBtn.className = 'btn btn-success';
                showNotification('ID verification submitted successfully! We will review your documents within 24-48 hours.', 'success');
            }, 2000);
        });
    }
}

// Setup Payout Method Form
function setupPayoutMethodForm() {
    const payoutMethodForm = document.querySelector('.payout-method-form');
    const setPayoutMethodBtn = document.querySelector('.set-method-btn');
    const requestPayoutBtn = document.querySelector('.request-payout-btn');
    const payoutMethodSelect = document.getElementById('payout-method-select');
    const paypalDetails = document.getElementById('paypal-details');
    const skrillDetails = document.getElementById('skrill-details');
    const wireDetails = document.getElementById('wire-details');

    // Auto-fill form with saved payout method data
    const savedData = localStorage.getItem('payoutMethodData');
    if (savedData) {
        const data = JSON.parse(savedData);
        Object.keys(data).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = data[key];
            }
        });
        // Set payout method select and show correct details section
        if (payoutMethodSelect && data.payoutMethod) {
            payoutMethodSelect.value = data.payoutMethod;
            payoutMethodSelect.dispatchEvent(new Event('change'));
        }
    }

    // Show/hide payout detail forms based on selection
    if (payoutMethodSelect) {
        payoutMethodSelect.addEventListener('change', function() {
            const method = payoutMethodSelect.value;
            // Hide all
            if (paypalDetails) paypalDetails.style.display = 'none';
            if (skrillDetails) skrillDetails.style.display = 'none';
            if (wireDetails) wireDetails.style.display = 'none';

            // Show selected
            if (method === 'paypal' && paypalDetails) {
                paypalDetails.style.display = 'block';
            } else if (method === 'skrill' && skrillDetails) {
                skrillDetails.style.display = 'block';
            } else if (method === 'wire-transfer' && wireDetails) {
                wireDetails.style.display = 'block';
            }
        });
    }

    if (payoutMethodForm) {
        payoutMethodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Validate required fields
            const requiredFields = [
                'payout-amount-method', 'first-name-method', 'last-name-method', 'street-address-method', 'city-method', 'state-method', 'zip-code-method', 'payout-method-select'
            ];
            const method = payoutMethodSelect ? payoutMethodSelect.value : '';
            if (method === 'paypal') requiredFields.push('paypal-email');
            if (method === 'skrill') requiredFields.push('skrill-email');
            if (method === 'wire-transfer') requiredFields.push('bank-account-name', 'bank-account-number', 'bank-name', 'bank-country');

            const missingFields = requiredFields.filter(field => {
                const input = document.getElementById(field);
                return !input || !input.value.trim();
            });
            if (missingFields.length > 0) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }

            const payoutAmount = parseFloat(document.getElementById('payout-amount-method').value);
            if (payoutAmount < 50000) {
                showNotification('Minimum payout amount is 50,000 FCFA', 'error');
                return;
            }

            // Gather payout method details
            const formData = new FormData(payoutMethodForm);
            const data = Object.fromEntries(formData);
            // Add selected method details
            if (method === 'paypal') {
                data.paypalEmail = document.getElementById('paypal-email').value;
            } else if (method === 'skrill') {
                data.skrillEmail = document.getElementById('skrill-email').value;
            } else if (method === 'wire-transfer') {
                data.bankAccountName = document.getElementById('bank-account-name').value;
                data.bankAccountNumber = document.getElementById('bank-account-number').value;
                data.bankName = document.getElementById('bank-name').value;
                data.bankCountry = document.getElementById('bank-country').value;
            }
            data.payoutMethod = method;

            // Always save payout method data to localStorage
            localStorage.setItem('payoutMethodData', JSON.stringify(data));

            // Send payout method data to backend (only deployed URL)
            let token = '';
            const userObj = localStorage.getItem('user');
            if (userObj) {
                try {
                    token = JSON.parse(userObj).token;
                } catch (e) {
                    token = '';
                }
            }
            try {
                const response = await fetch('https://cribzconnect-backend.onrender.com/api/user/payment-method', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    showNotification('Payout method updated successfully!', 'success');
                } else {
                    const error = await response.json();
                    showNotification(error.message || 'Failed to update payout method', 'error');
                }
            } catch (err) {
                showNotification('Network error: Unable to update payout method', 'error');
            }
        });
    }

    if (setPayoutMethodBtn) {
        setPayoutMethodBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger form submission for saving payout method
            if (payoutMethodForm) {
                const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                payoutMethodForm.dispatchEvent(submitEvent);
            }
        });
    }

    if (requestPayoutBtn) {
        requestPayoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            // Only redirect to wallet dashboard, do not process payout
            showPage('wallet');
        });
    }
}
// End of setupPayoutMethodForm

// Setup Wallet Page
function setupWalletPage() {
    const detailsBtn = document.querySelector('.details-btn');
    const manageBtn = document.querySelector('.manage-btn');

    if (detailsBtn) {
        detailsBtn.addEventListener('click', () => {
            showNotification('Earnings details feature coming soon!', 'info');
        });
    }

    if (manageBtn) {
        manageBtn.addEventListener('click', () => {
            showPage('bookings');
        });
    }
}

// Setup Earnings Page
function setupEarningsPage() {
    const feeBtn = document.querySelector('.fee-btn');

    if (feeBtn) {
        feeBtn.addEventListener('click', () => {
            showNotification('Host fee information: 10% is deducted from each booking', 'info');
        });
    }
}

// REMOVE: setupAddListingPage and listings rendering/fetching logic

// ...existing code...

// Setup Invoices Page
function setupInvoicesPage() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const typeFilter = document.getElementById('type-filter');
    const statusFilter = document.getElementById('status-filter');

    // Handle filter changes
    function handleFilterChange() {
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const type = typeFilter ? typeFilter.value : '';
        const status = statusFilter ? statusFilter.value : '';

        // Build filter message
        let filterMsg = 'Filtering invoices';
        const filters = [];
        
        if (startDate) filters.push(`from ${startDate}`);
        if (endDate) filters.push(`to ${endDate}`);
        if (type) filters.push(`type: ${type}`);
        if (status) filters.push(`status: ${status}`);

        if (filters.length > 0) {
            filterMsg += ` (${filters.join(', ')})`;
            showNotification(filterMsg, 'info');
        }

        // Here you would implement actual filtering logic
        console.log('Invoice filters:', { startDate, endDate, type, status });
    }

    // Add event listeners for filter inputs
    if (startDateInput) {
        startDateInput.addEventListener('change', handleFilterChange);
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', handleFilterChange);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', handleFilterChange);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }

    // Validate date range
    function validateDateRange() {
        if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);

            if (startDate > endDate) {
                showNotification('Start date cannot be later than end date', 'error');
                endDateInput.value = '';
            }
        }
    }

    if (startDateInput) {
        startDateInput.addEventListener('change', validateDateRange);
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', validateDateRange);
    }
} // <-- Added missing closing brace for setupWalletPage
// (FIX: This closing brace was missing and caused the syntax error)

// Setup Messages Page
function setupMessagesPage() {
    const usersList = document.getElementById('users-list');
    const userSearch = document.getElementById('user-search');
    const categoryButtons = document.querySelectorAll('.btn-category');
    const chatWelcome = document.getElementById('chat-welcome');
    const chatMessages = document.getElementById('chat-messages');
    const messageInputArea = document.getElementById('message-input-area');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatUserName = document.getElementById('chat-user-name');
    const chatUserStatus = document.getElementById('chat-user-status');
    const quickActionButtons = document.querySelectorAll('.btn-quick');
    const newChatBtn = document.getElementById('new-chat-btn');
    const startChatBtn = document.getElementById('start-chat-btn');

    let currentChatUser = null;
    let chatHistory = {};

    // Sample chat data
    const sampleMessages = {
        1: [
            { type: 'received', text: 'Hi! I saw your listing for the downtown apartment. Is it still available?', time: '2 hours ago' },
            { type: 'sent', text: 'Hello! Yes, it\'s still available. Would you like to schedule a viewing?', time: '2 hours ago' },
            { type: 'received', text: 'That would be great! When would be a good time?', time: '1 hour ago' },
            { type: 'sent', text: 'How about tomorrow at 3 PM?', time: '1 hour ago' }
        ],
        2: [
            { type: 'received', text: 'Hello, I\'m looking for a 2-bedroom apartment in the city center. Do you have anything available?', time: '3 hours ago' }
        ],
        3: [
            { type: 'received', text: 'Hi there! Your property looks amazing. Could you tell me more about the amenities?', time: '1 day ago' }
        ]
    };

    // User selection handler
    function handleUserSelection() {
        const userItems = document.querySelectorAll('.user-item');
        
        userItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all users
                userItems.forEach(u => u.classList.remove('active'));
                
                // Add active class to selected user
                item.classList.add('active');
                
                // Get user data
                const userId = item.getAttribute('data-user-id');
                const userName = item.querySelector('h4').textContent;
                const userType = item.querySelector('.user-type').textContent;
                const userStatus = item.querySelector('.last-seen').textContent;
                
                // Update chat header
                chatUserName.textContent = userName;
                chatUserStatus.textContent = userType + ' • ' + userStatus;
                
                // Show chat interface
                chatWelcome.style.display = 'none';
                chatMessages.style.display = 'block';
                messageInputArea.style.display = 'block';
                
                // Load chat messages
                loadChatMessages(userId);
                
                // Update current chat user
                currentChatUser = userId;
                
                // Remove message count indicator
                const messageCount = item.querySelector('.message-count');
                if (messageCount) {
                    messageCount.remove();
                }
                
                showNotification(`Started chat with ${userName}`, 'success');
            });
        });
    }

    // Load chat messages for selected user
    function loadChatMessages(userId) {
        const messagesContainer = chatMessages;
        messagesContainer.innerHTML = '';
        
        const messages = sampleMessages[userId] || [];
        
        messages.forEach(message => {
            const messageElement = createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Create message element
    function createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${message.text}
                <div class="message-time">${message.time}</div>
            </div>
        `;
        
        return messageDiv;
    }

    // Send message handler
    function handleSendMessage() {
        const messageText = messageInput.value.trim();
        
        if (!messageText || !currentChatUser) {
            return;
        }
        
        // Create new message
        const newMessage = {
            type: 'sent',
            text: messageText,
            time: 'Just now'
        };
        
        // Add to chat history
        if (!sampleMessages[currentChatUser]) {
            sampleMessages[currentChatUser] = [];
        }
        sampleMessages[currentChatUser].push(newMessage);
        
        // Add message to display
        const messageElement = createMessageElement(newMessage);
        chatMessages.appendChild(messageElement);
        
        // Clear input
        messageInput.value = '';
        adjustTextareaHeight();
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate response after 2 seconds
        setTimeout(() => {
            const responseMessage = {
                type: 'received',
                text: getAutoResponse(messageText),
                time: 'Just now'
            };
            
            sampleMessages[currentChatUser].push(responseMessage);
            const responseElement = createMessageElement(responseMessage);
            chatMessages.appendChild(responseElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 2000);
    }

    // Auto response generator
    function getAutoResponse(message) {
        const responses = [
            "Thanks for your message! Let me get back to you with more details.",
            "That sounds great! I'll check my calendar and get back to you.",
            "I appreciate your interest. Let me gather the information you need.",
            "Perfect! I'll send you more details shortly.",
            "Thank you for reaching out. I'll respond with the details soon."
        ];
        
        if (message.toLowerCase().includes('viewing')) {
            return "I'd be happy to arrange a viewing. What days work best for you?";
        } else if (message.toLowerCase().includes('price')) {
            return "The price is negotiable depending on the lease terms. Let's discuss!";
        } else if (message.toLowerCase().includes('available')) {
            return "Yes, it's still available! Would you like to know more details?";
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Adjust textarea height
    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }

    // Search users functionality
    function handleUserSearch() {
        const searchTerm = userSearch.value.toLowerCase();
        const userItems = document.querySelectorAll('.user-item');
        
        userItems.forEach(item => {
            const userName = item.querySelector('h4').textContent.toLowerCase();
            const userType = item.querySelector('.user-type').textContent.toLowerCase();
            
            if (userName.includes(searchTerm) || userType.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Filter users by category
    function handleCategoryFilter() {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                const category = button.getAttribute('data-category');
                const userItems = document.querySelectorAll('.user-item');
                
                userItems.forEach(item => {
                    const userCategory = item.getAttribute('data-category');
                    
                    if (category === 'all' || userCategory === category) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                showNotification(`Showing ${category === 'all' ? 'all users' : category + 's'}`, 'info');
            });
        });
    }

    // Quick actions handler
    function handleQuickActions() {
        quickActionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                
                switch (action) {
                    case 'schedule-viewing':
                        if (currentChatUser) {
                            const message = "I'd like to schedule a viewing. When would be a good time for you?";
                            messageInput.value = message;
                            handleSendMessage();
                        }
                        break;
                    case 'share-listing':
                        if (currentChatUser) {
                            const message = "Here's a link to one of my available listings: [Property Link]";
                            messageInput.value = message;
                            handleSendMessage();
                        }
                        break;
                    case 'make-offer':
                        if (currentChatUser) {
                            const message = "I'd like to make an offer. Can we discuss the terms?";
                            messageInput.value = message;
                            handleSendMessage();
                        }
                        break;
                }
            });
        });
    }

    // New chat functionality
    function handleNewChat() {
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                showNotification('New chat feature coming soon! For now, select a user from the list to start chatting.', 'info');
            });
        }

        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => {
                // Select first available user
                const firstUser = document.querySelector('.user-item');
                if (firstUser) {
                    firstUser.click();
                }
            });
        }
    }

    // Mobile sidebar toggle
    function handleMobileSidebar() {
        const chatHeader = document.querySelector('.chat-header');
        const usersSidebar = document.querySelector('.users-sidebar');
        
        if (window.innerWidth <= 768 && chatHeader) {
            chatHeader.addEventListener('click', (e) => {
                if (e.target === chatHeader || e.target.closest('.chat-user-info')) {
                    usersSidebar.classList.toggle('open');
                }
            });
            
            // Close sidebar when selecting user on mobile
            const userItems = document.querySelectorAll('.user-item');
            userItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        usersSidebar.classList.remove('open');
                    }
                });
            });
        }
    }

    // Initialize event listeners
    if (userSearch) {
        userSearch.addEventListener('input', handleUserSearch);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        messageInput.addEventListener('input', adjustTextareaHeight);
    }

    // Attachment button
    const attachmentBtn = document.getElementById('attachment-btn');
    if (attachmentBtn) {
        attachmentBtn.addEventListener('click', () => {
            showNotification('File attachment feature coming soon!', 'info');
        });
    }

    // Emoji button
    const emojiBtn = document.getElementById('emoji-btn');
    if (emojiBtn) {
        emojiBtn.addEventListener('click', () => {
            showNotification('Emoji picker coming soon!', 'info');
        });
    }

    // Chat action buttons
    const viewProfileBtn = document.getElementById('view-profile-btn');
    const callBtn = document.getElementById('call-btn');
    const moreOptionsBtn = document.getElementById('more-options-btn');

    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
            showNotification('Profile view feature coming soon!', 'info');
        });
    }

    if (callBtn) {
        callBtn.addEventListener('click', () => {
            showNotification('Video call feature coming soon!', 'info');
        });
    }

    if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener('click', () => {
            showNotification('More options coming soon!', 'info');
        });
    }

    // Initialize all handlers
    handleUserSelection();
    handleCategoryFilter();
    handleQuickActions();
    handleNewChat();
    handleMobileSidebar();

    // Handle window resize for mobile
    window.addEventListener('resize', handleMobileSidebar);
}

// Setup Settings Page
function setupSettingsPage() {
    const saveSettingsBtn = document.querySelector('.save-settings-btn');
    const resetSettingsBtn = document.querySelector('.reset-settings-btn');
    const currencySelect = document.getElementById('currency-select');
    const languageSelect = document.getElementById('language-select');
    const themeSelect = document.getElementById('theme-select');
    const toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');

    // Load saved settings from localStorage
    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        
        // Apply currency setting
        if (savedSettings.currency && currencySelect) {
            currencySelect.value = savedSettings.currency;
            // Only update currency display if it's different from default
            if (savedSettings.currency !== 'XAF') {
                updateCurrencyDisplay(savedSettings.currency);
            }
        }
        // Don't automatically update currency on initial load to preserve HTML structure

        // Apply language setting
        if (savedSettings.language && languageSelect) {
            languageSelect.value = savedSettings.language;
        }

        // Apply theme setting
        if (savedSettings.theme && themeSelect) {
            themeSelect.value = savedSettings.theme;
            applyTheme(savedSettings.theme);
        }

        // Apply timezone setting
        if (savedSettings.timezone) {
            const timezoneSelect = document.getElementById('timezone-select');
            if (timezoneSelect) timezoneSelect.value = savedSettings.timezone;
        }

        // Apply date format setting
        if (savedSettings.dateFormat) {
            const dateFormatSelect = document.getElementById('date-format-select');
            if (dateFormatSelect) dateFormatSelect.value = savedSettings.dateFormat;
        }

        // Apply toggle settings
        Object.entries(savedSettings.toggles || {}).forEach(([key, value]) => {
            const toggle = document.getElementById(key);
            if (toggle) {
                toggle.checked = value;
            }
        });

        // Apply other select settings
        const selectSettings = [
            'data-retention', 'items-per-page', 'response-time', 
            'default-cancellation', 'minimum-stay'
        ];

        selectSettings.forEach(settingKey => {
            if (savedSettings[settingKey]) {
                const element = document.getElementById(settingKey);
                if (element) element.value = savedSettings[settingKey];
            }
        });
    }

    // Update currency display throughout the app
    function updateCurrencyDisplay(currency) {
        // Only update elements that already have currency symbols
        const currencyElements = document.querySelectorAll('.balance-amount, .earnings-amount');
        
        currencyElements.forEach(element => {
            if (element.textContent.includes('FCFA')) {
                element.textContent = element.textContent.replace('FCFA', currency);
            } else if (element.textContent.includes('XAF')) {
                element.textContent = element.textContent.replace('XAF', currency);
            }
        });

        // Update earnings balance specifically (the third stat card)
        const earningsBalanceElement = document.querySelector('.stat-card:nth-child(3) .stat-content h3');
        if (earningsBalanceElement) {
            const currentText = earningsBalanceElement.textContent;
            if (currentText.includes('FCFA')) {
                earningsBalanceElement.textContent = currentText.replace('FCFA', currency);
            } else if (currentText.includes('XAF')) {
                earningsBalanceElement.textContent = currentText.replace('XAF', currency);
            } else if (currentText === '0' || currentText.match(/^\d+$/)) {
                earningsBalanceElement.textContent = `${currentText} ${currency}`;
            }
        }

        // Update placeholders and labels that mention minimum amounts
        const minAmountElements = document.querySelectorAll('input[placeholder*="50,000"], .balance-note');
        minAmountElements.forEach(element => {
            if (element.tagName === 'INPUT') {
                element.placeholder = element.placeholder.replace(/FCFA|XAF/g, currency);
            } else {
                element.textContent = element.textContent.replace(/FCFA|XAF/g, currency);
            }
        });

        showNotification(`Currency updated to ${currency}`, 'success');
    }

    // Apply theme
    function applyTheme(theme) {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        
        if (theme === 'dark') {
            body.classList.add('theme-dark');
        } else if (theme === 'light') {
            body.classList.add('theme-light');
        } else if (theme === 'auto') {
            body.classList.add('theme-auto');
            // Apply system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                body.classList.add('theme-dark');
            } else {
                body.classList.add('theme-light');
            }
        }

        showNotification(`Theme changed to ${theme}`, 'success');
    }

    // Save all settings
    function saveAllSettings() {
        const settings = {
            currency: currencySelect ? currencySelect.value : 'XAF',
            language: languageSelect ? languageSelect.value : 'en',
            theme: themeSelect ? themeSelect.value : 'light',
            timezone: document.getElementById('timezone-select')?.value || 'GMT',
            dateFormat: document.getElementById('date-format-select')?.value || 'DD/MM/YYYY',
            dataRetention: document.getElementById('data-retention')?.value || '1year',
            itemsPerPage: document.getElementById('items-per-page')?.value || '20',
            responseTime: document.getElementById('response-time')?.value || '24hours',
            defaultCancellation: document.getElementById('default-cancellation')?.value || 'moderate',
            minimumStay: document.getElementById('minimum-stay')?.value || '3',
            toggles: {}
        };

        // Collect all toggle states
        toggleSwitches.forEach(toggle => {
            settings.toggles[toggle.id] = toggle.checked;
        });

        // Save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));

        // Apply immediate changes
        if (currencySelect) updateCurrencyDisplay(settings.currency);
        if (themeSelect) applyTheme(settings.theme);

        return settings;
    }

    // Reset to default settings
    function resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            // Clear saved settings
            localStorage.removeItem('userSettings');
            
            // Reset form elements to defaults
            if (currencySelect) currencySelect.value = 'XAF';
            if (languageSelect) languageSelect.value = 'en';
            if (themeSelect) themeSelect.value = 'light';
            
            const defaultSelections = {
                'timezone-select': 'GMT',
                'date-format-select': 'DD/MM/YYYY',
                'data-retention': '1year',
                'items-per-page': '20',
                'response-time': '24hours',
                'default-cancellation': 'moderate',
                'minimum-stay': '3'
            };

            Object.entries(defaultSelections).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.value = value;
            });

            // Reset toggles to default states
            const defaultToggles = {
                'email-notifications': true,
                'push-notifications': true,
                'sms-notifications': false,
                'marketing-notifications': false,
                'profile-visibility': true,
                'online-status': true,
                'two-factor-auth': false,
                'auto-save': true,
                'advanced-features': false,
                'allow-messages': true,
                'read-receipts': true,
                'instant-booking': false,
                'professional-mode': false
            };

            Object.entries(defaultToggles).forEach(([id, checked]) => {
                const toggle = document.getElementById(id);
                if (toggle) toggle.checked = checked;
            });

            // Apply changes
            updateCurrencyDisplay('XAF');
            applyTheme('light');

            showNotification('All settings have been reset to default values', 'success');
        }
    }

    // Handle currency change
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            updateCurrencyDisplay(e.target.value);
        });
    }

    // Handle theme change
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    }

    // Handle language change
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            showNotification(`Language preference updated to ${e.target.options[e.target.selectedIndex].text}. Full language support coming soon!`, 'info');
        });
    }

    // Handle toggle changes with immediate feedback
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const settingName = e.target.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const status = e.target.checked ? 'enabled' : 'disabled';
            
            // Provide specific feedback for certain settings
            if (e.target.id === 'two-factor-auth' && e.target.checked) {
                showNotification('Two-factor authentication setup will be available soon!', 'info');
            } else if (e.target.id === 'professional-mode' && e.target.checked) {
                showNotification('Professional host mode activated! Advanced features are now available.', 'success');
            } else if (e.target.id === 'advanced-features' && e.target.checked) {
                showNotification('Beta features enabled! You may see new experimental functionality.', 'info');
            } else {
                showNotification(`${settingName} ${status}`, 'success');
            }
        });
    });

    // Handle specific setting changes
    const specificSettings = [
        'timezone-select', 'date-format-select', 'data-retention',
        'items-per-page', 'response-time', 'default-cancellation', 'minimum-stay'
    ];

    specificSettings.forEach(settingId => {
        const element = document.getElementById(settingId);
        if (element) {
            element.addEventListener('change', (e) => {
                const settingName = settingId.replace(/-select$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const selectedText = e.target.options ? e.target.options[e.target.selectedIndex].text : e.target.value;
                showNotification(`${settingName} updated to: ${selectedText}`, 'info');
            });
        }
    });

    // Save settings button
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const btn = e.target;
            const originalText = btn.innerHTML;
            
            // Show loading state
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            // Simulate API call delay
            setTimeout(() => {
                const savedSettings = saveAllSettings();
                
                btn.disabled = false;
                btn.innerHTML = originalText;
                
                showNotification('All settings saved successfully!', 'success');
                
                // Log settings for debugging
                console.log('Settings saved:', savedSettings);
            }, 1500);
        });
    }

    // Reset settings button
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', resetToDefaults);
    }

    // Load settings on page initialization
    loadSettings();

    // Auto-save feature (if enabled)
    function enableAutoSave() {
        let autoSaveTimeout;
        const settingElements = document.querySelectorAll('.setting-control, .toggle-switch input');
        
        settingElements.forEach(element => {
            element.addEventListener('change', () => {
                const autoSaveToggle = document.getElementById('auto-save');
                if (autoSaveToggle && autoSaveToggle.checked) {
                    clearTimeout(autoSaveTimeout);
                    autoSaveTimeout = setTimeout(() => {
                        saveAllSettings();
                        showNotification('Settings auto-saved', 'info');
                    }, 2000);
                }
            });
        });
    }

    enableAutoSave();

    // Handle system theme changes for auto theme
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect && themeSelect.value === 'auto') {
                applyTheme('auto');
            }
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupForms();
    setupPhotoUpload();
    setupPasswordForm();
    setupVerificationPage();
    setupPayoutMethodForm();
    setupWalletPage();
    setupEarningsPage();
    // REMOVE: setupAddListingPage
    // Removed hardcoded notification. Only dynamic notification will be shown.
    setupAddHotelForm();
});
// Add Hotel Form Handler
function setupAddHotelForm() {
    const hotelForm = document.querySelector('.add-hotel-form');
    if (!hotelForm) return;
    hotelForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(hotelForm);
        let user = JSON.parse(localStorage.getItem('user')) || {};
        try {
            const res = await fetch('https://cribzconnect-backend.onrender.com/api/hotels', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                body: formData
            });
            const result = await res.json();
            if (res.ok) {
                showNotification('Hotel listing added successfully!', 'success');
                hotelForm.reset();
            } else {
                showNotification(result.message || 'Failed to add hotel.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

// Utility Functions
function formatCurrency(amount, currency = 'XAF') {
    return new Intl.NumberFormat('en-US').format(amount) + ' ' + currency;
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// Profile Status Page Functions
function showProfileSection(section) {
    switch(section) {
        case 'listings':
            showPage('listings');
            showNotification('Viewing your listings', 'info');
            break;
        case 'experiences':
            showNotification('Experiences feature coming soon!', 'info');
            break;
        case 'reviews':
            showNotification('Reviews feature coming soon!', 'info');
            break;
        default:
            showNotification('Section not found', 'error');
    }
}

function navigateToHome(section) {
    // In a real application, this would navigate to the home page with a specific filter
    const sectionNames = {
        'apartments': 'Apartments',
        'single-rooms': 'Single Rooms',
        'studios': 'Studios',
        'blog': 'Blog & News'
    };
    
    const sectionName = sectionNames[section] || section;
    showNotification(`Navigating to ${sectionName} section...`, 'info');
    
    // Simulate navigation delay
    setTimeout(() => {
        showNotification(`${sectionName} section feature coming soon!`, 'info');
    }, 1000);
}

function showContactInfo() {
    const contactInfoSection = document.getElementById('contact-info');
    if (contactInfoSection) {
        if (contactInfoSection.style.display === 'none') {
            contactInfoSection.style.display = 'block';
            contactInfoSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            showNotification('Contact information displayed', 'success');
        } else {
            contactInfoSection.style.display = 'none';
            showNotification('Contact information hidden', 'info');
        }
    }
}

function openContactForm() {
    // Simulate opening a contact form
    const userConfirmed = confirm('Would you like to send us a message?\n\nClick OK to compose your message or Cancel to copy our email address.');
    
    if (userConfirmed) {
        const message = prompt('Please enter your message:');
        if (message && message.trim()) {
            showNotification('Message sent successfully! We will get back to you within 24 hours.', 'success');
        }
    } else {
        // Copy email to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText('info@roomfinder237.com').then(() => {
                showNotification('Email address copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Email: info@roomfinder237.com', 'info');
            });
        } else {
            showNotification('Email: info@roomfinder237.com', 'info');
        }
    }
}

// Setup Profile Status Page
function setupProfileStatusPage() {
    // Check if user is verified and update badge accordingly
    const verificationBadge = document.querySelector('.verification-badge');
    const isVerified = localStorage.getItem('userVerified') === 'true';
    
    if (verificationBadge && isVerified) {
        verificationBadge.className = 'verification-badge verified';
        verificationBadge.innerHTML = '<i class="fas fa-check"></i> Verified';
    }
    
    // Add hover effects for slide items
    const slideItems = document.querySelectorAll('.slide-item');
    slideItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-4px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click effects for links
    const profileLinks = document.querySelectorAll('.explore-link, .company-link');
    profileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Add click animation
            link.style.transform = 'scale(0.95)';
            setTimeout(() => {
                link.style.transform = 'scale(1)';
            }, 150);
            
            // Execute the onclick function if it exists
            const onclickAttr = link.getAttribute('onclick');
            if (onclickAttr) {
                eval(onclickAttr);
            }
        });
    });
}

// Initialize Profile Status Page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupProfileStatusPage();
    updateProfileCompletion();
    setupLiveProfileForm();
    setupLiveVerificationForm();
    setupLivePaymentForm();
    setupLivePasswordForm();
    setupProfileViewEditToggle();
    setupLiveBioForm();
    setupLiveAddressForm();
    setupLiveEmergencyForm();
    setupLiveSocialForm();
});

function setupLiveBioForm() {
    const bioForm = document.querySelector('.form-section form');
    if (!bioForm) return;
    bioForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let user = JSON.parse(localStorage.getItem('user')) || {};
        user.bio = bioForm.querySelector('textarea').value;
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ bio: user.bio })
            });
            const result = await res.json();
            if (res.ok) {
                user = { ...user, ...result };
                localStorage.setItem('user', JSON.stringify(user));
                showNotification('Bio updated successfully!', 'success');
            } else {
                showNotification(result.message || 'Bio update failed.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

function setupLiveAddressForm() {
    const addressForm = document.querySelector('.address-form');
    if (!addressForm) return;
    addressForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let user = JSON.parse(localStorage.getItem('user')) || {};
        user.address = {
            street: addressForm.querySelector('input[placeholder="Enter street address"]').value,
            apt: addressForm.querySelector('input[placeholder="Ex. #123"]').value,
            city: addressForm.querySelector('input[placeholder="Enter your city"]').value,
            state: addressForm.querySelector('input[placeholder="Enter your state"]').value,
            zip: addressForm.querySelector('input[placeholder="Enter zip code"]').value,
            neighborhood: addressForm.querySelector('input[placeholder="Neighborhood"]').value,
            country: addressForm.querySelector('input[placeholder="Country"]').value
        };
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ address: user.address })
            });
            const result = await res.json();
            if (res.ok) {
                user = { ...user, ...result };
                localStorage.setItem('user', JSON.stringify(user));
                showNotification('Address updated successfully!', 'success');
            } else {
                showNotification(result.message || 'Address update failed.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

function setupLiveEmergencyForm() {
    const emergencyForm = document.querySelector('.emergency-form');
    if (!emergencyForm) return;
    emergencyForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let user = JSON.parse(localStorage.getItem('user')) || {};
        user.emergency = {
            name: emergencyForm.querySelector('input[placeholder="Enter Name"]').value,
            relationship: emergencyForm.querySelector('input[placeholder="Enter Relationship"]').value,
            email: emergencyForm.querySelector('input[placeholder="Enter contact email address"]').value,
            phone: emergencyForm.querySelector('input[placeholder="Enter the phone number"]').value
        };
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ emergency: user.emergency })
            });
            const result = await res.json();
            if (res.ok) {
                user = { ...user, ...result };
                localStorage.setItem('user', JSON.stringify(user));
                showNotification('Emergency contact updated!', 'success');
            } else {
                showNotification(result.message || 'Emergency contact update failed.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

function setupLiveSocialForm() {
    const socialForm = document.querySelector('.social-form');
    if (!socialForm) return;
    socialForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let user = JSON.parse(localStorage.getItem('user')) || {};
        user.social = {
            facebook: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(1)').value,
            twitter: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(2)').value,
            linkedin: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(3)').value,
            googleplus: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(4)').value,
            instagram: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(5)').value,
            pinterest: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(6)').value,
            youtube: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(7)').value,
            vimeo: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(8)').value,
            airbnb: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(9)').value,
            tripadvisor: socialForm.querySelector('input[placeholder="URL"]:nth-of-type(10)').value
        };
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ social: user.social })
            });
            const result = await res.json();
            if (res.ok) {
                user = { ...user, ...result };
                localStorage.setItem('user', JSON.stringify(user));
                showNotification('Social media links updated!', 'success');
            } else {
                showNotification(result.message || 'Social media update failed.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

function setupProfileViewEditToggle() {
    const infoForm = document.querySelector('.info-form');
    if (!infoForm) return;
    const saveBtn = infoForm.querySelector('button[type="submit"]');
    let editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary profile-edit-btn';
    editBtn.textContent = 'Edit';
    infoForm.appendChild(editBtn);

    function showDetails() {
        let user = JSON.parse(localStorage.getItem('user')) || {};
        infoForm.querySelectorAll('input, select').forEach(input => {
            input.setAttribute('readonly', true);
            input.classList.add('profile-view');
        });
        saveBtn.style.display = 'none';
        editBtn.style.display = 'inline-block';
    }

    function enableEdit() {
        infoForm.querySelectorAll('input, select').forEach(input => {
            input.removeAttribute('readonly');
            input.classList.remove('profile-view');
        });
        saveBtn.style.display = 'inline-block';
        editBtn.style.display = 'none';
    }

    // On save, show details
    infoForm.addEventListener('submit', function(e) {
        setTimeout(showDetails, 500); // Wait for backend update
    });
    // On edit, enable editing
    editBtn.addEventListener('click', enableEdit);

    // Initial state: show details if user data exists
    let user = JSON.parse(localStorage.getItem('user')) || {};
    if (user && user.username) {
        showDetails();
    } else {
        enableEdit();
    }
}

function setupLiveVerificationForm() {
    const idUploadBtn = document.querySelector('.verify-btn');
    if (!idUploadBtn) return;
    idUploadBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        let user = JSON.parse(localStorage.getItem('user')) || {};
        // Send verification to backend
        try {
            const res = await fetch('http://localhost:5000/api/user/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ userId: user._id })
            });
            const result = await res.json();
            if (res.ok) {
                user = { ...user, ...result, verified: true };
                localStorage.setItem('user', JSON.stringify(user));
                showNotification('Verification submitted and saved!', 'success');
                updateProfileCompletion();
            } else {
                showNotification(result.message || 'Verification failed.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

function setupLivePaymentForm() {
    const paymentForm = document.querySelector('.payout-method-form');
    if (!paymentForm) return;
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let user = JSON.parse(localStorage.getItem('user')) || {};
        // Collect payment method data (example)
        const paymentData = {};
        paymentForm.querySelectorAll('input, select').forEach(input => {
            paymentData[input.name] = input.value;
        });
        // Send payment method to backend
        try {
            const res = await fetch('http://localhost:5000/api/user/payment-method', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(paymentData)
            });
            const result = await res.json();
            if (res.ok) {
                user = { ...user, ...result, paymentMethodAdded: true };
                localStorage.setItem('user', JSON.stringify(user));
                showNotification('Payment method saved!', 'success');
                updateProfileCompletion();
            } else {
                showNotification(result.message || 'Payment method failed.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

function setupLivePasswordForm() {
    const passwordForm = document.querySelector('.password-form');
    if (!passwordForm) return;
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const newPassword = passwordForm.querySelector('#new-password').value;
        const confirmPassword = passwordForm.querySelector('#confirm-password').value;
        if (newPassword !== confirmPassword) {
            showNotification('Passwords do not match.', 'error');
            return;
        }
        let user = JSON.parse(localStorage.getItem('user')) || {};
        // Send password change to backend
        try {
            const res = await fetch('http://localhost:5000/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ userId: user._id, newPassword })
            });
            const result = await res.json();
            if (res.ok) {
                user = { ...user, ...result, passwordChanged: true };
                localStorage.setItem('user', JSON.stringify(user));
                showNotification('Password changed successfully!', 'success');
                passwordForm.reset();
            } else {
                showNotification(result.message || 'Password change failed.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

function setupLiveProfileForm() {
    const infoForm = document.querySelector('.info-form');
    if (!infoForm) return;

    // Fetch user data (replace with API call in production)
    let user = JSON.parse(localStorage.getItem('user')) || {};

    // Populate fields safely
    const firstNameInput = infoForm.querySelector('input[placeholder="Enter your name"]');
    if (firstNameInput) firstNameInput.value = user.firstName || '';
    const lastNameInput = infoForm.querySelector('input[placeholder="Enter your last name"]');
    if (lastNameInput) lastNameInput.value = user.lastName || '';
    const nativeLangInput = infoForm.querySelector('input[placeholder="Native Language"]');
    if (nativeLangInput) nativeLangInput.value = user.nativeLanguage || '';
    const otherLangInput = infoForm.querySelector('input[placeholder="Other Language"]');
    if (otherLangInput) otherLangInput.value = user.otherLanguage || '';
    const displayNameInput = infoForm.querySelector('input[placeholder="Display name publicly as"]');
    if (displayNameInput) displayNameInput.value = user.displayName || '';
    // Username is editable
    const usernameInput = document.getElementById('profile-username');
    if (usernameInput) {
        usernameInput.value = user.username || '';
    }

    // Save handler
    infoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Collect updated data
    user.firstName = infoForm.querySelector('input[placeholder="Enter your name"]').value;
    user.lastName = infoForm.querySelector('input[placeholder="Enter your last name"]').value;
    user.nativeLanguage = infoForm.querySelector('input[placeholder="Native Language"]').value;
    user.otherLanguage = infoForm.querySelector('input[placeholder="Other Language"]').value;
    user.displayName = infoForm.querySelector('input[placeholder="Display name publicly as"]').value;
    user.username = document.getElementById('profile-username').value;

        // Send to backend API
        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(user)
            });
            const result = await res.json();
            if (res.ok) {
                user = { ...user, ...result, profileInfoCompleted: true };
                localStorage.setItem('user', JSON.stringify(user));
                showNotification('Profile updated successfully!', 'success');
                updateProfileCompletion();
            } else {
                showNotification(result.message || 'Profile update failed.', 'error');
            }
        } catch (err) {
            showNotification('Server error. Please try again.', 'error');
        }
    });
}

function updateProfileCompletion() {
    // Example: Fetch user data from localStorage (replace with API call for production)
    const user = JSON.parse(localStorage.getItem('user')) || {};
    let percent = 20; // Default after sign-in

    // Check profile info completion
    if (user.profileInfoCompleted) percent += 30;
    // Check verification
    if (user.verified) percent += 30;
    // Check payment method
    if (user.paymentMethodAdded) percent += 20;

    // Clamp percent to 100
    percent = Math.min(percent, 100);

    // Update text and bar
    const completionText = document.getElementById('profile-completion-text');
    const completionBar = document.getElementById('profile-completion-bar');
    if (completionText) completionText.textContent = `Profile Completed ${percent}%`;
    if (completionBar) completionBar.style.width = `${percent}%`;
}

// Export functions for potential module usage
window.CribzConnect = {
    showPage,
    showNotification,
    formatCurrency,
    formatDate,
    showProfileSection,
    navigateToHome,
    showContactInfo,
    openContactForm
};
document.querySelector(".add-listing-form").addEventListener("submit", function(e) {
  const editorContent = document.querySelector(".editor-content").innerHTML.trim();
  document.getElementById("property-description").value = editorContent;
});

