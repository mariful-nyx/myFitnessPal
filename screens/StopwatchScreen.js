import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import { getAuth } from 'firebase/auth';
import { get, getDatabase, ref, set } from 'firebase/database';
import { captureRef } from 'react-native-view-shot';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const StopwatchScreen = () => {
  const navigation = useNavigation()
  // State variables
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [path, setPath] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0.01);
  const [weight, setWeight] = useState(70); // Default weight
  const [distance, setDistance] = useState(0); // Track distance in meters
  const [mapSpanshot, setMapSpanshot] = useState(); // Track distance in meters
  
  
  // Refs for subscriptions to ensure proper cleanup
  const locationSubscriptionRef = useRef(null);
  const pedometerSubscriptionRef = useRef(null);
  const intervalRef = useRef(null);
  
  // Auth for saving data
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const date = new Date().toISOString().split('T')[0];

  // First, add a new useRef to track if the user is manually moving the map
  const mapRef = useRef(null);
  const isUserMovingMap = useRef(false);
  const lastLocationUpdate = useRef(Date.now());

  // Time tracking
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Initialize pedometer
  useEffect(() => {
    const initializePedometer = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('Error', 'Pedometer not available on this device');
          return;
        }
        
        if (isRunning && !isPaused) {
          // Start counting steps
          pedometerSubscriptionRef.current = Pedometer.watchStepCount(result => {
            setSteps(result.steps);
            // Calculate calories based on weight and steps
            const caloriesBurned = (result.steps * 0.05 * (weight / 70));
            setCalories(caloriesBurned);
          });
        } else if (pedometerSubscriptionRef.current) {
          pedometerSubscriptionRef.current.remove();
        }
      } catch (error) {
        console.error('Pedometer error:', error);
        Alert.alert('Error', 'Failed to initialize pedometer');
      }
    };

    initializePedometer();
    
    return () => {
      if (pedometerSubscriptionRef.current) {
        pedometerSubscriptionRef.current.remove();
      }
    };
  }, [isRunning, isPaused, weight]);

  // Location tracking
  useEffect(() => {
    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Permission to access location was denied');
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        const { latitude, longitude } = initialLocation.coords;
        setCurrentLocation({ latitude, longitude });
        
        // Only set the initial map region if it hasn't been set yet
        if (!mapRegion) {
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: zoomLevel,
            longitudeDelta: zoomLevel,
          });
        }

        // Start tracking location if running
        if (isRunning && !isPaused) {
          locationSubscriptionRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 1000,
              distanceInterval: 5, // Increased to reduce updates frequency
            },
            (location) => {
              const { latitude, longitude, speed: currentSpeed } = location.coords;
              
              // Update current location
              setCurrentLocation({ latitude, longitude });
              
              // Update speed (convert to km/h)
              setSpeed(currentSpeed != null ? currentSpeed : 0);
              
              // Add to path
              if (isRunning && !isPaused) {
                const newCoord = { latitude, longitude };
                setPath(prevPath => {
                  // Calculate distance if there are previous points
                  if (prevPath.length > 0) {
                    const lastCoord = prevPath[prevPath.length - 1];
                    const segmentDistance = calculateDistance(
                      lastCoord.latitude, lastCoord.longitude,
                      newCoord.latitude, newCoord.longitude
                    );
                    setDistance(prev => prev + segmentDistance);
                  }
                  return [...prevPath, newCoord];
                });
              }
              
              // Only update the map region if:
              // 1. The user is not manually moving the map
              // 2. At least 500ms has passed since the last update to reduce jitter
              const now = Date.now();
              if (!isUserMovingMap.current && !isPaused && now - lastLocationUpdate.current > 500) {
                lastLocationUpdate.current = now;
                // Use the mapRef to animate to region instead of state update
                if (mapRef.current) {
                  mapRef.current.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: zoomLevel,
                    longitudeDelta: zoomLevel,
                  }, 500); // Smooth animation over 500ms
                }
              }
            }
          );
        }
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('Error', 'Failed to get location');
      }
    };

    startTracking();

    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, [isRunning, isPaused, zoomLevel]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };
  
  // Save workout data to Firebase
  const saveWorkoutData = async () => {
    if (!userId) return;
    
    try {
      const db = getDatabase();
      const workoutRef = ref(db, `users/${userId}/workouts/${date}`);

      const prevWorkout = await get(workoutRef)
      

      if(prevWorkout.exists()){
        await set(workoutRef, [...prevWorkout.val(), {
          date,
          duration: time,
          steps,
          calories,
          distance,
          timestamp: new Date().toISOString(),
        
        }]);

      } else {      
        await set(workoutRef, [{
          date,
          duration: time,
          steps,
          calories,
          distance,
          timestamp: new Date().toISOString()
        }])
      }
      
      Alert.alert('Success', 'Workout saved successfully!');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout data');
    }
  };

  // Start/stop workout
  const toggleStopwatch = () => {
    if (isRunning) {
      // If stopping, save the workout data
      saveWorkoutData();
    }
    
    setIsRunning(!isRunning);
    setIsPaused(false);
    
    if (!isRunning) {
      // Reset all values when starting
      setPath([]);
      setTime(0);
      setSteps(0);
      setCalories(0);
      setSpeed(0);
      setDistance(0);
    }
  };

  // Pause/resume workout
  const pauseStopwatch = () => {
    setIsPaused(!isPaused);
  };

  // Re-align map view to current location
  const reAlignMap = () => {
    if (currentLocation && mapRef.current) {
      isUserMovingMap.current = false;
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: zoomLevel,
        longitudeDelta: zoomLevel,
      }, 500);
    }
  };

  // Handler for "View Saved Runs" button
  const handleViewSavedRuns = () => {
    // Replace this alert with navigation to your saved runs screen if needed
    Alert.alert('View Saved Runs', 'This feature is not implemented yet.');
  };

  // Format time as MM:SS
  const formattedTime = `${Math.floor(time / 60)
    .toString()
    .padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;

  // Convert speed from m/s to km/h
  const formattedSpeed = (speed * 3.6).toFixed(1);
  
  // Format distance in km or m
  const formattedDistance = distance >= 1000 
    ? `${(distance / 1000).toFixed(2)} km` 
    : `${Math.round(distance)} m`;

  const startingLocation = path.length > 0 ? path[0] : null;



 

  return (
    <View style={styles.container}>
      {/* Map View */}
      {mapRegion ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onPanDrag={() => {
            isUserMovingMap.current = true;
          }}
          onRegionChangeComplete={(region) => {
            // Only update the state if the user has manually moved the map
            if (isUserMovingMap.current) {
              setMapRegion(region);
            }
          }}
        >
          {/* Drawing the path */}
          {path.length > 0 && (
            <Polyline 
              coordinates={path} 
              strokeColor="#ff5722" 
              strokeWidth={5} 
            />
          )}

          {/* Starting marker */}
          {startingLocation && (
            <Marker
              coordinate={startingLocation}
              title="Start"
              description="Starting point"
              pinColor="green"
            />
          )}

          {/* Current location marker */}
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Current"
              description="Current location"
              pinColor="blue"
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      {/* Stats Display - always visible */}
      <View style={styles.figuresContainer}>
        <View style={styles.figureBox}>
          <Text style={styles.figureLabel}>Time</Text>
          <Text style={styles.figureValue}>{formattedTime}</Text>
        </View>

        <View style={styles.figureBox}>
          <Text style={styles.figureLabel}>Speed</Text>
          <Text style={styles.figureValue}>{formattedSpeed} km/h</Text>
        </View>
        
        <View style={styles.figureBox}>
          <Text style={styles.figureLabel}>Distance</Text>
          <Text style={styles.figureValue}>{formattedDistance}</Text>
        </View>
        
        <View style={styles.figureBox}>
          <Text style={styles.figureLabel}>Steps</Text>
          <Text style={styles.figureValue}>{steps}</Text>
        </View>
        
        <View style={styles.figureBox}>
          <Text style={styles.figureLabel}>Calories</Text>
          <Text style={styles.figureValue}>{calories.toFixed(1)} kcal</Text>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlButton} onPress={reAlignMap}>
          <MaterialIcons name="gps-fixed" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => setZoomLevel((prev) => Math.max(prev * 0.8, 0.002))}
        >
          <Entypo name="plus" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => setZoomLevel((prev) => Math.min(prev * 1.2, 0.05))}
        >
          <Entypo name="minus" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

  

      {/* Main Controls */}
      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleStopwatch}
          >
            <Text style={styles.controlButtonText}>START</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]}
              onPress={pauseStopwatch}
            >
              <Text style={styles.controlButtonText}>
                {isPaused ? 'RESUME' : 'PAUSE'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleStopwatch}
            >
              <Text style={styles.controlButtonText}>STOP</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
          
      {/* Button to View Saved Runs */}
      <View style={styles.viewRunsContainer}>
        <TouchableOpacity
          style={styles.viewRunsButton}
          onPress={()=>navigation.navigate('ViewSavedRun')}
        >
          <Text style={styles.viewRunsText}>View Saved Runs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fd',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fd',
  },
  loadingText: {
    fontSize: 18,
    color: '#6c63ff',
  },
  figuresContainer: {
    position: 'absolute',
    top: 50, 
    left: 10,
    zIndex: 10,
  },
  figureBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    minWidth: 120,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  figureLabel: {
    fontSize: 14,
    color: '#fff',
  },
  figureValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  mapControls: {
    position: 'absolute',
    top: 55,
    right: 10,
    zIndex: 10,
    alignItems: 'center',
  },
  mapControlButton: {
    backgroundColor: '#6c63ff',
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    marginHorizontal: 10,
  },
  pauseButton: {
    backgroundColor: '#ffaa00',
  },
  controlButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  viewRunsContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  viewRunsButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  viewRunsText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default StopwatchScreen;
