import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { get, getDatabase, ref, set } from "firebase/database";


const AddExercise = () => {
  const [exercise, setExercise] = useState();
    
  // Auth for saving data
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const date = new Date().toISOString().split('T')[0];
  
  const {goBack} = useNavigation()


  const saveExerciseData = async () => {
    if (!userId) return;
    
    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `users/${userId}/exercises/`);
      
      try{

          const snapshot = await get(exerciseRef);
          console.log(snapshot)
          const existingExercises = snapshot.exists() ? snapshot.val() : [];

          // Add the new exercise to the existing list
          const updatedExercises = [...existingExercises, exercise];

          // Save the updated list of exercises
          await set(exerciseRef, updatedExercises);

      } catch {
        await set(exerciseRef, [exercise]);
      }
      
      Alert.alert('Success', 'Exercises saved successfully!');
    } catch (error) {
      console.error('Error saving Exercises:', error);
      Alert.alert('Error', 'Failed to save Exercises data');
    }
  };

  const handleExerciseCreate = () => {
    saveExerciseData()
    goBack()
  }


  return (
    <View style={{ backgroundColor: "white", paddingHorizontal: 20 }}>
      <View style={{marginTop: 20}}>
        
        <TextInput
          style={styles.input}
          placeholder="Enter Exercise name"
          keyboardType="ascii-capable"
          value={exercise}
          onChangeText={setExercise}
        />
      </View>


      <TouchableOpacity
        onPress={() => handleExerciseCreate()}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 8,
          marginTop: 10,
          height: 40,
          backgroundColor: "#6c63ff",
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Text style={{color: 'white', fontWeight: 'bold'}}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddExercise;

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    // width: 80,
    borderRadius: 8,
    padding: 10,
    color: "#333",
    marginBottom: 15,
    fontSize: 14,
  },
});
