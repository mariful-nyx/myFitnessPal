import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";


const AddExercise = () => {
  const [exercise, setExercise] = useState();

  const {goBack} = useNavigation()

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
        onPress={() => goBack()}
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
