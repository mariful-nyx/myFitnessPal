import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Pedometer } from 'expo-sensors';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { getDatabase, ref, set, onValue, get } from 'firebase/database'; // Import Firebase Realtime Database functions
import { getAuth } from 'firebase/auth';
import { app } from '../firebase/firebaseConfig';
import { BarChart as BarChartRNG } from "react-native-gifted-charts";
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { stepsSample } from './sampleItems';
import moment from 'moment';
import CaloriesChart from '../components/HomeComponent/CaloriesChart';
import StepsChart from '../components/HomeComponent/StepsChart';




const screenWidth = Dimensions.get('window').width;

const HomeScreen = ({ route }) => {
  const { weight, height, age, gender, activityLevel, goal } = route.params || {};


  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [graphType, setGraphType] = useState('Steps');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [customCalories, setCustomCalories] = useState('');
  const [bmr, setBmr] = useState(0);
  const [goalCalories, setGoalCalories] = useState(0);
  
  const [workouts, setWorkouts] = useState(null)



  // Weekly data states
  const [dailyStepsData, setDailyStepsData] = useState({
    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
  });
  const [dailyBurned, setDailyBurned] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [dailyConsumed, setDailyConsumed] = useState([0, 0, 0, 0, 0, 0, 0]);

  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;
  const date = new Date().toISOString().split('T')[0];
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][new Date().getDay() - 1];


  const fetchExerciseData = async () => {
    if (!userId) return;

    try {
      const db = getDatabase();
      const exerciseRef = ref(db, `users/${userId}/workouts/`);

      const data = await get(exerciseRef);

      setWorkouts(data.val());

    } catch (error) {
      console.error("Error saving Exercises:", error);
      Alert.alert("Error", "Failed to save Exercises data");
    }
  };

  // Fetch steps data for the current day and week
  useEffect(() => {
    const fetchStepsData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const db = getDatabase();
        const today = new Date();
        
        // Fetch current day's steps
        const currentStepsRef = ref(db, `users/${userId}/steps/${date}`);
        onValue(currentStepsRef, (snapshot) => {
          if (snapshot.exists()) {
            const stepsData = snapshot.val();
            const steps = typeof stepsData === 'object' ? stepsData.steps : stepsData;
            setCurrentStepCount(steps || 0);
            // Calculate calories burned based on steps
            const calories = ((steps || 0) * 0.05 * (weight / 70)).toFixed(1);
            setCaloriesBurned(parseFloat(calories));
          }
        });

        // Fetch weekly steps data
        const weeklyData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const weeklyBurned = [0, 0, 0, 0, 0, 0, 0];
        
        for (let i = 0; i < 7; i++) {
          const fetchDate = new Date(today);
          fetchDate.setDate(fetchDate.getDate() - i);
          const fetchDateStr = fetchDate.toISOString().split('T')[0];
          const dayIndex = fetchDate.getDay();
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
          
          try {
            const dayStepsRef = ref(db, `users/${userId}/steps/${fetchDateStr}`);
            const snapshot = await get(dayStepsRef);
            if (snapshot.exists()) {
              const stepsData = snapshot.val();
              const steps = typeof stepsData === 'object' ? stepsData.steps : stepsData;
              weeklyData[dayName] = steps || 0;
              weeklyBurned[dayIndex] = ((steps || 0) * 0.05 * (weight / 70));
            }
          } catch (error) {
            console.error('Error fetching steps for', dayName, ':', error);
          }
        }
        
        setDailyStepsData(weeklyData);
        setDailyBurned(weeklyBurned);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching steps data:', error);
        setIsLoading(false); // Set loading to false on error
      }
    };

    fetchStepsData();
  }, [userId, date, weight]);

  // Save current steps to database
  useEffect(() => {
    if (!userId || currentStepCount === 0) return;

    const db = getDatabase();
    const stepsRef = ref(db, `users/${userId}/steps/${date}`);
    set(stepsRef, {
      steps: currentStepCount,
      date: date,
      caloriesBurned: caloriesBurned,
      lastUpdated: new Date().toISOString()
    });
  }, [currentStepCount, userId, date, caloriesBurned]);

  // Fetch total calories consumed from the database
  useEffect(() => {
    const db = getDatabase();
    const totalCaloriesRef = ref(db, `users/${userId}/mealLogs/${date}_${day}/totalCalories`);

    onValue(totalCaloriesRef, (snapshot) => {
      const totalCal = snapshot.val() || 0;
      setCaloriesConsumed(totalCal);
    });
  }, [userId, date, day]);

  // Fetch and save custom calorie goal
  useEffect(() => {
    const db = getDatabase();
    const goalCaloriesRef = ref(db, `users/${userId}/userCalorieGoal`);

    // Fetch goal calories
    onValue(goalCaloriesRef, (snapshot) => {
      const goalCal = snapshot.val() || 0;
      setGoalCalories(goalCal);
    });

    fetchExerciseData()
  }, [userId]);

  // Calculate BMR and goal calories
  useEffect(() => {
    const calculateBMR = () => {
      let bmrValue = 0;
      if (gender === 'Male') {
        bmrValue = 66.47 + 13.75 * weight + 5.003 * height - 6.755 * age;
      } else if (gender === 'Female') {
        bmrValue = 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;
      }

      // Adjust BMR for activity level
      const activityMultiplier = {
        Sedentary: 1.2,
        'Lightly Active': 1.375,
        'Moderately Active': 1.55,
        'Very Active': 1.725,
        'Extra Active': 1.9,
      };

      bmrValue *= activityMultiplier[activityLevel] || 1.2;
      setBmr(Math.round(bmrValue));

      // Adjust BMR for goal
      const adjustment = goal === 'Gain' ? 400 : goal === 'Lose' ? -400 : 0;
      setGoalCalories(Math.round(bmrValue + adjustment));
    };

    calculateBMR();
  }, [weight, height, age, gender, activityLevel, goal]);

  // Initialize pedometer
  useEffect(() => {
    let subscription;

    const startPedometer = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (isAvailable) {
        subscription = Pedometer.watchStepCount((result) => {
          setCurrentStepCount(result.steps);
          // More accurate calorie calculation based on weight
          const calories = (result.steps * 0.05 * (weight / 70)).toFixed(1);
          setCaloriesBurned(calories);
        });
      } else {
        console.log('Pedometer is not available on this device.');
      }
    };

    startPedometer();

    return () => {
      if (subscription) subscription.remove();
    };
  }, [weight]);

  // Update goal calories
  const updateGoalCalories = () => {
    const customValue = parseInt(customCalories, 10);
    if (!isNaN(customValue)) {
      setGoalCalories(customValue);
      setCustomCalories('');

      // Save custom goal calories to the database
      const db = getDatabase();
      const goalCaloriesRef = ref(db, `users/${userId}/goalCalories`);
      set(goalCaloriesRef, customValue);
    }
  };

  // Update graph data
  const graphData = {
    Steps: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: Object.values(dailyStepsData),
        color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
        strokeWidth: 2,
      }],
    },
    'Calories Burned': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: dailyBurned,
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
        strokeWidth: 2,
      }],
    },
    'Calories Consumed': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: dailyConsumed,
        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
        strokeWidth: 2,
      }],
    },
  };

  const chartConfig = {
    backgroundColor: '#f8f9fd',
    backgroundGradientFrom: '#f8f9fd',
    backgroundGradientTo: '#f8f9fd',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(130, 40, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#36A2EB',
    },
  
  };

  // Add this useEffect to fetch the user's name
  useEffect(() => {
    // Fetch user name
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setName(userData.fullName || 'User');
      } else {
        setName('User'); // Default if no name exists
      }
      setIsLoading(false); // Set loading to false after data is fetched
    }, (error) => {
      console.error('Error fetching user data:', error);
      setName('User'); // Default name on error
      setIsLoading(false); // Set loading to false on error
    });

  }, [userId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }


  

  console.log(workouts)


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome Back, {name}!</Text>
        <Text style={styles.headerSubtitle}>Track your steps and stay active.</Text>
      </View>

      {/* Circular Progress Section */}
      <View style={styles.circularProgressContainer}>
        <AnimatedCircularProgress
          size={180}
          width={15}
          fill={(currentStepCount / 10000) * 100} // Using 10000 as default goal
          tintColor="#6c63ff"
          backgroundColor="#e6e6fa"
          lineCap="round"
        >
          {() => (
            <View style={styles.progressContent}>
              <Text style={styles.stepsText}>{currentStepCount}</Text>
              <Text style={styles.stepsLabel}>Steps</Text>
            </View>
          )}
        </AnimatedCircularProgress>
        <Text style={styles.caloriesText}>{caloriesBurned} kcal burned</Text>
      </View>

      {/* Boxes Section */}
      <View style={styles.boxContainer}>
        <View style={[styles.box, styles.goalBox]}>
          <Text style={styles.boxLabel}>Calorie Goal</Text>
          <Text style={styles.boxValue}>{goalCalories} cal</Text>
        </View>
        <View style={[styles.box, styles.burnedBox]}>
          <Text style={styles.boxLabel}>Calories Burned</Text>
          <Text style={styles.boxValue}>{caloriesBurned} cal</Text>
        </View>
        <View style={[styles.box, styles.stepsBox]}>
          <Text style={styles.boxLabel}>Steps Walked</Text>
          <Text style={styles.boxValue}>{currentStepCount}</Text>
          <Text style={styles.boxSubtext}>Goal: 10,000</Text>
        </View>
        <View style={[styles.box, styles.consumedBox]}>
          <Text style={styles.boxLabel}>Calories Consumed</Text>
          <Text style={styles.boxValue}>{caloriesConsumed} cal</Text>
        </View>
      </View>
        

      <View style={styles.graphContainer}>
      
        <StepsChart data={workouts} refresh={fetchExerciseData}/>
      </View>

      
      <View style={styles.graphContainer} >
        <CaloriesChart data={workouts} refresh={fetchExerciseData}/>
      </View>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fd',
    paddingVertical: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  circularProgressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  stepsLabel: {
    fontSize: 16,
    color: '#666666',
  },
  caloriesText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  boxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  box: {
    width: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  boxLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  boxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  goalBox: {
    backgroundColor: '#e1f5fe',
  },
  burnedBox: {
    backgroundColor: '#ffecb3',
  },
  stepsBox: {
    backgroundColor: '#c8e6c9',
  },
  consumedBox: {
    backgroundColor: '#ffe0b2',
  },
  graphContainer: {
    flex: 1,
    left: 0,
    // right: 5,
    width: screenWidth-40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    paddingHorizontal: 8,
    overflow: 'hidden'
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
    // width: screenWidth-40,
    padding: 0,
    margin: 0,
    paddingRight: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  graphButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  graphButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  activeGraphButton: {
    backgroundColor: '#6c63ff',
  },
  graphButtonText: {
    color: '#333',
  },
  activeGraphButtonText: {
    color: '#fff',
  },
  setGoalContainer: {
    width: screenWidth - 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
  },
  setGoalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  setGoalButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  setGoalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  boxSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  noDataContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen;
