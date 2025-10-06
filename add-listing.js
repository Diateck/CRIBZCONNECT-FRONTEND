// add-listing.js
// Handles add listing form submission and editor logic

function setupAddListingPage() {
    const addListingForm = document.querySelector('.add-listing-form');
    const editorContent = document.querySelector('.editor-content');
    const hiddenTextarea = document.getElementById('property-description');
    const editorButtons = document.querySelectorAll('.editor-btn');

    // Rich text editor functionality
    if (editorContent && editorButtons.length > 0) {
        editorButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const command = button.getAttribute('data-command');
                if (command === 'bold' || command === 'italic') {
                    document.execCommand(command, false, null);
                    button.classList.toggle('active');
                } else if (command === 'insertParagraph') {
                    document.execCommand('insertHTML', false, '<p><br></p>');
                }
                editorContent.focus();
                updateHiddenTextarea();
            });
        });
        editorContent.addEventListener('input', updateHiddenTextarea);
        editorContent.addEventListener('paste', () => {
            setTimeout(updateHiddenTextarea, 10);
        });
        function updateHiddenTextarea() {
            if (hiddenTextarea) {
                hiddenTextarea.value = editorContent.innerHTML;
            }
        }
    }

    // Form submission
    if (addListingForm) {
        addListingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (editorContent && hiddenTextarea) {
                hiddenTextarea.value = editorContent.innerHTML;
            }
            const formData = new FormData(addListingForm);
            const requiredFields = ['propertyType','title', 'listingType', 'bedrooms', 'guests', 'beds', 'bathrooms', 'rooms', 'size', 'unitMeasure', 'price',  'address',  'description' ];
            for (const field of requiredFields) {
                if (!formData.get(field) || formData.get(field).toString().trim() === '') {
                    showNotification('Please fill in all mandatory fields', 'error');
                    return;
                }
            }
            // Convert number fields to numbers
            const numberFields = ['bedrooms', 'guests', 'beds', 'bathrooms', 'rooms', 'size', 'price'];
            numberFields.forEach(field => {
                if (formData.has(field)) {
                    formData.set(field, Number(formData.get(field)));
                }
            });
            if (!editorContent || editorContent.textContent.trim() === '') {
                showNotification('Please enter a property description', 'error');
                return;
            }
            const submitBtn = e.target.querySelector('.btn-save');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                // Build headers only when token exists to avoid sending 'undefined'
                const headers = {};
                if (user && user.token) {
                    headers['Authorization'] = `Bearer ${user.token}`;
                }
                console.log('add-listing: sending POST /api/listings with headers:', headers);
                const response = await fetch('https://cribzconnect-backend.onrender.com/api/listings', {
                    method: 'POST',
                    headers,
                    body: formData
                });
                if (!response.ok) {
                    // try to get body for debugging
                    let errText;
                    try {
                        const ct = response.headers.get('content-type') || '';
                        errText = ct.includes('application/json') ? JSON.stringify(await response.json()) : await response.text();
                    } catch (e) {
                        errText = 'unable to read response body';
                    }
                    console.error('add-listing: server returned', response.status, errText);
                    throw new Error(`Failed to save listing (status ${response.status}): ${errText}`);
                }
                showNotification('Listing published successfully!', 'success');
                await loadListingsFromBackend();
                showPage('listings');
            } catch (err) {
                showNotification('Error: ' + err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', setupAddListingPage);
