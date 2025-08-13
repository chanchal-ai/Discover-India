from flask import Flask, jsonify, request, render_template
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import json
import re

app = Flask(__name__)

# Load and preprocess data
def load_data():
    try:
        print("Loading data from CSV...")
        # Load the CSV file
        df = pd.read_csv('data/places_clean.csv')
        print(f"Loaded {len(df)} rows from CSV")
        
        # Clean and prepare data
        df['Google review rating'] = pd.to_numeric(df['Google review rating'], errors='coerce')
        df['Number of google review in lakhs'] = pd.to_numeric(df['Number of google review in lakhs'], errors='coerce')
        
        # Fill missing values properly
        rating_mean = df['Google review rating'].mean()
        review_mean = df['Number of google review in lakhs'].mean()
        
        print(f"Rating mean: {rating_mean}, Review mean: {review_mean}")
        
        df = df.copy()  # Create a copy to avoid warnings
        df.loc[df['Google review rating'].isna(), 'Google review rating'] = rating_mean
        df.loc[df['Number of google review in lakhs'].isna(), 'Number of google review in lakhs'] = review_mean
        
        # Create popularity score
        df['popularity_score'] = df['Google review rating'] * np.log1p(df['Number of google review in lakhs'])
        
        # Create combined text for content-based filtering
        df['combined_text'] = df['State'].fillna('') + ' ' + df['City'].fillna('') + ' ' + df['Name'].fillna('') + ' ' + df['Best Time to visit'].fillna('')
        
        print("Data loading completed successfully")
        print(f"DataFrame shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        import traceback
        traceback.print_exc()
        raise

# Initialize data
df = load_data()

# Content-based filtering using TF-IDF
def content_based_recommendations(place_name, n_recommendations=10):
    try:
        # Find the place index - use safer string matching
        place_mask = df['Name'].str.lower().str.contains(place_name.lower(), regex=False, na=False)
        if not place_mask.any():
            print(f"Place '{place_name}' not found in dataset")
            return df.head(n_recommendations)
        
        place_idx = place_mask.idxmax()
        
        # Create TF-IDF vectors
        tfidf = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = tfidf.fit_transform(df['combined_text'])
        
        # Calculate cosine similarity
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
        
        # Get similar places
        sim_scores = list(enumerate(cosine_sim[place_idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = sim_scores[1:n_recommendations+1]
        
        place_indices = [i[0] for i in sim_scores]
        return df.iloc[place_indices]
    except Exception as e:
        print(f"Error in content-based recommendations: {e}")
        return df.head(n_recommendations)

# Collaborative filtering using popularity and ratings
def collaborative_recommendations(n_recommendations=10):
    # Sort by popularity score
    return df.nlargest(n_recommendations, 'popularity_score')

# Hybrid recommendations
def hybrid_recommendations(n_recommendations=20):
    try:
        # Get collaborative recommendations (60%)
        collab_count = int(n_recommendations * 0.6)
        collab_recs = collaborative_recommendations(collab_count)
        
        # Get content-based recommendations from top places (40%)
        content_count = n_recommendations - collab_count
        top_places = df.nlargest(10, 'popularity_score')
        
        # Get content-based recommendations for top places
        content_recs = []
        for _, place in top_places.iterrows():
            try:
                similar = content_based_recommendations(place['Name'], 2)
                if not similar.empty:
                    content_recs.append(similar)
            except Exception as e:
                print(f"Error getting recommendations for {place['Name']}: {e}")
                continue
        
        if content_recs:
            content_recs = pd.concat(content_recs).drop_duplicates()
            content_recs = content_recs.head(content_count)
        else:
            content_recs = pd.DataFrame()
        
        # Combine and remove duplicates
        if not content_recs.empty:
            combined = pd.concat([collab_recs, content_recs]).drop_duplicates(subset=['Name'])
        else:
            combined = collab_recs.copy()
        
        # Sort by popularity score
        combined = combined.nlargest(n_recommendations, 'popularity_score')
        
        return combined
    except Exception as e:
        print(f"Error in hybrid recommendations: {e}")
        # Fallback to collaborative recommendations
        return collaborative_recommendations(n_recommendations)

# Search functionality
def search_places(query, n_results=20):
    query = query.lower()
    
    # Search in name, city, state, and best time - use regex=False for safety
    mask = (
        df['Name'].str.lower().str.contains(query, regex=False, na=False) |
        df['City'].str.lower().str.contains(query, regex=False, na=False) |
        df['State'].str.lower().str.contains(query, regex=False, na=False) |
        df['Best Time to visit'].str.lower().str.contains(query, regex=False, na=False)
    )
    
    results = df[mask].copy()
    
    if results.empty:
        return results
    
    # Sort by relevance (exact matches first) and popularity
    results['relevance_score'] = 0
    
    # Exact matches get higher scores - use safer string operations
    exact_name = results['Name'].str.lower() == query
    exact_city = results['City'].str.lower() == query
    exact_state = results['State'].str.lower() == query
    
    results.loc[exact_name, 'relevance_score'] += 10
    results.loc[exact_city, 'relevance_score'] += 8
    results.loc[exact_state, 'relevance_score'] += 6
    
    # Partial matches
    partial_name = results['Name'].str.lower().str.contains(query, regex=False, na=False)
    partial_city = results['City'].str.lower().str.contains(query, regex=False, na=False)
    partial_state = results['State'].str.lower().str.contains(query, regex=False, na=False)
    
    results.loc[partial_name, 'relevance_score'] += 5
    results.loc[partial_city, 'relevance_score'] += 3
    results.loc[partial_state, 'relevance_score'] += 2
    
    # Sort by relevance and popularity
    results = results.sort_values(['relevance_score', 'popularity_score'], ascending=[False, False])
    
    return results.head(n_results)

# Autocomplete functionality for real-time suggestions
def get_autocomplete_suggestions(query, max_suggestions=10):
    if not query or len(query.strip()) < 2:
        return []
    
    query = query.strip()
    suggestions = []
    
    # Search in name, city, and state with case-sensitive matching
    # Name matches (highest priority)
    name_matches = df[df['Name'].str.contains(query, regex=False, na=False)]
    for _, place in name_matches.iterrows():
        suggestions.append({
            'type': 'name',
            'text': place['Name'],
            'location': f"{place['City']}, {place['State']}",
            'rating': float(place['Google review rating']),
            'relevance_score': 100  # Highest priority for name matches
        })
    
    # City matches (medium priority)
    city_matches = df[df['City'].str.contains(query, regex=False, na=False)]
    for _, place in city_matches.iterrows():
        suggestions.append({
            'type': 'city',
            'text': place['City'],
            'location': f"{place['State']}",
            'rating': float(place['Google review rating']),
            'relevance_score': 50  # Medium priority for city matches
        })
    
    # State matches (lower priority)
    state_matches = df[df['State'].str.contains(query, regex=False, na=False)]
    for _, place in state_matches.iterrows():
        suggestions.append({
            'type': 'state',
            'text': place['State'],
            'location': f"State",
            'rating': float(place['Google review rating']),
            'relevance_score': 25  # Lower priority for state matches
        })
    
    # Remove duplicates and sort by relevance
    seen = set()
    unique_suggestions = []
    for suggestion in suggestions:
        key = f"{suggestion['type']}_{suggestion['text']}"
        if key not in seen:
            seen.add(key)
            unique_suggestions.append(suggestion)
    
    # Sort by relevance score and return top suggestions
    unique_suggestions.sort(key=lambda x: x['relevance_score'], reverse=True)
    return unique_suggestions[:max_suggestions]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/feed')
def feed():
    try:
        # Get page and limit parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        print(f"Feed request: page={page}, limit={limit}")
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Get hybrid recommendations
        print("Getting hybrid recommendations...")
        recommendations = hybrid_recommendations(limit + offset)
        print(f"Got {len(recommendations)} recommendations")
        
        if recommendations.empty:
            print("Warning: No recommendations returned, falling back to collaborative")
            recommendations = collaborative_recommendations(limit + offset)
        
        # Apply pagination
        page_results = recommendations.iloc[offset:offset + limit]
        print(f"Page results: {len(page_results)} places")
        
        # Convert to JSON-serializable format
        places = []
        for _, place in page_results.iterrows():
            try:
                places.append({
                    'name': str(place['Name']),
                    'location': f"{str(place['City'])}, {str(place['State'])}",
                    'rating': float(place['Google review rating']),
                    'reviews': float(place['Number of google review in lakhs']),
                    'best_time': str(place['Best Time to visit']),
                    'image_url': str(place['image_url']) if pd.notna(place['image_url']) else '',
                    'popularity_score': float(place['popularity_score'])
                })
            except Exception as e:
                print(f"Error processing place {place.get('Name', 'Unknown')}: {e}")
                continue
        
        print(f"Successfully processed {len(places)} places")
        
        return jsonify({
            'success': True,
            'places': places,
            'page': page,
            'has_more': len(places) == limit
        })
        
    except Exception as e:
        print(f"Error in feed endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/search')
def search():
    try:
        query = request.args.get('query', '').strip()
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query parameter is required'
            }), 400
        
        # Get search results
        results = search_places(query)
        
        # Convert to JSON-serializable format
        places = []
        for _, place in results.iterrows():
            places.append({
                'name': place['Name'],
                'location': f"{place['City']}, {place['State']}",
                'rating': float(place['Google review rating']),
                'reviews': float(place['Number of google review in lakhs']),
                'best_time': place['Best Time to visit'],
                'image_url': place['image_url'],
                'popularity_score': float(place['popularity_score'])
            })
        
        return jsonify({
            'success': True,
            'places': places,
            'query': query,
            'total_results': len(places)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/autocomplete')
def autocomplete():
    try:
        query = request.args.get('query', '').strip()
        
        if not query or len(query) < 2:
            return jsonify({
                'success': True,
                'suggestions': []
            })
        
        # Get autocomplete suggestions
        suggestions = get_autocomplete_suggestions(query, max_suggestions=8)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'query': query
        })
        
    except Exception as e:
        print(f"Error in autocomplete: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/place/<place_name>')
def get_place_details(place_name):
    try:
        # Find the place - use safer string matching
        place = df[df['Name'].str.lower().str.contains(place_name.lower(), regex=False, na=False)]
        
        if place.empty:
            return jsonify({
                'success': False,
                'error': 'Place not found'
            }), 404
        
        place = place.iloc[0]
        
        # Get similar places
        similar_places = content_based_recommendations(place['Name'], 5)
        
        place_data = {
            'name': str(place['Name']),
            'location': f"{str(place['City'])}, {str(place['State'])}",
            'rating': float(place['Google review rating']),
            'reviews': float(place['Number of google review in lakhs']),
            'best_time': str(place['Best Time to visit']),
            'image_url': str(place['image_url']) if pd.notna(place['image_url']) else '',
            'popularity_score': float(place['popularity_score'])
        }
        
        similar = []
        for _, similar_place in similar_places.iterrows():
            similar.append({
                'name': str(similar_place['Name']),
                'location': f"{str(similar_place['City'])}, {str(similar_place['State'])}",
                'rating': float(similar_place['Google review rating']),
                'image_url': str(similar_place['image_url']) if pd.notna(similar_place['image_url']) else ''
            })
        
        return jsonify({
            'success': True,
            'place': place_data,
            'similar_places': similar
        })
        
    except Exception as e:
        print(f"Error in get_place_details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
