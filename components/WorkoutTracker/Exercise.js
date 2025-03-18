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
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, set, remove, get } from 'firebase/database';
import { app } from '../../firebase/firebaseConfig';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { exerciseItems } from '../../screens/sampleItems';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';





const Exercise = () => {
  const navigation = useNavigation()
  const [selectedDate, setSelectedDate] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [category, setCategory] = useState(null);
  const [addCategory, setAddCategory] = useState(false);


  const auth = getAuth(app);
  const database = getDatabase(app);

  const screenWidth = Dimensions.get('window').width;
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

  const handleSelectExercise = (exercise) => {
    setSelectedExercises((prev) => {
      // Check if the exercise is already selected
      if (prev.includes(exercise)) {
        // If selected, remove it
        return prev.filter((item) => item !== exercise);
      } else {
        // If not selected, add it
        return [...prev, exercise];
      }
    });
  };

  const saveExerciseData = async () => {
      if (!userId) return;
      
      try {
        const db = getDatabase();
        const exerciseRef = ref(db, `users/${userId}/exercises/`);
        
        try{
  
            const snapshot = await get(exerciseRef);
  
            const existingExercises = snapshot.exists() ? snapshot.val() : [];
  
            // Add the new exercise to the existing list
            const updatedExercises = [...existingExercises, ...selectedExercises];
  
            // Save the updated list of exercises
            await set(exerciseRef, updatedExercises);
            setSelectedExercises([])
            Alert.alert('Success', 'Exercises saved successfully!');
            
  
        } catch {
          await set(exerciseRef, [...selectedExercises]);
          setSelectedExercises([])
          Alert.alert('Success', 'Exercises saved successfully!');
        }
        
        
      } catch (error) {
        console.error('Error saving Exercises:', error);
        Alert.alert('Error', 'Failed to save Exercises data');
      }
    };
  

  console.log(selectedExercises, "-----------")


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
          <View style={{width: '100%', flexDirection: 'row',  justifyContent: 'flex-end', paddingVertical: 5}}>
            {selectedExercises.length > 0 && 
              <Text style={{color: '#6c63ff', fontWeight: 'bold'}}>Add {selectedExercises.length}</Text>
            }
          </View>
          
          {category ? (
            <ScrollView style={{ height: 500 }}>
              {exerciseItems?.[category]?.map((item, index) => {
                console.log(selectedExercises[item])
                return(
                  <View key={index} style={[{ marginTop: 4, paddingRight:12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'} ,selectedExercises.includes(item) ? {backgroundColor: '#6c63ff', borderRadius: 5} : {}]}>
                    <TouchableOpacity
                      
                      style={[styles.exerciseListItem]}
                      onPress={() => handleSelectExercise(item)}
                    >
                      <View>
                        <Text style={[styles.exerciseListItemText, selectedExercises.includes(item) ? {color: 'white'} : {}]}>{item}</Text>
                        <Text style={[styles.exerciseCategory, selectedExercises.includes(item) ? {color: 'white'} : {}]}>{category}</Text>
                      </View>
                      
                    </TouchableOpacity>
                    <TouchableOpacity style={{}} onPress={()=>navigation.navigate('ExerciseView', {name: item})}>
                      <AntDesign name="question" size={24} color={selectedExercises.includes(item) ? 'white' : 'black'} />
                    </TouchableOpacity>
                  </View>
              )})}
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
        <TouchableOpacity style={{alignItems: 'flex-end'}} onPress={saveExerciseData}>
          <AntDesign name="checkcircle" size={40} color="#6c63ff" />
        </TouchableOpacity>

    
      </View>


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