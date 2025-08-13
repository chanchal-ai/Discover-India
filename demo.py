#!/usr/bin/env python3
"""
Demo script for Discover India Tourism Recommendation System
Tests the core functionality without running the web server
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def load_data():
    """Load and preprocess the data"""
    print("📊 Loading data...")
    try:
        df = pd.read_csv('data/places_clean.csv')
        
        # Clean and prepare data
        df['Google review rating'] = pd.to_numeric(df['Google review rating'], errors='coerce')
        df['Number of google review in lakhs'] = pd.to_numeric(df['Number of google review in lakhs'], errors='coerce')
        
        # Fill missing values
        df['Google review rating'].fillna(df['Google review rating'].mean(), inplace=True)
        df['Number of google review in lakhs'].fillna(df['Number of google review in lakhs'].mean(), inplace=True)
        
        # Create popularity score
        df['popularity_score'] = df['Google review rating'] * np.log1p(df['Number of google review in lakhs'])
        
        # Create combined text for content-based filtering
        df['combined_text'] = df['State'] + ' ' + df['City'] + ' ' + df['Name'] + ' ' + df['Best Time to visit']
        
        print(f"✅ Loaded {len(df)} destinations")
        return df
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return None

def content_based_recommendations(df, place_name, n_recommendations=5):
    """Get content-based recommendations"""
    try:
        # Find the place index
        place_idx = df[df['Name'].str.contains(place_name, case=False, na=False)].index[0]
        
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
    except:
        return df.head(n_recommendations)

def collaborative_recommendations(df, n_recommendations=10):
    """Get collaborative filtering recommendations"""
    return df.nlargest(n_recommendations, 'popularity_score')

def hybrid_recommendations(df, n_recommendations=15):
    """Get hybrid recommendations"""
    # Get collaborative recommendations (60%)
    collab_count = int(n_recommendations * 0.6)
    collab_recs = collaborative_recommendations(df, collab_count)
    
    # Get content-based recommendations from top places (40%)
    content_count = n_recommendations - collab_count
    top_places = df.nlargest(5, 'popularity_score')
    
    # Get content-based recommendations for top places
    content_recs = []
    for _, place in top_places.iterrows():
        similar = content_based_recommendations(df, place['Name'], 2)
        content_recs.append(similar)
    
    if content_recs:
        content_recs = pd.concat(content_recs).drop_duplicates()
        content_recs = content_recs.head(content_count)
    
    # Combine and remove duplicates
    combined = pd.concat([collab_recs, content_recs]).drop_duplicates(subset=['Name'])
    
    # Sort by popularity score
    combined = combined.nlargest(n_recommendations, 'popularity_score')
    
    return combined

def search_places(df, query, n_results=10):
    """Search places by query"""
    query = query.lower()
    
    # Search in name, city, state, and best time
    mask = (
        df['Name'].str.lower().str.contains(query, na=False) |
        df['City'].str.lower().str.contains(query, na=False) |
        df['State'].str.lower().str.contains(query, na=False) |
        df['Best Time to visit'].str.lower().str.contains(query, na=False)
    )
    
    results = df[mask].copy()
    
    # Sort by popularity score
    results = results.sort_values('popularity_score', ascending=False)
    
    return results.head(n_results)

def display_place(place, index=None):
    """Display place information in a formatted way"""
    if index is not None:
        print(f"\n{index}. {place['Name']}")
    else:
        print(f"\n📍 {place['Name']}")
    
    print(f"   🏙️  {place['City']}, {place['State']}")
    print(f"   ⭐ Rating: {place['Google review rating']}/5")
    print(f"   📝 Reviews: {place['Number of google review in lakhs']:.1f}L")
    print(f"   🕐 Best Time: {place['Best Time to visit']}")
    print(f"   🎯 Popularity Score: {place['popularity_score']:.2f}")

def main():
    """Main demo function"""
    print("🎯 Discover India - Tourism Recommendation System Demo")
    print("=" * 70)
    
    # Load data
    df = load_data()
    if df is None:
        return
    
    print(f"\n📊 Dataset Overview:")
    print(f"   Total destinations: {len(df)}")
    print(f"   States covered: {df['State'].nunique()}")
    print(f"   Cities covered: {df['City'].nunique()}")
    print(f"   Average rating: {df['Google review rating'].mean():.2f}")
    
    # Show top popular destinations
    print(f"\n🏆 Top 5 Most Popular Destinations:")
    top_popular = collaborative_recommendations(df, 5)
    for i, (_, place) in enumerate(top_popular.iterrows(), 1):
        display_place(place, i)
    
    # Test content-based recommendations
    print(f"\n🔍 Content-Based Recommendations for 'Taj Mahal':")
    try:
        taj_recs = content_based_recommendations(df, 'Taj Mahal', 3)
        for i, (_, place) in enumerate(taj_recs.iterrows(), 1):
            display_place(place, i)
    except:
        print("   (Taj Mahal not found, showing random recommendations)")
        random_recs = df.sample(3)
        for i, (_, place) in enumerate(random_recs.iterrows(), 1):
            display_place(place, i)
    
    # Test hybrid recommendations
    print(f"\n🎯 Hybrid Recommendations (Top 5):")
    hybrid_recs = hybrid_recommendations(df, 5)
    for i, (_, place) in enumerate(hybrid_recs.iterrows(), 1):
        display_place(place, i)
    
    # Test search functionality
    print(f"\n🔍 Search Results for 'Delhi':")
    delhi_results = search_places(df, 'Delhi', 3)
    for i, (_, place) in enumerate(delhi_results.iterrows(), 1):
        display_place(place, i)
    
    print(f"\n🔍 Search Results for 'Beach':")
    beach_results = search_places(df, 'Beach', 3)
    for i, (_, place) in enumerate(beach_results.iterrows(), 1):
        display_place(place, i)
    
    print(f"\n✅ Demo completed successfully!")
    print(f"🚀 Run 'python app.py' to start the web application")

if __name__ == "__main__":
    main()
