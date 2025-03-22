import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import moment from "moment/moment";
import { get, getDatabase, ref, set } from "firebase/database";
import { useNavigation } from "@react-navigation/native";

const AddData = ({ route }) => {
  const { name, refresh } = route.params;
  const navigation = useNavigation()
  const [value, setValue] = useState(0);

  // Auth for saving data
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const date = new Date().toISOString().split("T")[0];
  const time = new Date().toISOString();

  // Save workout data to Firebase
  const saveWorkoutData = async () => {
    if (!userId) return;

    try {
      const db = getDatabase();
      const workoutRef = ref(db, `users/${userId}/workouts/${date}`);

      const prevWorkout = await get(workoutRef);

      if (prevWorkout.exists()) {
        await set(workoutRef, [
          ...prevWorkout.val(),
          {
            date,
            duration: 0,
            steps: name === "Steps" && value,
            calories: name === "Calories" && value,
            distance: 0,
            timestamp: time,
          },
        ]);
      } else {
        await set(workoutRef, [
          {
            date,
            duration: 0,
            steps: name === "Steps" && value,
            calories: name === "Calories" && value,
            distance: 0,
            timestamp: time,
          },
        ]);
      }

      refresh();
      navigation.goBack()

      Alert.alert("Success", "Workout saved successfully!");
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout data");
    }
  };

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>{moment(time).format("hh:mm a")}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{name}</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${name}`}
            keyboardType="numeric"
            value={value}
            onChangeText={setValue}
          />
        </View>

        <TouchableOpacity onPress={saveWorkoutData} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddData;

const styles = StyleSheet.create({
  container: {
    marginTop: 80,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    marginTop: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
  },
  value: {
    fontSize: 18,
    backgroundColor: "#e6e6e6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 5,
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    width: 130,
    borderRadius: 8,
    padding: 10,
    color: "#333",
    marginBottom: 15,
    fontSize: 14,
  },
  saveBtn: {backgroundColor: '#6c63ff', paddingVertical: 12, borderRadius: 5, alignItems: 'center', marginTop: 50},
  saveBtnText: {color: 'white', fontSize: 16, fontWeight: 'bold'},
});
