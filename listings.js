// listings.js
// Handles fetching and rendering listings from backend

function renderListings(listings) {
    const listingsContent = document.querySelector('.listings-content');
    if (!listingsContent) return;
    // Always clear container and remove any old markup
    while (listingsContent.firstChild) {
        listingsContent.removeChild(listingsContent.firstChild);
    }
    if (!listings || listings.length === 0) {
        listingsContent.innerHTML = `<div class="empty-state">
            <i class="fas fa-home empty-icon"></i>
            <p>You don't have any listing at this moment.</p>
            <small class="info-update">Update info</small>
        </div>`;
        return;
    }
    // Get selected currency from settings
    let currency = 'XAF';
    try {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        if (settings.currency) currency = settings.currency;
    } catch (e) {}

    listings.forEach(listing => {
        // Determine badge text
        let badgeText = 'FOR SALE';
        if (listing.listingType === 'Hotel') {
            badgeText = 'HOTEL';
        } else if (listing.listingType === 'Rent') {
            badgeText = 'FOR RENT';
        } else if (listing.listingType === 'Sale') {
            badgeText = 'FOR SALE';
        }

        // Status badge
        let statusBadge = '';
        if (listing.status) {
            let badgeClass = 'badge-published';
            if (listing.status === 'pending') badgeClass = 'badge-pending';
            if (listing.status === 'draft') badgeClass = 'badge-draft';
            statusBadge = `<span class="listing-status-badge ${badgeClass}">${listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}</span>`;
        }

        // Determine image URL
        let imageUrl = (listing.images && listing.images.length) ? listing.images[0] : '/api/placeholder/350/180';
        if (listing.listingType === 'Hotel' && listing.images && listing.images.length) {
            imageUrl = listing.images[0];
        }

        // Admin controls for approval
        let adminControls = '';
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = user && user.role === 'admin';
        if (isAdmin && listing.status === 'pending') {
            adminControls = `
                <button class="approve-listing-btn" data-id="${listing._id}" data-type="${listing.listingType}"><i class="fas fa-check"></i> Approve</button>
                <button class="decline-listing-btn" data-id="${listing._id}" data-type="${listing.listingType}"><i class="fas fa-times"></i> Decline</button>
            `;
        }

        listingsContent.innerHTML += `
        <div class="listing-card enhanced-listing-card" data-id="${listing._id}" data-listing-type="${listing.listingType || ''}">
            <div class="listing-card-image-section" style="height:180px;">
                <img src="${imageUrl}" alt="${listing.title || 'Property Image'}" class="listing-card-image" style="height:180px; object-fit:cover;" />
            </div>
            <div class="listing-card-content-section">
                <div class="listing-card-header">
                    <span class="listing-card-price">${listing.price ? Number(listing.price).toLocaleString() + ' ' + currency : '0 ' + currency}</span>
                    <span class="listing-card-badge">${badgeText}</span>
                    ${statusBadge}
                </div>
                <h3 class="listing-card-title">${listing.title || 'Property Title'}</h3>
                <div class="listing-card-specs">
                    <span><i class="fas fa-bed"></i> ${listing.bedrooms || 2} bed</span>
                    <span><i class="fas fa-bath"></i> ${listing.bathrooms || 1} bath</span>
                    <span><i class="fas fa-ruler-combined"></i> ${listing.size || ''} ${listing.unitMeasure || ''}</span>
                </div>
                <div class="listing-card-actions">
                    <button class="edit-listing-btn" data-id="${listing._id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-listing-btn" data-id="${listing._id}"><i class="fas fa-trash"></i> Delete</button>
                    ${adminControls}
                </div>
            </div>
        </div>
        `;
    });
        // Store the last rendered listings for lookup
        window.lastRenderedListings = listings;
}

async function loadListingsFromBackend() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || !user.token) {
            renderListings([]);
            return;
        }
        // Fetch both listings and hotels
        const [listingsRes, hotelsRes] = await Promise.all([
            fetch('https://cribzconnect-backend.onrender.com/api/listings/me', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            }),
            fetch('https://cribzconnect-backend.onrender.com/api/hotels/me', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
        ]);
        if (!listingsRes.ok) throw new Error('Failed to fetch listings');
        if (!hotelsRes.ok) throw new Error('Failed to fetch hotels');
        const listings = await listingsRes.json();
        const hotels = await hotelsRes.json();
        // store raw fetched items for filtering (keep original arrays too)
        window._fetchedUserListings = listings || [];
        window._fetchedUserHotels = hotels || [];

        // Normalize listing objects so the UI can treat listings and hotels uniformly
        const normalizedListings = (listings || []).map(item => ({
            ...item,
            title: item.title || item.name || '',
            listingType: item.listingType || item.type || 'Sale',
            images: item.images || [],
            price: item.price,
            status: item.status,
            bedrooms: item.bedrooms || item.rooms || 0,
            bathrooms: item.bathrooms || 1,
            beds: item.beds || 1,
            size: item.size || '',
            unitMeasure: item.unitMeasure || '',
            address: item.address || item.location || ''
        }));

        // Normalize hotel objects to match listing card rendering
        const normalizedHotels = (hotels || []).map(hotel => ({
            ...hotel,
            title: hotel.name,
            listingType: 'Hotel',
            bedrooms: hotel.rooms,
            bathrooms: hotel.bathrooms || 1,
            beds: hotel.beds || 1,
            size: hotel.size || '',
            unitMeasure: hotel.unitMeasure || '',
            images: hotel.images || [],
            price: hotel.price,
            status: hotel.status,
            address: hotel.address
        }));

        // Merge listings and hotels (normalized) so filtering by status works
        const allListings = [...normalizedListings, ...normalizedHotels];

        // Automatically approve pending items (move to published) if present
        // This will call the backend approve endpoints and update local status so the UI shows them as published
        async function autoApprovePending(items) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user && user.token ? user.token : null;
            const API_BASE = 'https://cribzconnect-backend.onrender.com';
            const pendingItems = items.filter(i => String((i.status || '').toLowerCase()) === 'pending');
            if (!pendingItems.length) return;

            // Approve in parallel but allow failures
            const approvePromises = pendingItems.map(item => {
                const isHotel = (item.listingType || '').toLowerCase() === 'hotel';
                const url = isHotel
                    ? `${API_BASE}/api/hotels/${item._id || item.id}/approve`
                    : `${API_BASE}/api/listings/${item._id || item.id}/approve`;
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                return fetch(url, { method: 'PATCH', headers })
                    .then(res => ({ res, item }))
                    .catch(err => ({ err, item }));
            });

            const settled = await Promise.allSettled(approvePromises);
            // Update local statuses for successful approves
            settled.forEach(s => {
                if (s.status === 'fulfilled') {
                    const payload = s.value;
                    if (payload && payload.res && payload.res.ok) {
                        // set the corresponding item's status to published
                        const it = payload.item;
                        const found = items.find(x => String(x._id || x.id) === String(it._id || it.id));
                        if (found) found.status = 'published';
                    }
                }
            });
        }

        // Save for later filtering actions
        window.lastFetchedListings = allListings;

        // Try auto-approving pending items, then render
        await autoApprovePending(allListings);
        // Apply default filter (all)
        renderListings(allListings);
    } catch (err) {
        showNotification('Could not load listings: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', loadListingsFromBackend);
// Handle Edit and Delete actions after rendering
document.addEventListener('click', async function(e) {
    // Approve Listing/Hotel
    if (e.target.closest('.approve-listing-btn')) {
        const btn = e.target.closest('.approve-listing-btn');
        const listingId = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let url = '';
        if (type === 'Hotel') {
            url = `https://cribzconnect-backend.onrender.com/api/hotels/${listingId}/approve`;
        } else {
            url = `https://cribzconnect-backend.onrender.com/api/listings/${listingId}/approve`;
        }
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': user.token ? `Bearer ${user.token}` : ''
                }
            });
            if (!res.ok) throw new Error('Failed to approve item');
            showNotification('Item approved and published!', 'success');
            await loadListingsFromBackend();
        } catch (err) {
            showNotification('Could not approve item: ' + err.message, 'error');
        }
    }

    // Decline Listing/Hotel (set status to draft)
    if (e.target.closest('.decline-listing-btn')) {
        const btn = e.target.closest('.decline-listing-btn');
        const listingId = btn.getAttribute('data-id');
        const type = btn.getAttribute('data-type');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let url = '';
        if (type === 'Hotel') {
            url = `https://cribzconnect-backend.onrender.com/api/hotels/${listingId}/approve`;
        } else {
            url = `https://cribzconnect-backend.onrender.com/api/listings/${listingId}/approve`;
        }
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': user.token ? `Bearer ${user.token}` : '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'draft' })
            });
            if (!res.ok) throw new Error('Failed to decline item');
            showNotification('Item declined and moved to draft!', 'info');
            await loadListingsFromBackend();
        } catch (err) {
            showNotification('Could not decline item: ' + err.message, 'error');
        }
    }
    // Delete Listing or Hotel
    if (e.target.closest('.delete-listing-btn')) {
        const btn = e.target.closest('.delete-listing-btn');
        const listingId = btn.getAttribute('data-id');
        // Find the card and check if it's a hotel
        const card = btn.closest('.listing-card');
        let isHotel = false;
        if (card) {
            const id = card.getAttribute('data-id');
            const listingsArr = window.lastRenderedListings || [];
            const found = listingsArr.find(l => l._id === id);
            isHotel = found && found.listingType === 'Hotel';
        }
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const url = isHotel
                    ? `https://cribzconnect-backend.onrender.com/api/hotels/${listingId}`
                    : `https://cribzconnect-backend.onrender.com/api/listings/${listingId}`;
                const res = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': user.token ? `Bearer ${user.token}` : ''
                    }
                });
                if (!res.ok) throw new Error('Failed to delete item');
                showNotification((isHotel ? 'Hotel' : 'Listing') + ' deleted!', 'success');
                await loadListingsFromBackend();
            } catch (err) {
                showNotification('Could not delete item: ' + err.message, 'error');
            }
        }
    }

    // Edit Listing or Hotel
    if (e.target.closest('.edit-listing-btn')) {
        const btn = e.target.closest('.edit-listing-btn');
        const listingId = btn.getAttribute('data-id');
        const card = btn.closest('.listing-card');
        let isHotel = false;
        let found = null;
        if (card) {
            // Prefer explicit data attribute on DOM for reliability
            const cardType = card.getAttribute('data-listing-type') || '';
            isHotel = cardType === 'Hotel';
            const id = card.getAttribute('data-id');
            const listingsArr = window.lastRenderedListings || [];
            // Ensure we can still find rendered data
            found = listingsArr.find(l => String(l._id) === String(id));
            // If DOM attribute wasn't present, fallback to found
            if (!isHotel && found && found.listingType === 'Hotel') {
                isHotel = true;
            }
        }
        // Fetch details and show edit modal
        try {
            const url = isHotel
                ? `https://cribzconnect-backend.onrender.com/api/hotels/${listingId}`
                : `https://cribzconnect-backend.onrender.com/api/listings/${listingId}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch details');
            const listing = await res.json();
            showEditListingModal(listing, isHotel);
        } catch (err) {
            // Fallback: show modal with last rendered data if available
            if (isHotel && found) {
                showEditListingModal(found, true);
            }
            showNotification('Could not load item for edit: ' + err.message, 'error');
        }
    }
});

// Filter buttons on My Listings page
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-filter');
    if (!btn) return;
    const filter = btn.getAttribute('data-filter');
    // Update active button styling
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Use lastFetchedListings to filter
    const all = window.lastFetchedListings || [];
    if (!all.length) return renderListings([]);
    let filtered = all;
    if (filter && filter !== 'all') {
        filtered = all.filter(item => {
            // map 'published' to published, 'draft' to draft, 'pending' to pending
            return String(item.status || '').toLowerCase() === filter.toLowerCase();
        });
    }
    renderListings(filtered);
});

// Show Edit Listing Modal (to be implemented)
function showEditListingModal(listing, isHotel = false) {
    if (isHotel) {
        // Show hotel modal
        const hotelModal = document.getElementById('editHotelModal');
        if (!hotelModal) {
            console.error('editHotelModal not found in DOM');
            return;
        }
        // Force modal visible and above other UI
        hotelModal.style.display = 'flex';
        hotelModal.style.zIndex = 2000;
        // Prevent background scroll while modal open
        try { document.body.style.overflow = 'hidden'; } catch (e) {}
        // Fill fields
        document.getElementById('editHotelId').value = listing._id || '';
        document.getElementById('editHotelName').value = listing.name || '';
        document.getElementById('editHotelAddress').value = listing.address || '';
        document.getElementById('editHotelDescription').value = listing.description || '';
        document.getElementById('editHotelRooms').value = listing.rooms || '';
        document.getElementById('editHotelAmenities').value = Array.isArray(listing.amenities) ? listing.amenities.join(', ') : (listing.amenities || '');
        document.getElementById('editHotelPrice').value = listing.price || '';
        // Images not prefilled for now
        console.log('Opening hotel edit modal for:', listing._id);
        // Focus first field to ensure modal is visible
        const firstHotelField = document.getElementById('editHotelName');
        if (firstHotelField) {
            firstHotelField.focus();
        }
    } else {
        // Show listing modal
        const modal = document.getElementById('editListingModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.style.zIndex = 2000;
            try { document.body.style.overflow = 'hidden'; } catch (e) {}
            const firstField = document.getElementById('editTitle');
            if (firstField) firstField.focus();
        }
        document.getElementById('editListingId').value = listing._id || '';
        document.getElementById('editTitle').value = listing.title || '';
        document.getElementById('editDescription').value = listing.description || '';
        document.getElementById('editPropertyType').value = listing.propertyType || '';
        document.getElementById('editListingType').value = listing.listingType || 'Sale';
        document.getElementById('editBedrooms').value = listing.bedrooms || '';
        document.getElementById('editBathrooms').value = listing.bathrooms || '';
        document.getElementById('editBeds').value = listing.beds || '';
        document.getElementById('editRooms').value = listing.rooms || '';
        document.getElementById('editGuests').value = listing.guests || '';
        document.getElementById('editSize').value = listing.size || '';
        document.getElementById('editUnitMeasure').value = listing.unitMeasure || '';
        document.getElementById('editPrice').value = listing.price || '';
        document.getElementById('editAddress').value = listing.address || '';
    }
}

// Close modal logic
document.getElementById('closeEditModal').onclick = function() {
// Close hotel modal logic
document.getElementById('closeEditHotelModal').onclick = function() {
    document.getElementById('editHotelModal').style.display = 'none';
};
    document.getElementById('editListingModal').style.display = 'none';
};

// Submit edit form
document.getElementById('editListingForm').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editListingId').value;
    const updatedItem = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        propertyType: document.getElementById('editPropertyType').value,
        listingType: document.getElementById('editListingType').value,
        bedrooms: document.getElementById('editBedrooms').value,
        bathrooms: document.getElementById('editBathrooms').value,
        beds: document.getElementById('editBeds').value,
        rooms: document.getElementById('editRooms').value,
        guests: document.getElementById('editGuests').value,
        size: document.getElementById('editSize').value,
        unitMeasure: document.getElementById('editUnitMeasure').value,
        price: document.getElementById('editPrice').value,
        address: document.getElementById('editAddress').value,
    };
    try {
        const res = await fetch(`https://cribzconnect-backend.onrender.com/api/listings/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedItem),
        });
        if (!res.ok) throw new Error('Failed to update listing');
        showNotification('Listing updated!', 'success');
        document.getElementById('editListingModal').style.display = 'none';
        await loadListingsFromBackend();
    } catch (err) {
        showNotification('Could not update listing: ' + err.message, 'error');
    }
};

// Hotel edit form submit
document.getElementById('editHotelForm').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editHotelId').value;
    const form = document.getElementById('editHotelForm');
    const formData = new FormData(form);
    try {
        const res = await fetch(`https://cribzconnect-backend.onrender.com/api/hotels/${id}`, {
            method: 'PUT',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to update hotel');
        showNotification('Hotel updated!', 'success');
        document.getElementById('editHotelModal').style.display = 'none';
        await loadListingsFromBackend();
    } catch (err) {
        showNotification('Could not update hotel: ' + err.message, 'error');
    }
};
