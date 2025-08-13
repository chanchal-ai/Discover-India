// Global variables
let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;
let searchQuery = '';
let autocompleteTimeout = null;
let selectedAutocompleteIndex = -1;
let autocompleteSuggestions = [];

// DOM elements
const placesGrid = document.getElementById('placesGrid');
const searchResults = document.getElementById('searchResults');
const searchResultsGrid = document.getElementById('searchResultsGrid');
const feedSection = document.getElementById('feedSection');
const loadingState = document.getElementById('loadingState');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const noMoreResults = document.getElementById('noMoreResults');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearch');
const exploreBtn = document.getElementById('exploreBtn');
const placeModal = document.getElementById('placeModal');
const closeModal = document.getElementById('closeModal');
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
const autocompleteList = document.getElementById('autocompleteList');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Load initial feed
    loadFeed();
    
    // Setup intersection observer for infinite scroll
    setupInfiniteScroll();
}

function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Autocomplete functionality
    searchInput.addEventListener('input', handleAutocompleteInput);
    searchInput.addEventListener('keydown', handleAutocompleteKeydown);
    searchInput.addEventListener('focus', showAutocompleteIfHasQuery);
    searchInput.addEventListener('blur', hideAutocompleteDelayed);
    
    // Clear search
    clearSearchBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        clearSearch();
    });
    
    // Explore button
    exploreBtn.addEventListener('click', function() {
        clearSearch();
        loadFeed();
    });
    
    // Load more button
    loadMoreBtn.addEventListener('click', loadMorePlaces);
    
    // Modal close
    closeModal.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePlaceModal();
    });
    
    // Close modal when clicking outside
    placeModal.addEventListener('click', function(e) {
        if (e.target === placeModal) {
            closePlaceModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && placeModal.style.display === 'block') {
            closePlaceModal();
        }
    });
    
    // Hide autocomplete when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
            hideAutocomplete();
        }
    });
}

// Autocomplete functionality
async function handleAutocompleteInput(e) {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
    }
    
    // Hide autocomplete if query is too short
    if (query.length < 2) {
        hideAutocomplete();
        return;
    }
    
    // Set timeout to avoid too many API calls
    autocompleteTimeout = setTimeout(async () => {
        await fetchAutocompleteSuggestions(query);
    }, 300);
}

async function fetchAutocompleteSuggestions(query) {
    try {
        const response = await fetch(`/autocomplete?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            autocompleteSuggestions = data.suggestions;
            displayAutocompleteSuggestions();
        }
    } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
        hideAutocomplete();
    }
}

function displayAutocompleteSuggestions() {
    if (autocompleteSuggestions.length === 0) {
        hideAutocomplete();
        return;
    }
    
    autocompleteList.innerHTML = '';
    selectedAutocompleteIndex = -1;
    
    autocompleteSuggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.dataset.index = index;
        
        const typeLabel = suggestion.type === 'name' ? 'Place' : 
                         suggestion.type === 'city' ? 'City' : 'State';
        
        item.innerHTML = `
            <div class="autocomplete-item-content">
                <div class="autocomplete-item-text">${suggestion.text}</div>
                <div class="autocomplete-item-location">${suggestion.location}</div>
            </div>
            <div class="autocomplete-item-rating">
                ⭐ ${suggestion.rating.toFixed(1)}
            </div>
            <div class="autocomplete-item-type">${typeLabel}</div>
        `;
        
        // Add click event
        item.addEventListener('click', () => {
            selectAutocompleteSuggestion(suggestion);
        });
        
        // Add hover events
        item.addEventListener('mouseenter', () => {
            selectedAutocompleteIndex = index;
            updateAutocompleteSelection();
        });
        
        autocompleteList.appendChild(item);
    });
    
    showAutocomplete();
}

function showAutocomplete() {
    autocompleteDropdown.style.display = 'block';
    autocompleteDropdown.style.opacity = '0';
    setTimeout(() => {
        autocompleteDropdown.style.opacity = '1';
    }, 10);
}

function hideAutocomplete() {
    autocompleteDropdown.style.opacity = '0';
    setTimeout(() => {
        autocompleteDropdown.style.display = 'none';
    }, 200);
}

function hideAutocompleteDelayed() {
    // Small delay to allow clicking on suggestions
    setTimeout(() => {
        hideAutocomplete();
    }, 150);
}

function showAutocompleteIfHasQuery() {
    const query = searchInput.value.trim();
    if (query.length >= 2 && autocompleteSuggestions.length > 0) {
        showAutocomplete();
    }
}

function updateAutocompleteSelection() {
    // Remove previous selection
    const items = autocompleteList.querySelectorAll('.autocomplete-item');
    items.forEach(item => item.classList.remove('selected'));
    
    // Add selection to current index
    if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < items.length) {
        items[selectedAutocompleteIndex].classList.add('selected');
    }
}

function handleAutocompleteKeydown(e) {
    if (autocompleteDropdown.style.display === 'none') return;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, autocompleteSuggestions.length - 1);
            updateAutocompleteSelection();
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, -1);
            updateAutocompleteSelection();
            break;
            
        case 'Enter':
            e.preventDefault();
            if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < autocompleteSuggestions.length) {
                selectAutocompleteSuggestion(autocompleteSuggestions[selectedAutocompleteIndex]);
            } else {
                handleSearch();
            }
            break;
            
        case 'Escape':
            hideAutocomplete();
            searchInput.blur();
            break;
    }
}

function selectAutocompleteSuggestion(suggestion) {
    searchInput.value = suggestion.text;
    hideAutocomplete();
    
    // Perform search with the selected suggestion
    if (suggestion.type === 'name') {
        // Search for the specific place
        performSearch(suggestion.text);
    } else {
        // Search for places in the city or state
        performSearch(suggestion.text);
    }
}

// Load feed with recommendations
async function loadFeed(page = 1, append = false) {
    if (isLoading) return;
    
    isLoading = true;
    
    if (!append) {
        showLoadingState();
        currentPage = 1;
        hasMoreResults = true;
    }
    
    try {
        const response = await fetch(`/feed?page=${page}&limit=20`);
        const data = await response.json();
        
        if (data.success) {
            if (append) {
                appendPlaces(data.places);
            } else {
                displayPlaces(data.places);
            }
            
            hasMoreResults = data.has_more;
            currentPage = page;
            
            updateLoadMoreButton();
        } else {
            showError('Failed to load recommendations');
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        showError('Failed to load recommendations');
    } finally {
        isLoading = false;
        if (!append) {
            hideLoadingState();
        }
    }
}

// Load more places (pagination)
async function loadMorePlaces() {
    if (isLoading || !hasMoreResults) return;
    
    await loadFeed(currentPage + 1, true);
}

// Search functionality
async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        showError('Please enter a search term');
        return;
    }
    
    searchQuery = query;
    await performSearch(query);
}

async function performSearch(query) {
    try {
        showLoadingState();
        
        const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            displaySearchResults(data.places, query);
        } else {
            showError(data.error || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed');
    } finally {
        hideLoadingState();
    }
}

// Display search results
function displaySearchResults(places, query) {
    // Hide feed section
    feedSection.style.display = 'none';
    
    // Show search results
    searchResults.style.display = 'block';
    
    // Update search results header
    const searchHeader = searchResults.querySelector('.section-header h2');
    searchHeader.textContent = `Search Results for "${query}"`;
    
    // Clear previous results
    searchResultsGrid.innerHTML = '';
    
    if (places.length === 0) {
        searchResultsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>Try searching with different keywords</p>
            </div>
        `;
        return;
    }
    
    // Display places
    places.forEach(place => {
        const placeCard = createPlaceCard(place);
        searchResultsGrid.appendChild(placeCard);
    });
    
    // Add animation
    searchResultsGrid.classList.add('fade-in');
}

// Clear search and show feed
function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    searchResults.style.display = 'none';
    feedSection.style.display = 'block';
    hideAutocomplete();
    
    // Reset to initial state
    currentPage = 1;
    hasMoreResults = true;
    loadFeed();
}

// Display places in the main grid
function displayPlaces(places) {
    placesGrid.innerHTML = '';
    
    places.forEach(place => {
        const placeCard = createPlaceCard(place);
        placesGrid.appendChild(placeCard);
    });
    
    // Add animation
    placesGrid.classList.add('fade-in');
}

// Append places to existing grid
function appendPlaces(places) {
    places.forEach(place => {
        const placeCard = createPlaceCard(place);
        placesGrid.appendChild(placeCard);
        
        // Add slide-up animation
        placeCard.classList.add('slide-up');
    });
}

// Create a place card element
function createPlaceCard(place) {
    const card = document.createElement('div');
    card.className = 'place-card';
    
    const stars = generateStars(place.rating);
    
    card.innerHTML = `
        <div class="place-image">
            <img src="${place.image_url}" alt="${place.name}" loading="lazy" onerror="this.classList.add('fallback-image')">
            <div class="place-overlay"></div>
        </div>
        <div class="place-content">
            <h3 class="place-name">${place.name}</h3>
            <div class="place-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${place.location}</span>
            </div>
            <div class="place-rating">
                <div class="stars">
                    ${stars}
                </div>
                <span class="rating-number">${place.rating}</span>
                <span class="reviews">(${formatReviews(place.reviews)} reviews)</span>
            </div>
            <div class="place-time">
                <i class="fas fa-clock"></i>
                <span>Best time: ${place.best_time}</span>
            </div>
        </div>
    `;
    
    // Add click event to open modal
    card.addEventListener('click', () => {
        openPlaceModal(place);
    });
    
    return card;
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

// Format review count
function formatReviews(reviews) {
    if (reviews >= 1) {
        return `${reviews.toFixed(1)}L`;
    } else {
        return `${(reviews * 10).toFixed(0)}K`;
    }
}

// Open place detail modal
async function openPlaceModal(place) {
    try {
        // Show loading in modal
        showModalLoading();
        
        // Fetch place details
        const response = await fetch(`/place/${encodeURIComponent(place.name)}`);
        const data = await response.json();
        
        if (data.success) {
            displayPlaceModal(data.place, data.similar_places);
        } else {
            showError('Failed to load place details');
        }
    } catch (error) {
        console.error('Error loading place details:', error);
        showError('Failed to load place details');
    }
}

// Display place modal
function displayPlaceModal(place, similarPlaces) {
    // Set modal content
    document.getElementById('modalTitle').textContent = place.name;
    const modalImage = document.getElementById('modalImage');
    modalImage.src = place.image_url;
    modalImage.alt = place.name;
    modalImage.onerror = function() {
        this.classList.add('fallback-image');
    };
    document.getElementById('modalLocation').textContent = place.location;
    document.getElementById('modalRating').textContent = place.rating;
    document.getElementById('modalReviews').textContent = formatReviews(place.reviews);
    document.getElementById('modalBestTime').textContent = place.best_time;
    
    // Set stars
    document.getElementById('modalStars').innerHTML = generateStars(place.rating);
    
    // Display similar places
    displaySimilarPlaces(similarPlaces);
    
    // Show modal
    placeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Display similar places in modal
function displaySimilarPlaces(similarPlaces) {
    const similarGrid = document.getElementById('similarGrid');
    similarGrid.innerHTML = '';
    
    similarPlaces.forEach(place => {
        const similarCard = document.createElement('div');
        similarCard.className = 'similar-card';
        
        similarCard.innerHTML = `
            <img src="${place.image_url}" alt="${place.name}" loading="lazy" onerror="this.classList.add('fallback-image')">
            <h5>${place.name}</h5>
            <p>${place.location}</p>
            <div class="stars">
                ${generateStars(place.rating)}
            </div>
        `;
        
        // Add click event to open modal for similar place
        similarCard.addEventListener('click', () => {
            openPlaceModal(place);
        });
        
        similarGrid.appendChild(similarCard);
    });
}

// Show modal loading state
function showModalLoading() {
    document.getElementById('modalTitle').textContent = 'Loading...';
    document.getElementById('modalImage').src = '';
    document.getElementById('modalLocation').textContent = '';
    document.getElementById('modalRating').textContent = '';
    document.getElementById('modalReviews').textContent = '';
    document.getElementById('modalBestTime').textContent = '';
    document.getElementById('modalStars').innerHTML = '';
    document.getElementById('similarGrid').innerHTML = '';
    
    placeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close place modal
function closePlaceModal() {
    placeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Show loading state
function showLoadingState() {
    loadingState.style.display = 'block';
    placesGrid.style.display = 'none';
    loadMoreContainer.style.display = 'none';
    noMoreResults.style.display = 'none';
}

// Hide loading state
function hideLoadingState() {
    loadingState.style.display = 'none';
    placesGrid.style.display = 'grid';
}

// Update load more button
function updateLoadMoreButton() {
    if (hasMoreResults) {
        loadMoreContainer.style.display = 'block';
        noMoreResults.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'none';
        if (currentPage > 1) {
            noMoreResults.style.display = 'block';
        }
    }
}

// Setup infinite scroll
function setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading && hasMoreResults && !searchQuery) {
                loadMorePlaces();
            }
        });
    }, options);
    
    // Observe the load more button
    if (loadMoreBtn) {
        observer.observe(loadMoreBtn);
    }
}

// Show error toast
function showError(message) {
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorToast.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorToast.classList.remove('show');
    }, 5000);
}

// Show success toast
function showSuccess(message) {
    const successToast = document.getElementById('successToast');
    const successMessage = document.getElementById('successMessage');
    
    successMessage.textContent = message;
    successToast.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        successToast.classList.remove('show');
    }, 3000);
}

// Toast close functionality
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('toast-close')) {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.toast').classList.remove('show');
    }
});

// Add CSS for missing elements
const additionalStyles = `
    .no-results {
        text-align: center;
        padding: 4rem 0;
        color: #6b7280;
    }
    
    .no-results i {
        font-size: 3rem;
        color: #9ca3af;
        margin-bottom: 1rem;
    }
    
    .no-results h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
    }
    
    .no-results p {
        color: #6b7280;
    }
    
    .far.fa-star {
        color: #d1d5db;
    }
    
    .fas.fa-star-half-alt {
        color: #fbbf24;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Handle image loading errors with better fallback images
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        // Use a better fallback image from Unsplash
        const fallbackImages = [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3OTA4MjB8MHwxfHNlYXJjaHwxfHxuYXR1cmV8ZW58MHx8fHwxNzU1MDA0NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3OTA4MjB8MHwxfHNlYXJjaHwxfHxmb3Jlc3R8ZW58MHx8fHwxNzU1MDA0NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
            'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3OTA4MjB8MHwxfHNlYXJjaHwxfGNpdHl8ZW58MHx8fHwxNzU1MDA0NTkyfDA&ixlib=rb-4.1.0&q=80&w=1080'
        ];
        
        // Randomly select a fallback image
        const randomIndex = Math.floor(Math.random() * fallbackImages.length);
        e.target.src = fallbackImages[randomIndex];
        
        // Add a class to indicate this is a fallback image
        e.target.classList.add('fallback-image');
    }
}, true);

// Performance optimization: Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    // Observe all images
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => imageObserver.observe(img));
    });
}
