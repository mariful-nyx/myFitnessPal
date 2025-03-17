import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import Octicons from "@expo/vector-icons/Octicons";
import { Entypo, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const StartWorkoutModal = () => {
  const [kg, setKg] = useState();
  const [reps, setReps] = useState();
  const [weight, setWeight] = useState();
  const [sets, setSets] = useState([1]);

  const navigation = useNavigation()

  const handleAddSet = () => {
    setSets((prev) => [...prev, prev.length + 1]); // Add the next number in sequence
  };

  const handleRemoveSet = (set) => {
    const newSets = sets.filter((item)=>(item !== set))
    setSets(newSets)
  }

  console.log(sets.length);
  return (
    <ScrollView>
      <View
        style={{
          marginTop: 60,
          paddingHorizontal: 20,
          backgroundColor: "white",
        }}
      >
        <View
          style={{
            borderBottomWidth: 1,
            borderColor: "#d6d6d6",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: 'center',
            paddingVertical: 16,
            
          }}
        >
          <TouchableOpacity onPress={()=>navigation.goBack()}>
            <Octicons name="chevron-down" size={24} color="black" />
          </TouchableOpacity>

          <View>
            <Text>12:13</Text>
          </View>

          <View>
            <TouchableOpacity onPress={() => null}>
              <Text>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 40 }}>
          <Text style={{ color: "#6c63ff", fontWeight: "bold", fontSize: 16 }}>
            Arnold Press (Dumbbel)
          </Text>
          {sets.map((item, index) => (
            <View style={styles.row} key={index}>
              <View style={styles.column}>
                <Text style={styles.label}>Sets</Text>
                {/* <TextInput
                style={styles.input}
                placeholder="Sets"
                keyboardType="numeric"
                value={sets}
              /> */}
                <Text style={{ paddingVertical: 8 }}>{item}</Text>
              </View>

              <View style={styles.column}>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Reps"
                  keyboardType="numeric"
                  value={reps}
                  onChangeText={setReps}
                />
              </View>

              <View style={styles.column}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Weight"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>

              <View style={styles.column}>
                <Text style={styles.label}></Text>

                <View style={{flexDirection: 'row', gap: 6}}>

                  <TouchableOpacity
                    onPress={() => null}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      width: 38,
                      height: 40,
                      backgroundColor: "#6c63ff",
                      borderRadius: 5,
                    }}
                  >
                    <Feather name="check" size={20} color="white" />
                  </TouchableOpacity>

                  {sets.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveSet(item)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 6,
                        width: 38,
                        height: 40,
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: 'red'
                      }}
                    >
                      <Entypo name="cross" size={24} color="red" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}

          
            <TouchableOpacity onPress={handleAddSet} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Set</Text>
            </TouchableOpacity>

        </View>


        <View style={{marginTop: 10}}>


          <TouchableOpacity onPress={()=>navigation.goBack()} style={[styles.dangerBtn, {marginTop: 20}]}>
            <Text style={{color: 'red'}}>Cancel workout</Text>
          </TouchableOpacity>

        </View>
      </View>
    </ScrollView>
  );
};

export default StartWorkoutModal;

const styles = StyleSheet.create({
  label: { fontSize: 14, color: "#333", marginBottom: 5, fontWeight: "bold" },
  input: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    width: 80,
    borderRadius: 8,
    padding: 10,
    color: "#333",
    marginBottom: 15,
    fontSize: 14,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  column: { flex: 1, marginHorizontal: 5, display: "flex" },
  addButton: {
    backgroundColor: "#6c63ff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  outlineBtn: {borderWidth:1, borderColor: '#6c63ff', paddingVertical: 12, alignItems: 'center', borderRadius: 12},
  dangerBtn: {borderWidth:1, borderColor: 'red', paddingVertical: 12, alignItems: 'center', borderRadius: 12},


});
