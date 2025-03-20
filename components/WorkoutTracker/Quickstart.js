import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign, Feather } from "@expo/vector-icons";
import { exerciseItems } from "../../screens/sampleItems";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";
import { get, getDatabase, ref } from "firebase/database";
import { getAuth } from "firebase/auth";
import { useLocale, useNavigation, useRoute } from "@react-navigation/native";

const Quickstart = ({day, handleDaySelect}) => {
  const navigation = useNavigation()
  const screenWidth = Dimensions.get("window").width;

  const [exercises, setExercises] = useState()


  // Auth for saving data
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const date = new Date().toISOString().split('T')[0];



  console.log(day)


  const fetchExerciseData = async () => {
    if (!userId) return;
    
    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `users/${userId}/exercises/${day}`);
      
      const data = await get(exerciseRef);

      setExercises(data.val())
      

    } catch (error) {
      console.error('Error saving Exercises:', error);
      Alert.alert('Error', 'Failed to save Exercises data');
    }
  };


  useEffect(()=>{
    fetchExerciseData()
  }, [day])




  return (
    <View style={styles.container}>
      <Text>Quickstart</Text>
      <View style={styles.templateSection}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.heading}>Exercise</Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.navigate('AddTemplate')}>
              <AntDesign name="plus" size={24} color="gray" />
            </TouchableOpacity>

          </View>
        </View>


        <View style={{ marginTop: 20 }}>
          <Text style={{ color: "gray", fontSize: 20, fontWeight: "bold" }}>
            Saved exercises{" "}
          </Text>


            <View style={[styles.daySelector, {marginTop: 12}]}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    item === day && styles.selectedDayButton,
                  ]}
                  onPress={() => handleDaySelect(index)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      item === day && styles.selectedDayButtonText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          <View
            style={{
              marginTop: 12,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {exercises?.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#e6e6e6",
                  padding: 12,
                  width: screenWidth / 2 - 27,
                }}
                onPress={()=>navigation.navigate('StartWorkout', { name: item })}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default Quickstart;

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  templateSection: {
    marginTop: 20,
  },
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "gray",
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
});
