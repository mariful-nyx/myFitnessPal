import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';
import { app } from '../firebase/firebaseConfig';
import { TouchableOpacity, Text } from 'react-native';

// Initialize auth
const auth = getAuth(app);

// Import screens
import HomeScreen from '../screens/HomeScreen';
import MealLogScreen from '../screens/MealLogScreen';
import WorkoutTracker from '../screens/WorkoutTracker';
import StopwatchScreen from '../screens/StopwatchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SavedMealsScreen from '../screens/SavedMealsScreen';
import ExerciseViewScreen from '../screens/ExerciseViewScreen';
import StartWorkoutModal from '../screens/StartWorkoutModal';
import AddExercise from '../screens/AddExercise';
import ViewSavedRun from '../screens/ViewSavedRun';
import TemplateView from '../screens/TemplateView';
import AddData from '../components/HomeComponent/AddData';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Home Stack Navigator
function HomeStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Meal Log Stack Navigator (includes Saved Meals)
function MealLogScreenStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MealLogScreen" component={MealLogScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SavedMeals"
        component={SavedMealsScreen}
        options={{
          title: 'Saved Meals',
          headerStyle: { backgroundColor: '#162447' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
}

// Bottom Tab Navigator
function BottomTabs() {
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Meal Log') iconName = 'fast-food';
          else if (route.name === 'Workout') iconName = 'barbell';
          else if (route.name === 'Stopwatch') iconName = 'timer';
          else if (route.name === 'Profile') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00bcd4',
        tabBarInactiveTintColor: '#6c63ff',
        tabBarStyle: { backgroundColor: '#F5F5F5', borderTopWidth: 0 },
        headerStyle: { backgroundColor: '#F5F5F5' },
        headerTitleStyle: { fontSize: 20, fontWeight: 'bold', color: '#6c63ff' },
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackScreen} 
        options={{
          title: 'Home',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 15, padding: 8 }}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen name="Meal Log" component={MealLogScreenStack} />
      <Tab.Screen name="Workout" component={WorkoutTracker} />
      <Tab.Screen name="Stopwatch" component={StopwatchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main Navigation Logic
export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null; // Prevents premature navigation errors

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="MainApp" component={BottomTabs} options={{ headerShown: false }} />
            <Stack.Group screenOptions={{presentation: 'card'}}>
              <Stack.Screen name='AddTemplate' component={AddExercise} options={{title: 'Add Exercise'}}/>
              <Stack.Screen name='ExerciseView' component={ExerciseViewScreen} options={({route})=>({title: route.params?.name})} />
              <Stack.Screen name='TemplateView' component={TemplateView} options={({route})=>({title: route.params?.name})} />
            </Stack.Group>
            <Stack.Group screenOptions={{presentation: 'modal'}}>

              <Stack.Screen 
                name='StartWorkout' 
                component={StartWorkoutModal} 
                options={{headerShown: false}} 
              />
              <Stack.Screen 
                name='AddData' 
                component={AddData} 
                options={{headerShown: false}} 
              />
            </Stack.Group>
            <Stack.Screen name='ViewSavedRun' component={ViewSavedRun} options={{title: 'Saved Run'}}/>
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
            
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
