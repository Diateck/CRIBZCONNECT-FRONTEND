// listings.js
// Handles fetching and rendering listings from backend

function renderListings(listings) {
    const listingsContent = document.querySelector('.listings-content');
    if (!listingsContent) return;
    listingsContent.innerHTML = '';
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
        <div class="listing-card">
            <div class="listing-images">
                ${(listing.images && listing.images.length) ? listing.images.map(url => `<img src="${url}" alt="Property image" class="listing-image">`).join('') : '<div class="no-image">No image</div>'}
            </div>
            <div class="listing-details">
                <h3>${listing.title}</h3>
                <p>${listing.description}</p>
                <p><strong>Type:</strong> ${listing.propertyType}</p>
                <p><strong>Price:</strong> ${listing.price}</p>
                <p><strong>Address:</strong> ${listing.address}</p>
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
