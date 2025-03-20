import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth, database } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password || !gender || !dob || !weight || !height) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      await set(ref(database, 'users/' + userId), {
        name,
        email,
        gender,
        dob,
        weight,
        height,
      });
      await AsyncStorage.setItem('userToken', userId); // Store session
      Alert.alert(
        'Success', 
        'Account created!', 
        [{ 
          text: 'OK', 
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          }) 
        }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      
      <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} style={styles.picker}>
        <Picker.Item label="Select Gender" value="" />
        <Picker.Item label="Male" value="Male" />
        <Picker.Item label="Female" value="Female" />
        <Picker.Item label="Other" value="Other" />
      </Picker>
      
      <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} />
      <TextInput style={styles.input} placeholder="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
      
      <TouchableOpacity onPress={handleSignup} style={styles.signupBtn}>
        <Text style={styles.signupBtnText}>Sign Up</Text>
      </TouchableOpacity>


      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.ahcBtn}>
        <Text style={styles.ahcBtnText}>Already have an account? </Text>
        <Text style={styles.loginBtn}>Login</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingLeft: 8 },
  picker: { height: 50, marginBottom: 15, borderColor: '#ccc', borderWidth: 1 },
  signupBtn: {backgroundColor: '#6c63ff', paddingVertical: 12, borderRadius: 5, alignItems: 'center'},
  signupBtnText: {color: 'white', fontSize: 16, fontWeight: 'bold'},
  ahcBtn: {marginTop: 12},
  ahcBtnText: {fontSize: 16},
  loginBtn: {color: '#6c63ff', fontSize: 16, fontWeight: 'bold'}
});

export default SignupScreen;
