import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, set, remove } from 'firebase/database';
import { app } from '../../firebase/firebaseConfig';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { exerciseItems } from '../../screens/sampleItems';

const auth = getAuth(app);
const database = getDatabase(app);

const screenWidth = Dimensions.get('window').width;

const Exercise = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedDayExercises, setSelectedDayExercises] = useState([]);
  const [category, setCategory] = useState(null);
  const [addCategory, setAddCategory] = useState(false);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (selectedDate && userId) {
      const exercisesRef = ref(
        database,
        `users/${userId}/workouts/${selectedDate}`
      );

      const unsubscribe = onValue(exercisesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSelectedDayExercises(Object.values(data)); // Convert object to array
        } else {
          setSelectedDayExercises([]); // Set empty array if no data
        }
      });

      return () => {
        unsubscribe(); // Cleanup listener
      };
    }
  }, [selectedDate, userId]);

  const addWorkout = () => {
    if (
      !exerciseName ||
      !sets ||
      !reps ||
      !weight ||
      !selectedDate ||
      !userId
    ) {
      console.log("All fields are required");
      return; // Prevent adding if any field is empty
    }

    const newExercise = {
      id: Date.now(),
      name: exerciseName,
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight),
    };

    const exerciseRef = ref(
      database,
      `users/${userId}/workouts/${selectedDate}/${newExercise.id}`
    );

    set(exerciseRef, newExercise)
      .then(() => {
        // Reset fields after successful addition
        setExerciseName("");
        setSets("");
        setReps("");
        setWeight("");
        console.log("Workout added successfully");
      })
      .catch((error) => {
        console.error("Error saving workout:", error.message);
        alert("There was an error saving your workout. Please try again.");
      });
  };

  const deleteWorkout = (exerciseId) => {
    const exerciseRef = ref(
      database,
      `users/${userId}/workouts/${selectedDate}/${exerciseId}`
    );

    remove(exerciseRef)
      .then(() => {
        console.log("Workout deleted successfully");
      })
      .catch((error) => {
        console.error("Error deleting workout:", error.message);
        alert("There was an error deleting the workout. Please try again.");
      });
  };

  const toggleCategory = (name) => {
    setCategory(name);
  };

  const toggleAddCategory = () => {
    setAddCategory(!addCategory);
  };

  const data = [
    "dcdcds",
    "dvdscvsd",
    "sdvsdv",
    "sdvcds",
    "dsvds",
    "sdvcsdcvsd",
    "sdcvsdcsd",
    "sdvsdvsd",
  ];

  return (
    <View>
      <View style={styles.exerciseInputContainer}>
        <View>
          <View style={styles.categoryBtn}>
            <Menu style={{ width: "48%" }}>
              <MenuTrigger style={styles.selectCategoryBtn}>
                <Text style={styles.selectCategoryBtnText}>
                  {category ? category.split("_").join(" ") : "Full body"}
                </Text>
              </MenuTrigger>
              <MenuOptions>
                {exerciseItems &&
                  Object?.keys(exerciseItems)?.map((item, index) => (
                    <MenuOption
                      key={index}
                      style={styles.menuOption}
                      onSelect={() => toggleCategory(item)}
                    >
                      <Text style={styles.menuOptionText}>{item}</Text>
                    </MenuOption>
                  ))}
              </MenuOptions>
            </Menu>

            <Menu style={{ width: "48%" }}>
              <MenuTrigger style={styles.addCategoryBtn}>
                <Text style={styles.addCategoryBtnText}>Add Category</Text>
              </MenuTrigger>
              <MenuOptions>
                <MenuOption>
                  <Text>Hello I am modal</Text>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>
          {category ? (
            <ScrollView style={{ height: 500 }}>
              {exerciseItems?.[category]?.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exerciseListItem}
                  onPress={() => setExerciseName(item)}
                >
                  <Text style={styles.exerciseListItemText}>{item}</Text>
                  <Text style={styles.exerciseCategory}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <ScrollView style={{ height: 500 }}>
              {exerciseItems?.biceps?.map((item, index) => (
                <TouchableOpacity
                  style={styles.exerciseListItem}
                  key={index}
                  onPress={() => setExerciseName(item)}
                >
                  <Text style={styles.exerciseListItemText}>{item}</Text>
                  <Text style={styles.exerciseCategory}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <Text style={styles.label}>Exercise Name</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter exercise (e.g., Bench Press)"
          value={exerciseName}
          onChangeText={setExerciseName}
        />
        <TouchableOpacity style={styles.addButton} onPress={addWorkout}>
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Exercises for {selectedDate || "Select a date"}
      </Text>
      <ScrollView>
        {selectedDayExercises.map((item, index) => (
          <View style={styles.workoutItem} key={index}>
            <Text style={styles.workoutText}>
              {item.name}: {item.sets} sets x {item.reps} reps @ {item.weight}{" "}
              kg
            </Text>
            <TouchableOpacity
              onPress={() => deleteWorkout(item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Exercise;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff', overflow: 'scroll' },
    tabs: {flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20},
    tab: {backgroundColor: '#e6e6e6', paddingVertical: 10, width: '48%', display: 'flex', alignItems: 'center', borderRadius: 5, },
    exerciseInputContainer: { paddingHorizontal: 20, backgroundColor: '#f9f9f9', borderRadius: 16, padding: 15 },
    label: { fontSize: 14, color: '#333', marginBottom: 5 },
    input: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, color: '#333', marginBottom: 15, fontSize: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    column: { flex: 1, marginHorizontal: 5 },
    addButton: { backgroundColor: '#6c63ff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
    addButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, color: '#333', fontWeight: 'bold', marginVertical: 10, marginHorizontal: 20 },
    workoutItem: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 15, marginBottom: 10 },
    workoutText: { fontSize: 14, color: '#333' },
    deleteButton: { backgroundColor: '#ff6b6b', borderRadius: 10, paddingVertical: 6, marginTop: 10, alignItems: 'center' },
    deleteButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#666', fontSize: 14, marginTop: 10 },
  
    categoryBtn: {display: 'flex', flexDirection: 'row', justifyContent: 'space-between', },
  
    selectCategoryBtn: {backgroundColor: '#6c63ff', paddingVertical: 5, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' , width: '100%'},
    selectCategoryBtnText: {color: 'white', fontWeight: 'bold'},
    
    menuOption: {paddingHorizontal: 20, paddingVertical: 10},
    menuOptionText: {fontSize: 16, fontWeight: 'bold'},
    
    addCategoryBtn: {backgroundColor: '#e6e6e6', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 5,  display: 'flex', alignItems: 'center', justifyContent: 'center' },
    addCategoryBtnText: {color: 'black', fontWeight: 'bold'},
  
    exerciseList: {marginTop: 12},
    exerciseListItem: {paddingHorizontal: 20, paddingVertical: 10, marginTop: 6},
    exerciseListItemText: {fontWeight: 'bold', fontSize: 18},
    exerciseCategory: {fontSize: 16}
  
  });