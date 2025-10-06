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
    listings.forEach(listing => {
        listingsContent.innerHTML += `
        <div class="listing-card enhanced-listing-card" data-id="${listing._id}">
            <div class="listing-card-image-section" style="height:180px;">
                <img src="${(listing.images && listing.images.length) ? listing.images[0] : '/api/placeholder/350/180'}" alt="${listing.title || 'Property Image'}" class="listing-card-image" style="height:180px; object-fit:cover;" />
            </div>
            <div class="listing-card-content-section">
                <div class="listing-card-header">
                    <span class="listing-card-price">$${listing.price ? Number(listing.price).toLocaleString() : '0'}</span>
                    <span class="listing-card-badge">${listing.listingType === 'Sale' ? 'FOR SALE' : (listing.listingType === 'Rent' ? 'FOR RENT' : 'FOR SALE')}</span>
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
                </div>
            </div>
        </div>
        `;
    });
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
        // Normalize hotel objects to match listing card rendering
        const normalizedHotels = hotels.map(hotel => ({
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
            address: hotel.address
        }));
        // Merge listings and hotels
        const allListings = [...listings, ...normalizedHotels];
        renderListings(allListings);
    } catch (err) {
        showNotification('Could not load listings: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', loadListingsFromBackend);
// Handle Edit and Delete actions after rendering
document.addEventListener('click', async function(e) {
    // Delete Listing or Hotel
    if (e.target.closest('.delete-listing-btn')) {
        const btn = e.target.closest('.delete-listing-btn');
        const listingId = btn.getAttribute('data-id');
        // Find the card and check if it's a hotel
        const card = btn.closest('.listing-card');
        const isHotel = card && card.querySelector('.listing-card-badge')?.textContent === 'Hotel';
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const url = isHotel
                    ? `https://cribzconnect-backend.onrender.com/api/hotels/${listingId}`
                    : `https://cribzconnect-backend.onrender.com/api/listings/${listingId}`;
                const res = await fetch(url, { method: 'DELETE' });
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
        const isHotel = card && card.querySelector('.listing-card-badge')?.textContent === 'Hotel';
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
            showNotification('Could not load item for edit: ' + err.message, 'error');
        }
    }
});

// Show Edit Listing Modal (to be implemented)
function showEditListingModal(listing, isHotel = false) {
    // Show modal
    const modal = document.getElementById('editListingModal');
    modal.style.display = 'flex';
    // Pre-fill form fields
    document.getElementById('editListingId').value = listing._id || '';
    document.getElementById('editTitle').value = isHotel ? (listing.name || '') : (listing.title || '');
    document.getElementById('editDescription').value = listing.description || '';
    document.getElementById('editPropertyType').value = listing.propertyType || '';
    document.getElementById('editListingType').value = isHotel ? 'Hotel' : (listing.listingType || 'Sale');
    document.getElementById('editBedrooms').value = isHotel ? (listing.rooms || '') : (listing.bedrooms || '');
    document.getElementById('editBathrooms').value = listing.bathrooms || '';
    document.getElementById('editBeds').value = listing.beds || '';
    document.getElementById('editRooms').value = listing.rooms || '';
    document.getElementById('editGuests').value = listing.guests || '';
    document.getElementById('editSize').value = listing.size || '';
    document.getElementById('editUnitMeasure').value = listing.unitMeasure || '';
    document.getElementById('editPrice').value = listing.price || '';
    document.getElementById('editAddress').value = listing.address || '';
    // Store type for submit
    modal.setAttribute('data-is-hotel', isHotel ? 'true' : 'false');
}

// Close modal logic
document.getElementById('closeEditModal').onclick = function() {
    document.getElementById('editListingModal').style.display = 'none';
};

// Submit edit form
document.getElementById('editListingForm').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editListingId').value;
    const modal = document.getElementById('editListingModal');
    const isHotel = modal.getAttribute('data-is-hotel') === 'true';
    let updatedItem;
    if (isHotel) {
        updatedItem = {
            name: document.getElementById('editTitle').value,
            description: document.getElementById('editDescription').value,
            rooms: document.getElementById('editBedrooms').value,
            bathrooms: document.getElementById('editBathrooms').value,
            beds: document.getElementById('editBeds').value,
            size: document.getElementById('editSize').value,
            unitMeasure: document.getElementById('editUnitMeasure').value,
            price: document.getElementById('editPrice').value,
            address: document.getElementById('editAddress').value,
        };
    } else {
        updatedItem = {
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
    }
    try {
        const url = isHotel
            ? `https://cribzconnect-backend.onrender.com/api/hotels/${id}`
            : `https://cribzconnect-backend.onrender.com/api/listings/${id}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedItem),
        });
        if (!res.ok) throw new Error('Failed to update item');
        showNotification((isHotel ? 'Hotel' : 'Listing') + ' updated!', 'success');
        document.getElementById('editListingModal').style.display = 'none';
        await loadListingsFromBackend();
    } catch (err) {
        showNotification('Could not update item: ' + err.message, 'error');
    }
};
