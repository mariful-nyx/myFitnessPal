import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { auth } from '../firebase/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = useCallback((email) => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmedEmail);
  }, []);

  const handleResetPassword = async () => {
    if (isLoading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      Alert.alert(
        'Email Sent',
        'If an account exists with this email, you will receive password reset instructions shortly. Please also check your spam folder.',
        [
          {
            text: 'OK',
            onPress: () => {
              setEmail('');
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'An error occurred while sending the reset email.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'If an account exists with this email, you will receive password reset instructions shortly.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/missing-android-pkg-name':
        case 'auth/missing-ios-bundle-id':
        case 'auth/missing-continue-uri':
        case 'auth/invalid-continue-uri':
        case 'auth/unauthorized-continue-uri':
          errorMessage = 'Configuration error. Please contact support.';
          break;
        default:
          errorMessage = 'An error occurred. Please try again later.';
      }
      
      Alert.alert('Notice', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = useCallback(() => {
    if (!isLoading) {
      navigation.navigate('Login');
    }
  }, [isLoading, navigation]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View 
        style={styles.contentContainer}
        onStartShouldSetResponder={() => {
          Keyboard.dismiss();
          return true;
        }}
      >
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          returnKeyType="send"
          onSubmitEditing={handleResetPassword}
          accessibilityLabel="Email input field"
          accessibilityHint="Enter your email address to reset password"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <TouchableOpacity
          style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
          onPress={handleResetPassword}
          disabled={isLoading}
          accessibilityLabel="Reset password button"
          accessibilityHint="Tap to send password reset email"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
          disabled={isLoading}
          accessibilityLabel="Back to login button"
          accessibilityHint="Tap to go back to login screen"
        >
          <Text style={[styles.backButtonText, isLoading && styles.backButtonTextDisabled]}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  resetButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  resetButtonDisabled: {
    backgroundColor: '#007AFF80',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  backButtonTextDisabled: {
    color: '#007AFF80',
  },
});

export default ForgotPasswordScreen;
