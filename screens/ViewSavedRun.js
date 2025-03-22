import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import moment from "moment";
import { getAuth } from "firebase/auth";
import { get, getDatabase, ref } from "firebase/database";
import Modal, { ReactNativeModal } from "react-native-modal";
import { Calendar } from "react-native-calendars";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Entypo } from "@expo/vector-icons";

const data = [
  {
    date: "2025-03-18",
    calories: 0,
    distance: 0,
    duration: 4,
    steps: 0,
    timestamp: "2025-03-18T06:42:12.856Z",
  },
  {
    date: "2025-03-19",
    calories: 150,
    distance: 2.5,
    duration: 30,
    steps: 3000,
    timestamp: "2025-03-19T07:00:12.856Z",
  },
  {
    date: "2025-03-20",
    calories: 200,
    distance: 3.2,
    duration: 45,
    steps: 4000,
    timestamp: "2025-03-20T08:15:22.856Z",
  },
  {
    date: "2025-03-21",
    calories: 180,
    distance: 2.0,
    duration: 25,
    steps: 2800,
    timestamp: "2025-03-21T06:55:12.856Z",
  },
  {
    date: "2025-03-22",
    calories: 220,
    distance: 3.5,
    duration: 50,
    steps: 4500,
    timestamp: "2025-03-22T09:00:32.856Z",
  },
];

const ViewSavedRun = () => {
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split("T")[0]); // Subtract 1 to make Monday = 0, Sunday = 6

  const [workouts, setWorkouts] = useState(null);

  // Auth for saving data
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const date = new Date().toISOString().split("T")[0];
  console.log(date);

  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const fetchExerciseData = async () => {
    if (!userId) return;

    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `users/${userId}/workouts/${selectedDay}`);

      const data = await get(exerciseRef);

      setWorkouts(data.val());

    } catch (error) {
      console.error("Error saving Exercises:", error);
      Alert.alert("Error", "Failed to save Exercises data");
    }
  };

  useEffect(() => {
    fetchExerciseData();
  }, [selectedDay]);




  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={toggleModal} style={{marginBottom: 12, alignItems: 'flex-end'}}>
        <AntDesign name="calendar" size={24} color="black" />
      </TouchableOpacity>

      <ReactNativeModal isVisible={isModalVisible}>
        <View style={{backgroundColor: 'white'}}>

          <TouchableOpacity onPress={toggleModal} style={{backgroundColor: 'white', width: '100%', paddingRight: 20, paddingTop: 10, alignItems: 'flex-end'}}>
            <Entypo name="circle-with-cross" size={24} color="red" />
          </TouchableOpacity>

          <Calendar
            onDayPress={(day) => {
              setSelectedDay(day.dateString)
              toggleModal()
            }}
            markedDates={{
              [selectedDay]: { selected: true, selectedColor: "#6c63ff" },
            }}
            theme={{
              todayTextColor: "#6c63ff",
              arrowColor: "#6c63ff",
              selectedDayBackgroundColor: "#6c63ff",
              selectedDayTextColor: "#ffffff",
            }}
            // style={styles.calendar}
            style={{ marginLeft: 0, paddingLeft: 0}}
          />
          
        </View>
      </ReactNativeModal>

      <View style={styles.grid}>
        {workouts ? workouts?.map((item, index) => (
          <View style={styles.row} key={index}>

              {/* <Image
                source={{uri: item?.img }}
                alt=""
                style={styles.gridImg}
              />: */}
              <Image
                source={require('../assets/map.png')}
                alt=""
                style={styles.gridImg}
              />
            {/* } */}

            <View style={styles.gridContent}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.value}>{item.distance.toFixed(2)}</Text>
                  <Text style={styles.label}>Distance</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.value}>{item.duration.toFixed(2)}</Text>
                  <Text style={styles.label}>Duration</Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingTop: 12,
                }}
              >
                <Text style={styles.label}>Steps: </Text>
                <Text style={styles.value}>{item.steps}</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingTop: 4,
                }}
              >
                <Text style={styles.label}>Calories: </Text>
                <Text style={styles.value}>{item.calories}</Text>
              </View>

              <Text style={{ fontSize: 12, marginTop: 8 }}>
                Time: {moment(item.timestamp).format("HH:MM A DD-MM-YYYY")}
              </Text>
            </View>
          </View>
        )):(
          <View style={{width: '100%', marginTop: 30}}>
            <Text style={{textAlign: 'center', fontSize: 24, fontWeight: 'bold'}}>No workout data available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ViewSavedRun;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "white",
    margin: 0,
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 50,
  },
  row: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 5,
  },
  gridImg: {
    height: 150,
    width: "100%",
  },
  gridContent: {
    padding: 10,
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
  },
});
