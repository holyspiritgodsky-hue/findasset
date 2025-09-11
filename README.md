# FindAsset

FindAsset is a web-based application for discovering and managing real-world assets. It provides an intuitive interface to search, filter, and catalog various types of physical assets including real estate, vehicles, equipment, jewelry, electronics, and collectibles.

## Features

- **Asset Search**: Search for assets by name or description
- **Category Filtering**: Filter assets by type (Real Estate, Vehicles, Equipment, Jewelry, Electronics, Collectibles)
- **Location Filtering**: Filter assets by geographic location
- **Add New Assets**: Simple form to add new assets to the database
- **Responsive Design**: Works on desktop and mobile devices
- **Visual Asset Cards**: Clean, card-based layout displaying asset information

## Getting Started

### Prerequisites

- A modern web browser
- Python 3 (for local development server) or any HTTP server

### Running the Application

1. Clone this repository:
   ```bash
   git clone https://github.com/holyspiritgodsky-hue/findasset.git
   cd findasset
   ```

2. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

### Usage

1. **Search Assets**: Use the search bar to find assets by name or description
2. **Filter by Category**: Select a category from the dropdown to show only specific types of assets
3. **Filter by Location**: Select a location to show assets in specific geographic areas
4. **Add New Asset**: Click "Add New Asset" button to add a new asset to the collection
5. **View Details**: Each asset card displays key information including name, category, location, value, and description

## Asset Categories

- **Real Estate**: Properties, buildings, land
- **Vehicles**: Cars, trucks, motorcycles, boats
- **Equipment**: Machinery, tools, industrial equipment
- **Jewelry**: Watches, rings, necklaces, precious stones
- **Electronics**: Computers, cameras, audio equipment
- **Collectibles**: Art, coins, cards, antiques

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Modern CSS with Flexbox and Grid
- **Data Storage**: Client-side JavaScript array (in-memory)

## File Structure

```
findasset/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is open source and available under the MIT License.
