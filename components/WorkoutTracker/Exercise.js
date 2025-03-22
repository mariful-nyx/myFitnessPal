import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';
import { app } from '../../firebase/firebaseConfig';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import { exerciseItems } from '../../screens/sampleItems';
import AntDesign from '@expo/vector-icons/AntDesign';

const Exercise = ({ date }) => {
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [category, setCategory] = useState('chest');

  const auth = getAuth(app);
  const database = getDatabase(app);
  const screenWidth = Dimensions.get('window').width;
  const userId = auth.currentUser?.uid;

  const toggleCategory = (name) => {
    setCategory(name);
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercises((prev) =>
      prev.includes(exercise)
        ? prev.filter((item) => item !== exercise)
        : [...prev, exercise]
    );
  };

  const saveExerciseData = async () => {
    if (!userId || selectedExercises.length === 0) return;

    try {
      const exerciseRef = ref(database, `users/${userId}/exercises/${date}`);
      const snapshot = await get(exerciseRef);
      const existing = snapshot.exists() ? snapshot.val() : [];

      const updated = [...new Set([...existing, ...selectedExercises])];
      await set(exerciseRef, updated);
      setSelectedExercises([]);
      Alert.alert('Success', 'Exercises saved successfully!');
    } catch (error) {
      console.error('Error saving Exercises:', error);
      Alert.alert('Error', 'Failed to save Exercises data');
    }
  };

  return (
    <View>
      <View style={styles.exerciseInputContainer}>
        <View>
          {/* Category Dropdown */}
          <View style={styles.categoryBtn}>
            <Menu style={{ width: '100%' }}>
              <MenuTrigger style={styles.selectCategoryBtn}>
                <Text style={styles.selectCategoryBtnText}>
                  {category ? category.replace(/_/g, ' ') : 'Full body'}
                </Text>
              </MenuTrigger>
              <MenuOptions>
                {Object.keys(exerciseItems).map((item, index) => (
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
          </View>

          {/* Selected Count */}
          {selectedExercises.length > 0 && (
            <View style={{ alignItems: 'flex-end', paddingVertical: 5 }}>
              <Text style={{ color: '#6c63ff', fontWeight: 'bold' }}>
                Add {selectedExercises.length}
              </Text>
            </View>
          )}

          {/* Exercise List */}
          <ScrollView style={{ height: 500 }}>
            {exerciseItems?.[category]?.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.exerciseItem,
                  selectedExercises.includes(item) && styles.selectedItem,
                ]}
                onPress={() => handleSelectExercise(item)}
              >
                <Text
                  style={[
                    styles.exerciseListItemText,
                    selectedExercises.includes(item) && { color: 'white' },
                  ]}
                >
                  {item}
                </Text>
                <Text
                  style={[
                    styles.exerciseCategory,
                    selectedExercises.includes(item) && { color: 'white' },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Save Button */}
          {selectedExercises.length > 0 && (
            <TouchableOpacity
              style={{ alignItems: 'flex-end', marginTop: 20 }}
              onPress={saveExerciseData}
            >
              <AntDesign name="checkcircle" size={40} color="#6c63ff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default Exercise;

const styles = StyleSheet.create({
  exerciseInputContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 15,
  },
  categoryBtn: {
    marginBottom: 10,
  },
  selectCategoryBtn: {
    backgroundColor: '#6c63ff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  selectCategoryBtnText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  menuOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  exerciseItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#6c63ff',
  },
  exerciseListItemText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  exerciseCategory: {
    fontSize: 16,
    color: '#555',
  },
});
