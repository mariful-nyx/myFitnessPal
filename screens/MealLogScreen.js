import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { getDatabase, ref, onValue, push, set, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase/firebaseConfig';
import axios from 'axios';
import { EDAMAM_APP_ID, EDAMAM_API_KEY } from '@env';
import { Calendar } from 'react-native-calendars';

const auth = getAuth(app);
const screenWidth = Dimensions.get('window').width;

export default function MealLogScreen({ navigation, route }) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() - 1); // Subtract 1 to make Monday = 0, Sunday = 6
  const [meals, setMeals] = useState({ Breakfast: [], Lunch: [], Dinner: [], Snacks: [] }); // Meals for each category
  const [mealName, setMealName] = useState(''); // Name of the meal
  const [calories, setCalories] = useState(''); // Calories per base quantity
  const [weight, setWeight] = useState(''); // Weight per base quantity
  const [quantity, setQuantity] = useState(1); // Quantity multiplier
  const [protein, setProtein] = useState(''); // Protein in grams
  const [serving, setServing] = useState(''); // Number of servings
  const [servingSize, setServingSize] = useState(''); // Serving size in grams
  const [totalCalories, setTotalCalories] = useState({ Breakfast: 0, Lunch: 0, Dinner: 0, Snacks: 0 }); // Total calories for each category
  const [totalProtein, setTotalProtein] = useState({ Breakfast: 0, Lunch: 0, Dinner: 0, Snacks: 0 }); // Total protein for each category
  const [editingMeal, setEditingMeal] = useState(null); // Meal being edited
  const [searchQuery, setSearchQuery] = useState(''); // Search query for Edamam API
  const [searchResults, setSearchResults] = useState([]); // Results from Edamam API
  const [isSearching, setIsSearching] = useState(false); // Loading state for search
  const [expandedSection, setExpandedSection] = useState(null); // Expanded section (Breakfast, Lunch, Dinner, Snacks)

  const userId = auth.currentUser?.uid; // Replace with the actual user ID (e.g., from Firebase Auth)
  const date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][selectedDay]; // Selected day

  // Calculate total calories and protein for the day
  const totalCaloriesForDay = Object.values(totalCalories).reduce((sum, cal) => sum + cal, 0);
  const totalProteinForDay = Object.values(totalProtein).reduce((sum, prot) => sum + prot, 0);

  // Fetch meals and totalCalories from Realtime Database on component mount
  useEffect(() => {
    const db = getDatabase(app);
    const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    categories.forEach((category) => {
      const mealsRef = ref(db, `users/${userId}/mealLogs/${date}_${day}/${category}/meals`);
      onValue(mealsRef, (snapshot) => {
        const fetchedMeals = [];
        snapshot.forEach((childSnapshot) => {
          const meal = childSnapshot.val();
          fetchedMeals.push({ id: childSnapshot.key, ...meal });
        });
        setMeals((prevMeals) => ({ ...prevMeals, [category]: fetchedMeals }));

        // Calculate total calories and protein for the category
        const totalCal = fetchedMeals.reduce((sum, meal) => sum + meal.calories, 0);
        const totalProt = fetchedMeals.reduce((sum, meal) => sum + meal.protein, 0);
        setTotalCalories((prev) => ({ ...prev, [category]: totalCal }));
        setTotalProtein((prev) => ({ ...prev, [category]: totalProt }));

        // Save total calories and protein to Firebase
        const totalCaloriesRef = ref(db, `users/${userId}/mealLogs/${date}_${day}/${category}/totalCalories`);
        const totalProteinRef = ref(db, `users/${userId}/mealLogs/${date}_${day}/${category}/totalProtein`);
        set(totalCaloriesRef, totalCal);
        set(totalProteinRef, totalProt);
      });
    });

    // Save total calories and protein for the day to Firebase
    const totalDayRef = ref(db, `users/${userId}/mealLogs/${date}_${day}`);
    update(totalDayRef, {
      totalCalories: totalCaloriesForDay,
      totalProtein: totalProteinForDay,
    });
  }, [selectedDay, userId, date, day, totalCaloriesForDay, totalProteinForDay]);

  // Search for food items using Edamam API
  const searchFood = async () => {
    if (!searchQuery) return;

    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://api.edamam.com/api/food-database/v2/parser`,
        {
          params: {
            app_id: EDAMAM_APP_ID,
            app_key: EDAMAM_API_KEY,
            ingr: searchQuery,
          },
        }
      );
      setSearchResults(response.data.hints);
    } catch (error) {
      console.error('Error fetching food data:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Log a selected food item
  const logFoodItem = (food, category) => {
    const newMeal = {
      mealName: food.food.label,
      calories: Math.round(food.food.nutrients.ENERC_KCAL), // Energy in kcal
      weight: 100, // Default weight (100g)
      protein: Math.round(food.food.nutrients.PROCNT), // Protein in grams
      serving: 1, // Default serving
      servingSize: 100, // Default serving size (100g)
    };

    // Save meal to Realtime Database
    saveMealToDatabase(newMeal, category);

    // Clear search results and query
    setSearchResults([]);
    setSearchQuery('');
  };

  // Save meal to Realtime Database under the specified category
  const saveMealToDatabase = async (meal, category) => {
    const db = getDatabase();
    const mealsRef = ref(db, `users/${userId}/mealLogs/${date}_${day}/${category}/meals`);
    const newMealRef = push(mealsRef);
    await set(newMealRef, meal);
  };

  // Update meal in Realtime Database
  const updateMealInDatabase = async (mealId, updatedMeal, category) => {
    const db = getDatabase();
    const mealRef = ref(db, `users/${userId}/mealLogs/${date}_${day}/${category}/meals/${mealId}`);
    await update(mealRef, updatedMeal);
  };

  // Delete meal from Realtime Database
  const deleteMeal = async (mealId, category) => {
    const db = getDatabase();
    const mealRef = ref(db, `users/${userId}/mealLogs/${date}_${day}/${category}/meals/${mealId}`);
    await remove(mealRef);
  };

  // Add or update a meal
  const addOrUpdateMeal = async (category) => {
    if (!mealName || !calories || !weight || !quantity) return;

    const calculatedCalories = Number(calories) * Number(quantity);
    const calculatedProtein = Number(protein) * Number(quantity);
    const newMeal = {
      mealName,
      calories: calculatedCalories,
      weight: Number(weight) * Number(quantity),
      protein: calculatedProtein,
      serving: Number(serving),
      servingSize: Number(servingSize),
    };

    if (editingMeal) {
      // Update existing meal
      await updateMealInDatabase(editingMeal.id, newMeal, category);
      setEditingMeal(null); // Clear editing state
    } else {
      // Save new meal
      await saveMealToDatabase(newMeal, category);
    }

    // Clear input fields
    setMealName('');
    setCalories('');
    setWeight('');
    setQuantity(1);
    setProtein('');
    setServing('');
    setServingSize('');

    // Collapse the section
    setExpandedSection(null);
  };

  // Edit a meal
  const editMeal = (meal, category) => {
    setEditingMeal(meal);
    setMealName(meal.mealName);
    setCalories(String(meal.calories));
    setWeight(String(meal.weight));
    setQuantity(1);
    setProtein(String(meal.protein));
    setServing(String(meal.serving));
    setServingSize(String(meal.servingSize));
    setExpandedSection(category); // Expand the section
  };

  // Render the collapsible section for each category
  const renderCategorySection = (category) => {
    const isExpanded = expandedSection === category;

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>{category}</Text>
        
          <TouchableOpacity
            style={styles.categoryHeaderBtn}
            onPress={() => setExpandedSection(isExpanded ? null : category)}
          >
            <Text style={styles.categoryHeaderBtnText}>ADD FOOD</Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.inputContainer}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for food..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity style={styles.searchButton} onPress={searchFood}>
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => `${item.food.foodId}_${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => logFoodItem(item, category)}
                  >
                    <Text style={styles.searchResultText}>
                      {item.food.label} - {Math.round(item.food.nutrients.ENERC_KCAL)} kcal, {Math.round(item.food.nutrients.PROCNT)}g protein
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResultsText}>No results found.</Text>
                }
              />
            )}

            {/* Input Fields */}
            <TextInput
              style={styles.input}
              placeholder="Meal Name"
              value={mealName}
              onChangeText={setMealName}
            />
            <TextInput
              style={styles.input}
              placeholder="Calories"
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
            />
            <TextInput
              style={styles.input}
              placeholder="Weight (g)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={String(quantity)}
              onChangeText={(value) => setQuantity(Number(value))}
            />
            <TextInput
              style={styles.input}
              placeholder="Protein (g)"
              keyboardType="numeric"
              value={protein}
              onChangeText={setProtein}
            />
            <TextInput
              style={styles.input}
              placeholder="Serving"
              keyboardType="numeric"
              value={serving}
              onChangeText={setServing}
            />
            <TextInput
              style={styles.input}
              placeholder="Serving Size (g)"
              keyboardType="numeric"
              value={servingSize}
              onChangeText={setServingSize}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addOrUpdateMeal(category)}
            >
              <Text style={styles.addButtonText}>
                {editingMeal ? 'UPDATE' : 'ADD'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Meal List */}
        <View style={styles.mealListContainer}>
          {meals[category].map((item) => (
            <View key={item.id} style={styles.mealItem}>
              <Text style={styles.mealText}>
                {item.mealName} - {item.calories} cal, {item.weight} g
              </Text>
              <Text style={styles.mealText}>
                Protein: {item.protein} g, Serving: {item.serving}, Serving Size: {item.servingSize} g
              </Text>
              <View style={styles.mealActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editMeal(item, category)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteMeal(item.id, category)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Total Calories and Protein for the Category */}
        <View style={styles.categoryTotalContainer}>
          <View style={styles.categoryTotalSection}>
            <Text style={styles.categoryTotalKey}>
              Total Calories: 
            </Text>
            <Text style={styles.categoryTotalText}>
              {totalCalories[category]} cal
            </Text>
          </View>
          <View style={styles.categoryTotalSection}>
            <Text style={styles.categoryTotalKey}>
              Total Protein:
            </Text>
            <Text style={styles.categoryTotalText}>
              {totalProtein[category]} g
            </Text>
             
          </View>
        </View>
      </View>
    );
  };

  // Render the entire screen content using FlatList
  return (
    <FlatList
      data={[]} // Empty data array
      ListHeaderComponent={
        <>
          {/* Day Selector */}

            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => setSelectedDay(day.dateString)}
                markedDates={{
                  [selectedDay]: { selected: true, selectedColor: '#6c63ff' },
                }}
                theme={{
                  todayTextColor: '#6c63ff',
                  arrowColor: '#6c63ff',
                  selectedDayBackgroundColor: '#6c63ff',
                  selectedDayTextColor: '#ffffff',
                }}
                // style={styles.calendar}
                style={{marginLeft: 0, paddingLeft: 0, marginLeft: -20}}
              />
            </View>


          {/* Collapsible Sections */}
          {renderCategorySection('Breakfast')}
          {renderCategorySection('Lunch')}
          {renderCategorySection('Dinner')}
          {renderCategorySection('Snacks')}
        </>
      }
      ListFooterComponent={
        <>
          {/* Total Calories and Protein for the Day */}
          <View style={styles.dayTotalContainer}>
            <Text style={styles.dayTotalText}>
              Total Calories for the Day: {totalCaloriesForDay} cal
            </Text>
            <Text style={styles.dayTotalText}>
              Total Protein for the Day: {totalProteinForDay} g
            </Text>
          </View>

          {/* View Saved Meals Button */}
          <TouchableOpacity
            style={styles.savedMealsButton}
            onPress={() => navigation.navigate('SavedMeals')}
          >
            <Text style={styles.savedMealsButtonText}>Saved Meals</Text>
          </TouchableOpacity>
        </>
      }
      keyExtractor={(item, index) => `key-${index}`}
      contentContainerStyle={styles.container}
    />
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  selectedDayButton: {
    backgroundColor: '#6c63ff',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDayButtonText: {
    color: '#ffffff',
  },
  categorySection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
  },
  categoryHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    
  },
  categoryHeaderBtn: {
    borderWidth: 1,
    borderColor:'#6c63ff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },

  categoryHeaderBtnText: {
    color: '#6c63ff'
  },  
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    color: '#333',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResultItem: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  searchResultText: {
    fontSize: 16,
    color: '#333',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  inputContainer: {
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: '#333',
    fontSize: 16,
  },
  mealListContainer: {
    marginTop: 10,
  },
  mealItem: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  mealText: {
    fontSize: 16,
    color: '#333',
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    padding: 5,
    marginRight: 10,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 5,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noMealsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  categoryTotalSection: {
    display: 'flex', 
    flexDirection: 'row', 
    gap: 4
  },
  categoryTotalKey:{
    fontSize: 16,
    fontWeight: 'bold',
    color: '#aaaaaa',
  },
  categoryTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarContainer: { width: screenWidth-30, marginHorizontal: 10, paddingHorizontal: 0, borderRadius: 16 },

  dayTotalContainer: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  dayTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  savedMealsButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  savedMealsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});