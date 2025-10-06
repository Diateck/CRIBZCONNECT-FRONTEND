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
            <div class="listing-card-image-section">
                <img src="${(listing.images && listing.images.length) ? listing.images[0] : '/api/placeholder/350/240'}" alt="${listing.title || 'Property Image'}" class="listing-card-image" />
            </div>
            <div class="listing-card-content-section">
                <div class="listing-card-header">
                    <span class="listing-card-price">$${listing.price ? Number(listing.price).toLocaleString() : '0'}</span>
                    <span class="listing-card-badge">${listing.listingType === 'Sale' ? 'FOR SALE' : (listing.listingType === 'Rent' ? 'FOR RENT' : 'FOR SALE')}</span>
                </div>
                <h3 class="listing-card-title">${listing.title || 'Property Title'}</h3>
                <p class="listing-card-location">${listing.address || 'Location'}</p>
                <div class="listing-card-specs">
                    <span><i class="fas fa-ruler-combined"></i> ${(listing.size || 700).toLocaleString()} sq. ft.</span>
                    <span><i class="fas fa-bed"></i> ${listing.bedrooms || 2} Bed</span>
                    <span><i class="fas fa-bath"></i> ${listing.bathrooms || 1} Bath</span>
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
        const response = await fetch('https://cribzconnect-backend.onrender.com/api/listings');
        if (!response.ok) throw new Error('Failed to fetch listings');
        const listings = await response.json();
        renderListings(listings);
    } catch (err) {
        showNotification('Could not load listings: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', loadListingsFromBackend);
// Handle Edit and Delete actions after rendering
document.addEventListener('click', async function(e) {
    // Delete Listing
    if (e.target.closest('.delete-listing-btn')) {
        const btn = e.target.closest('.delete-listing-btn');
        const listingId = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this listing?')) {
            try {
                const res = await fetch(`https://cribzconnect-backend.onrender.com/api/listings/${listingId}`, {
                    method: 'DELETE',
                });
                if (!res.ok) throw new Error('Failed to delete listing');
                showNotification('Listing deleted!', 'success');
                await loadListingsFromBackend();
            } catch (err) {
                showNotification('Could not delete listing: ' + err.message, 'error');
            }
        }
    }

    // Edit Listing
    if (e.target.closest('.edit-listing-btn')) {
        const btn = e.target.closest('.edit-listing-btn');
        const listingId = btn.getAttribute('data-id');
        // Fetch listing details and show edit modal
        try {
            const res = await fetch(`https://cribzconnect-backend.onrender.com/api/listings/${listingId}`);
            if (!res.ok) throw new Error('Failed to fetch listing details');
            const listing = await res.json();
            showEditListingModal(listing);
        } catch (err) {
            showNotification('Could not load listing for edit: ' + err.message, 'error');
        }
    }
});

// Show Edit Listing Modal (to be implemented)
function showEditListingModal(listing) {
    // Show modal
    const modal = document.getElementById('editListingModal');
    modal.style.display = 'flex';
    // Pre-fill form fields
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

// Close modal logic
document.getElementById('closeEditModal').onclick = function() {
    document.getElementById('editListingModal').style.display = 'none';
};

// Submit edit form
document.getElementById('editListingForm').onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('editListingId').value;
    const updatedListing = {
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
            body: JSON.stringify(updatedListing),
        });
        if (!res.ok) throw new Error('Failed to update listing');
        showNotification('Listing updated!', 'success');
        document.getElementById('editListingModal').style.display = 'none';
        await loadListingsFromBackend();
    } catch (err) {
        showNotification('Could not update listing: ' + err.message, 'error');
    }
};
