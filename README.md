# 🗺️ Discover India - Tourism Place Recommender

A comprehensive web application that recommends amazing tourist destinations across India using AI-powered recommendation algorithms.

## ✨ Features

- **Smart Recommendations**: AI-powered content-based and collaborative filtering
- **Search & Discovery**: Find places by name, city, or state
- **Real-time Autocomplete**: Intelligent search suggestions
- **Beautiful UI**: Modern, responsive design with stunning images
- **Place Details**: Comprehensive information about each destination
- **Similar Places**: Discover related destinations
- **Mobile Friendly**: Responsive design for all devices

## 🚀 Technologies Used

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI/ML**: Scikit-learn, TF-IDF, Cosine Similarity
- **Data Processing**: Pandas, NumPy
- **Styling**: Custom CSS with Font Awesome icons
- **Images**: Unsplash API integration

## 🏗️ Architecture

### Recommendation Engine
- **Content-based Filtering**: Uses TF-IDF and cosine similarity
- **Collaborative Filtering**: Based on popularity scores and ratings
- **Hybrid Approach**: Combines both methods for optimal results

### Data Structure
- **324+ Tourist Destinations** across India
- **Comprehensive Data**: Ratings, reviews, best times, locations
- **High-quality Images**: Professional photography for all places

## 📁 Project Structure

```
place-recommender/
├── app.py                 # Main Flask application
├── static/
│   ├── style.css         # Main stylesheet
│   └── script.js         # Frontend JavaScript
├── templates/
│   └── index.html        # Main HTML template
├── data/
│   └── places_clean.csv  # Tourism data (324 places)
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd place-recommender
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

## 📊 Data Sources

- **Tourism Data**: 324 destinations across India
- **Ratings**: Google review ratings and review counts
- **Images**: High-quality Unsplash photography
- **Categories**: Beaches, temples, forts, parks, museums, etc.

## 🔧 Configuration

### Environment Variables
- `FLASK_ENV`: Set to `development` for debug mode
- `PORT`: Server port (default: 5000)

### Data Customization
- Add new places to `data/places_clean.csv`
- Update image URLs for better visual appeal
- Modify recommendation algorithms in `app.py`

## 🎯 Key Features Explained

### 1. Smart Search
- Real-time autocomplete with 8+ suggestions
- Search across names, cities, and states
- Intelligent relevance scoring

### 2. Recommendation System
- **Content-based**: Similar places based on descriptions
- **Collaborative**: Popular destinations based on ratings
- **Hybrid**: Best of both approaches

### 3. User Experience
- Smooth animations and transitions
- Responsive design for all screen sizes
- Intuitive navigation and interactions

## 🚀 Performance Features

- **Lazy Loading**: Images load as needed
- **Infinite Scroll**: Smooth pagination
- **Caching**: Efficient data processing
- **Optimized Queries**: Fast search and recommendations

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Secure image handling

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Unsplash** for beautiful destination images
- **Font Awesome** for icons
- **Scikit-learn** for ML algorithms
- **Flask** for the web framework

## 📞 Support

If you have any questions or need help:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🎉 Recent Updates

- ✅ Fixed cross button functionality
- ✅ Added missing images for all 324 places
- ✅ Improved error handling and fallbacks
- ✅ Enhanced UI/UX with better styling
- ✅ Optimized recommendation algorithms

---

**Made with ❤️ for exploring the beautiful destinations of India**
