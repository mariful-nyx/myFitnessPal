import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Octicons from "@expo/vector-icons/Octicons";
import { Entypo, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { get, getDatabase, ref, set } from "firebase/database";
import { getAuth } from "firebase/auth";
import { Calendar } from "react-native-calendars";

const StartWorkoutModal = ({route}) => {
  const {name} = route.params
  const [kg, setKg] = useState();
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [sets, setSets] = useState(0);

  const [preExercise, setPreExercise] = useState()
  


  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const date = new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(date)


  const navigation = useNavigation()


  const handleStartExercise = async() => {
    if (!userId ) return;
  
    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `users/${userId}/exercise/${name}/${date}`);
  
      // Fetch the current exercises
      try {
        const snapshot = await get(exerciseRef);
        const existingExercises = snapshot.exists() ? snapshot.val() : [];
    

        const updatedExercises = [...existingExercises, {
          set: sets,
          reps: reps,
          weight: weight
        }]
    

        await set(exerciseRef, updatedExercises)
        setKg(0)
        setWeight(0)
        setReps(0)
        setSets(0)
        await fetchDetail()
      
      } catch {
        await set(exerciseRef, [{ set: sets, reps: reps, weight: weight }])
        setKg(0)
        setWeight(0)
        setReps(0)
        setSets(0)
        await fetchDetail()
      }

    } catch (error) {
      console.error('Error updating Exercise:', error);
    }
  };



  const fetchDetail = async() => {
    if (!userId ) return;
  
    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `users/${userId}/exercise/${name}/${date}`);

      const snap = await get(exerciseRef)

      setPreExercise(snap.val())


    } catch (error) {
      console.error('Error fetch Exercise:', error);
    }
  };


  useEffect(()=>{
    fetchDetail()
  }, [])



  const handleDelete = async () => {
    if (!userId ) return;
  
    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `users/${userId}/exercises/`);
  
      // Fetch the current exercises
      const snapshot = await get(exerciseRef);
      const existingExercises = snapshot.exists() ? snapshot.val() : [];
  
      // Filter out the exercise with the given ID
      const updatedExercises = existingExercises.filter(exercise => exercise !== name);
  
      // Save the updated list of exercises without the deleted one
      await set(exerciseRef, updatedExercises);

      navigation.goBack()
    } catch (error) {
      console.error('Error deleting Exercise:', error);
      Alert.alert('Error', 'Failed to delete Exercise data');
    }
  };



  console.log(sets, reps)




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
            <TouchableOpacity onPress={() => null}>
              <Text>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 40 }}>
          <Text style={{ color: "#6c63ff", fontWeight: "bold", fontSize: 16 }}>
            {name}
          </Text>
    
            <View style={styles.row} >
              <View style={styles.column}>
                <Text style={styles.label}>Sets</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sets"
                  keyboardType="numeric"
                  value={sets}
                  onChangeText={setSets}
                />
               
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
                    onPress={handleStartExercise}
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

     
                </View>
              </View>
            </View>
        </View>



        <ScrollView style={{paddingHorizontal: 20, marginTop:20, height: 400}}>
          {preExercise?.map((item, index)=>(
            <View style={styles.row} key={index}>
              <View style={styles.column}>
                <Text style={styles.label}>Sets</Text>
            
                <Text style={{ paddingVertical: 8 }}>{item.set}</Text>
              </View>

              <View style={styles.column}>
                <Text style={styles.label}>Reps</Text>
            
                <Text style={{ paddingVertical: 8 }}>{item.reps}</Text>
              </View>

              <View style={styles.column}>
                <Text style={styles.label}>Weight</Text>
            
                <Text style={{ paddingVertical: 8 }}>{item.weight}</Text>
              </View>

            </View>
          ))}
        </ScrollView>


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
