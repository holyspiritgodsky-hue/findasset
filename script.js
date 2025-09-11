// Asset data storage
let assets = [
    {
        id: 1,
        name: "Luxury Downtown Apartment",
        category: "real-estate",
        location: "new-york",
        value: 2500000,
        description: "A beautiful 3-bedroom apartment in Manhattan with stunning city views and modern amenities."
    },
    {
        id: 2,
        name: "2022 Tesla Model S",
        category: "vehicles",
        location: "california",
        value: 94990,
        description: "Electric luxury sedan with autopilot features and premium interior."
    },
    {
        id: 3,
        name: "Commercial Excavator",
        category: "equipment",
        location: "texas",
        value: 185000,
        description: "Heavy-duty construction equipment suitable for large-scale projects."
    },
    {
        id: 4,
        name: "Vintage Rolex Submariner",
        category: "jewelry",
        location: "florida",
        value: 15000,
        description: "Classic 1970s Rolex Submariner in excellent condition with original box and papers."
    },
    {
        id: 5,
        name: "Professional Camera Equipment",
        category: "electronics",
        location: "chicago",
        value: 8500,
        description: "Complete photography setup including Canon EOS R5, multiple lenses, and lighting equipment."
    },
    {
        id: 6,
        name: "Rare Baseball Card Collection",
        category: "collectibles",
        location: "new-york",
        value: 25000,
        description: "Collection of vintage baseball cards including several rookie cards from the 1950s."
    }
];

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const locationFilter = document.getElementById('locationFilter');
const addAssetBtn = document.getElementById('addAssetBtn');
const addAssetForm = document.getElementById('addAssetForm');
const saveAssetBtn = document.getElementById('saveAssetBtn');
const cancelAssetBtn = document.getElementById('cancelAssetBtn');
const assetsList = document.getElementById('assetsList');
const resultsCount = document.getElementById('resultsCount');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    displayAssets(assets);
    setupEventListeners();
});

// Event listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    categoryFilter.addEventListener('change', performSearch);
    locationFilter.addEventListener('change', performSearch);
    
    addAssetBtn.addEventListener('click', toggleAddAssetForm);
    saveAssetBtn.addEventListener('click', saveNewAsset);
    cancelAssetBtn.addEventListener('click', hideAddAssetForm);
}

// Search functionality
function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const selectedLocation = locationFilter.value;
    
    const filteredAssets = assets.filter(asset => {
        const matchesSearch = !searchTerm || 
            asset.name.toLowerCase().includes(searchTerm) ||
            asset.description.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !selectedCategory || asset.category === selectedCategory;
        const matchesLocation = !selectedLocation || asset.location === selectedLocation;
        
        return matchesSearch && matchesCategory && matchesLocation;
    });
    
    displayAssets(filteredAssets);
}

// Display assets
function displayAssets(assetsToDisplay) {
    resultsCount.textContent = `${assetsToDisplay.length} asset(s) found`;
    
    if (assetsToDisplay.length === 0) {
        assetsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No assets found matching your criteria.</p>';
        return;
    }
    
    assetsList.innerHTML = assetsToDisplay.map(asset => `
        <div class="asset-card">
            <div class="asset-name">${asset.name}</div>
            <div class="asset-category">${formatCategory(asset.category)}</div>
            <div class="asset-location">📍 ${formatLocation(asset.location)}</div>
            <div class="asset-value">💰 $${asset.value.toLocaleString()}</div>
            <div class="asset-description">${asset.description}</div>
        </div>
    `).join('');
}

// Format category for display
function formatCategory(category) {
    const categoryMap = {
        'real-estate': 'Real Estate',
        'vehicles': 'Vehicles',
        'equipment': 'Equipment',
        'jewelry': 'Jewelry',
        'electronics': 'Electronics',
        'collectibles': 'Collectibles'
    };
    return categoryMap[category] || category;
}

// Format location for display
function formatLocation(location) {
    const locationMap = {
        'new-york': 'New York',
        'california': 'California',
        'texas': 'Texas',
        'florida': 'Florida',
        'chicago': 'Chicago'
    };
    return locationMap[location] || location;
}

// Add new asset functionality
function toggleAddAssetForm() {
    addAssetForm.classList.toggle('hidden');
    if (!addAssetForm.classList.contains('hidden')) {
        document.getElementById('assetName').focus();
    }
}

function hideAddAssetForm() {
    addAssetForm.classList.add('hidden');
    clearAssetForm();
}

function clearAssetForm() {
    document.getElementById('assetName').value = '';
    document.getElementById('assetCategory').value = '';
    document.getElementById('assetLocation').value = '';
    document.getElementById('assetValue').value = '';
    document.getElementById('assetDescription').value = '';
}

function saveNewAsset() {
    const name = document.getElementById('assetName').value.trim();
    const category = document.getElementById('assetCategory').value;
    const location = document.getElementById('assetLocation').value.trim();
    const value = parseFloat(document.getElementById('assetValue').value) || 0;
    const description = document.getElementById('assetDescription').value.trim();
    
    // Validation
    if (!name || !category || !location) {
        alert('Please fill in all required fields (Name, Category, and Location).');
        return;
    }
    
    // Create new asset
    const newAsset = {
        id: Date.now(), // Simple ID generation
        name: name,
        category: category,
        location: location.toLowerCase().replace(/\s+/g, '-'),
        value: value,
        description: description || 'No description provided.'
    };
    
    // Add to assets array
    assets.unshift(newAsset); // Add to beginning of array
    
    // Update display
    displayAssets(assets);
    hideAddAssetForm();
    
    // Show success message
    showMessage('Asset added successfully!', 'success');
}

// Show temporary message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        ${type === 'success' ? 'background: #28a745;' : 'background: #007bff;'}
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}