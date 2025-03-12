import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase/firebaseConfig';

const auth = getAuth(app);
const db = getDatabase();

export default function SavedMealsScreen({ navigation }) {
  const [mealLogs, setMealLogs] = useState([]); // Stores all meals from the database
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering meals
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Reference to the user's meal logs in Firebase
    const mealsRef = ref(db, `users/${userId}/mealLogs`);

    // Fetch all meals from the database
    onValue(mealsRef, (snapshot) => {
      const allMeals = []; // Array to store all meals

      snapshot.forEach((dateSnapshot) => {
        // Loop through each date (e.g., "2023-10-01_Mon")
        dateSnapshot.forEach((categorySnapshot) => {
          // Loop through each category (e.g., "Breakfast", "Lunch", etc.)
          if (categorySnapshot.key === 'meals') {
            // Check if the node is "meals"
            categorySnapshot.forEach((mealSnapshot) => {
              // Loop through each meal in the category
              const meal = mealSnapshot.val(); // Get the meal data
              allMeals.push({
                id: mealSnapshot.key, // Unique ID for the meal (Firebase-generated key)
                ...meal, // Spread the meal data (mealName, calories, protein, etc.)
              });
            });
          } else {
            // Handle nested categories (e.g., "Breakfast", "Lunch", etc.)
            categorySnapshot.forEach((mealCategorySnapshot) => {
              if (mealCategorySnapshot.key === 'meals') {
                mealCategorySnapshot.forEach((mealSnapshot) => {
                  const meal = mealSnapshot.val(); // Get the meal data
                  allMeals.push({
                    id: mealSnapshot.key, // Unique ID for the meal
                    ...meal, // Spread the meal data
                  });
                });
              }
            });
          }
        });
      });

      // Remove duplicates and sort meals alphabetically by mealName
      const uniqueMeals = Array.from(new Set(allMeals.map((meal) => JSON.stringify(meal))))
        .map((meal) => JSON.parse(meal))
        .sort((a, b) => a.mealName.localeCompare(b.mealName));

      setMealLogs(uniqueMeals); // Update state with the unique meals
    });
  }, [userId]);

  // Filter meals based on the search query
  const filteredMeals = mealLogs.filter((meal) =>
    meal.mealName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Saved Meals</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search Meals..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredMeals}
        keyExtractor={(item) => item.id} // Use the meal's unique ID as the key
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.mealItem}>
            <Text style={styles.mealText}>
              {item.mealName} - {item.calories} cal
            </Text>
            <Text style={styles.mealDetails}>
              Protein: {item.protein}g | Weight: {item.weight}g
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.noMealsText}>No meals found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  heading: {
    color: '#ffffff',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: '#333',
    fontSize: 16,
  },
  mealItem: {
    padding: 15,
    backgroundColor: '#162447',
    borderRadius: 8,
    marginBottom: 10,
  },
  mealText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealDetails: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 5,
  },
  noMealsText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});