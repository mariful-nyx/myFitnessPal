import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { auth } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if the user is already logged in
    const checkUserSession = async () => {
      const storedUser = await AsyncStorage.getItem('userToken');
      if (storedUser) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    };
    checkUserSession();

    // User is signed in
    if (auth.currentUser) {
      // Navigate to Home screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    }

    return () => {
      // Cleanup code if needed
    };
  }, [navigation]);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Alert is not needed as useEffect will handle navigation
      Alert.alert('Success', 'Login successful!', [{ 
        text: 'OK', 
        onPress: () => navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        }) 
      }]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      
      <TouchableOpacity onPress={handleLogin} style={styles.loginBtn}>
        <Text style={styles.loginBtnText}>Login</Text>
      </TouchableOpacity>


      <TouchableOpacity style={styles.forgotPassBtn} onPress={()=>navigation.navigate('ForgotPassword')}>
        <Text style={styles.forgotPassBtnText}>Forgot Password?</Text>
      </TouchableOpacity>

      <Text style={{marginTop: 20}}>If you don't have account ??</Text>

      <TouchableOpacity style={styles.signUpBtn} onPress={()=>navigation.navigate('Signup')}>
        <Text style={styles.signUpBtnText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 15, paddingLeft: 8 },
  loginBtn: {backgroundColor: '#6c63ff', paddingVertical: 12, borderRadius: 5, alignItems: 'center'},
  loginBtnText: {color: 'white', fontSize: 16, fontWeight: 'bold'},
  forgotPassBtn: {marginTop: 30},
  forgotPassBtnText: {fontSize: 16, fontWeight: 'bold', color: '#6c63ff'},

  signUpBtn: {marginTop: 12, borderWidth: 1, borderColor: '#6c63ff', paddingVertical: 12,  borderRadius: 5, alignItems: 'center'},
  signUpBtnText: {color: '#6c63ff'}
});

export default LoginScreen;
