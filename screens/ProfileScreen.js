import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDatabase, ref, get, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const ProfileScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  // Initialize customAdjustment to "0"
  const [customAdjustment, setCustomAdjustment] = useState('0');
  const [maintenanceCalories, setMaintenanceCalories] = useState(0);
  const [userCalorieGoal, setUserCalorieGoal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const auth = getAuth();
  const db = getDatabase();
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  const calorieAdjustments = [
    { type: 'Intense Bulking', value: '+500 kcal/day', adjustment: 500, side: 'left' },
    { type: 'Medium Bulking', value: '+300 kcal/day', adjustment: 300, side: 'left' },
    { type: 'Low Bulking', value: '+200 kcal/day', adjustment: 200, side: 'left' },
    { type: 'Intense Cutting', value: '-500 kcal/day', adjustment: -500, side: 'right' },
    { type: 'Medium Cutting', value: '-300 kcal/day', adjustment: -300, side: 'right' },
    { type: 'Low Cutting', value: '-200 kcal/day', adjustment: -200, side: 'right' },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        setIsLoading(true);
        try {
          const userRef = ref(db, `users/${userId}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setFullName(userData.fullName || '');
            setWeight(userData.weight ? userData.weight.toString() : '');
            setHeight(userData.height ? userData.height.toString() : '');
            setGender(userData.gender || '');
            setDob(userData.dob ? new Date(userData.dob) : null);
            setActivityLevel(userData.activityLevel || '');
            setSelectedAdjustment(userData.selectedAdjustment || null);
            setMaintenanceCalories(userData.maintenanceCalories || 0);
            setUserCalorieGoal(userData.userCalorieGoal || 0);
            if (userData.customAdjustment !== undefined) {
              setCustomAdjustment(userData.customAdjustment.toString());
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Error', 'Failed to load profile data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [userId]);

  const calculateBMR = () => {
    if (!dob || !weight || !height || !gender || !activityLevel) return 0;

    const age = new Date().getFullYear() - dob.getFullYear();
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(weightNum) || isNaN(heightNum)) return 0;

    let bmr;
    if (gender === 'Male') {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * age + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * age - 161;
    }
    return bmr;
  };

  const calculateMaintenanceCalories = () => {
    const bmr = calculateBMR();
    let activityMultiplier = 1.2;

    if (!bmr || isNaN(bmr)) {
      setMaintenanceCalories(0);
      setUserCalorieGoal(0);
      return;
    }

    switch (activityLevel) {
      case 'Sedentary': activityMultiplier = 1.2; break;
      case 'Lightly Active': activityMultiplier = 1.375; break;
      case 'Moderately Active': activityMultiplier = 1.55; break;
      case 'Very Active': activityMultiplier = 1.725; break;
      case 'Extra Active': activityMultiplier = 1.9; break;
      default: activityMultiplier = 1.2;
    }

    const maintenance = bmr * activityMultiplier;
    setMaintenanceCalories(maintenance);

    const adjustmentValue = customAdjustment !== '' && !isNaN(parseFloat(customAdjustment))
      ? parseFloat(customAdjustment)
      : (selectedAdjustment?.adjustment || 0);
      
    const newCalorieGoal = Math.round(maintenance + adjustmentValue);
    setUserCalorieGoal(newCalorieGoal);

    if (userId) {
      handleSave('maintenanceCalories', maintenance);
      handleSave('userCalorieGoal', newCalorieGoal);
      handleSave('customAdjustment', customAdjustment);
    }
  };

  useEffect(() => {
    calculateMaintenanceCalories();
  }, [weight, height, gender, dob, activityLevel, selectedAdjustment, customAdjustment]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setDob(selectedDate);
      if (userId) {
        set(ref(db, `users/${userId}/dob`), selectedDate.toISOString());
      }
    } else {
      Alert.alert('Invalid Date', 'Please select a valid date.');
    }
  };

  const handleSave = (field, value) => {
    if (userId) {
      set(ref(db, `users/${userId}/${field}`), value);
    }
  };

  const validateInput = (field, value) => {
    switch (field) {
      case 'weight':
      case 'height':
        if (isNaN(value) || parseFloat(value) <= 0) {
          Alert.alert(
            'Invalid Input',
            `${field.charAt(0).toUpperCase() + field.slice(1)} must be a positive number.`
          );
          return false;
        }
        break;
    }
    return true;
  };

  const handleSaveAll = async () => {
    if (!gender || !dob || !weight || !height || !activityLevel) {
      Alert.alert('Incomplete Information', 'Please fill out all fields.');
      return;
    }

    if (!(dob instanceof Date) || isNaN(dob.getTime())) {
      Alert.alert('Invalid Date', 'Please select a valid date.');
      return;
    }

    try {
      if (userId) {
        const userProfile = {
          fullName,
          gender,
          dob: dob.toISOString(),
          weight: parseFloat(weight),
          height: parseFloat(height),
          age: new Date().getFullYear() - dob.getFullYear(),
          activityLevel,
          maintenanceCalories: Math.round(maintenanceCalories),
          userCalorieGoal,
          selectedAdjustment,
          customAdjustment,
          lastUpdated: new Date().toISOString(),
        };

        await set(ref(db, `users/${userId}`), userProfile);
        setIsLoading(false);
        Alert.alert('Success', 'Profile saved successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Home', userProfile);
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Profile & Calorie Calculator</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile data...</Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                handleSave('fullName', text);
              }}
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderOption, gender === 'Male' && styles.selectedOption]}
                onPress={() => {
                  setGender('Male');
                  handleSave('gender', 'Male');
                }}
              >
                <Text style={styles.genderText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderOption, gender === 'Female' && styles.selectedOption]}
                onPress={() => {
                  setGender('Female');
                  handleSave('gender', 'Female');
                }}
              >
                <Text style={styles.genderText}>Female</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => {
                console.log('DOB field pressed');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateText}>
                {dob
                  ? `${dob.getDate()}/${dob.getMonth() + 1}/${dob.getFullYear()}`
                  : 'Select Date of Birth'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dob || new Date(2025, 0, 1)}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date(1925, 0, 1)}
                maximumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your weight"
              keyboardType="numeric"
              value={weight}
              onChangeText={(text) => {
                if (validateInput('weight', text)) {
                  setWeight(text);
                  handleSave('weight', parseFloat(text));
                }
              }}
            />

            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your height"
              keyboardType="numeric"
              value={height}
              onChangeText={(text) => {
                if (validateInput('height', text)) {
                  setHeight(text);
                  handleSave('height', parseFloat(text));
                }
              }}
            />

            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.activityContainer}>
              {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extra Active'].map(
                (level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.activityOption, activityLevel === level && styles.selectedOption]}
                    onPress={() => {
                      setActivityLevel(level);
                      handleSave('activityLevel', level);
                    }}
                  >
                    <Text
                      style={[
                        styles.activityText,
                        activityLevel === level && styles.selectedOptionForText,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}

        <View style={styles.calorieSection}>
          <Text style={styles.label}>Maintenance Calories</Text>
          <Text style={styles.calorieValue}>
            {maintenanceCalories ? Math.round(maintenanceCalories) : 0} kcal/day
          </Text>
        </View>

        <Text style={styles.subheading}>Choose a calorie adjustment based on your goals</Text>
        <View style={styles.buttonContainer}>
          <View style={styles.sideContainer}>
            {calorieAdjustments
              .filter((adj) => adj.side === 'left')
              .map((adj, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.adjustmentButton,
                    selectedAdjustment?.type === adj.type && styles.selectedButton,
                  ]}
                  onPress={() => {
                    setSelectedAdjustment(adj);
                    // Clear custom adjustment if a preset is chosen
                    setCustomAdjustment('');
                    handleSave('selectedAdjustment', adj);
                  }}
                >
                  <Text style={styles.buttonTypeText}>{adj.type}</Text>
                  <Text style={styles.buttonRangeText}>{adj.value}</Text>
                </TouchableOpacity>
              ))}
          </View>

          <View style={styles.sideContainer}>
            {calorieAdjustments
              .filter((adj) => adj.side === 'right')
              .map((adj, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.adjustmentButton,
                    selectedAdjustment?.type === adj.type && styles.selectedButton,
                  ]}
                  onPress={() => {
                    setSelectedAdjustment(adj);
                    setCustomAdjustment('');
                    handleSave('selectedAdjustment', adj);
                  }}
                >
                  <Text style={styles.buttonTypeText}>{adj.type}</Text>
                  <Text style={styles.buttonRangeText}>{adj.value}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Custom Adjustment Input Only */}
        <View style={styles.customAdjustmentContainer}>
          <Text style={styles.label}>
            Enter a custom adjustment (e.g., 250 or -250):
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter custom adjustment"
            keyboardType="numbers-and-punctuation"
            value={customAdjustment}
            onChangeText={(text) => {
              setCustomAdjustment(text);
              // Clear preset selection when using custom adjustment
              if (text !== "") {
                setSelectedAdjustment(null);
                handleSave('selectedAdjustment', null);
              }
            }}
          />
        </View>

        <View style={styles.calorieSection}>
          <Text style={styles.label}>Your Calorie Goal</Text>
          <Text style={styles.calorieValue}>
            {userCalorieGoal ? userCalorieGoal : 0} kcal/day
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAll}>
          <Text style={styles.saveButtonText}>Save and Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fd',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  genderOption: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#e6e6fa',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedOption: {
    backgroundColor: '#6200ee',
  },
  selectedOptionForText: {
    color: 'white',
  },
  genderText: {
    color: '#fff',
    fontSize: 16,
  },
  datePicker: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  activityContainer: {
    marginBottom: 20,
  },
  activityOption: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#e6e6fa',
    marginBottom: 10,
    alignItems: 'center',
  },
  activityText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sideContainer: {
    width: '48%',
  },
  adjustmentButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  selectedButton: {
    borderColor: '#6c63ff',
    borderWidth: 2,
  },
  buttonTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  buttonRangeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  customAdjustmentContainer: {
    marginBottom: 20,
  },
  calorieSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});

export default ProfileScreen;
