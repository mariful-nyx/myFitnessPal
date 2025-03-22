import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { get, getDatabase, ref } from "firebase/database";
import { getAuth } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

const Quickstart = ({ date }) => {
  const navigation = useNavigation();
  const screenWidth = Dimensions.get("window").width;
  const [exercises, setExercises] = useState([]);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const fetchExerciseData = async () => {
    if (!userId) return;
    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `users/${userId}/exercises/${date}`);
      const data = await get(exerciseRef);
      setExercises(data.exists() ? data.val() : []);
    } catch (error) {
      console.error('Error fetching Exercises:', error);
      Alert.alert('Error', 'Failed to load Exercises data');
    }
  };

  useEffect(() => {
    fetchExerciseData();
  }, [date]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Quickstart - {date}</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddTemplate', {
              date,
              fetchExerciseData,
            })
          }
        >
          <AntDesign name="plus" size={24} color="gray" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subheading}>Saved Exercises</Text>
      <View style={styles.exerciseList}>
        {exercises.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exerciseItem}
            onPress={() =>
              navigation.navigate('StartWorkout', {
                name: item,
                date,
                fetchExerciseData,
              })
            }
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Quickstart;

const styles = StyleSheet.create({
  container: { margin: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: { fontSize: 24, fontWeight: 'bold', color: 'gray' },
  subheading: { fontSize: 16, marginTop: 20, marginBottom: 10, color: '#666' },
  exerciseList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exerciseItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    width: Dimensions.get("window").width / 2 - 30,
  },
});
