import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Modal, Image, ImageBackground 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Calendar, X } from 'lucide-react-native';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Date Picker State
  const [birthdate, setBirthdate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasSelectedDate, setHasSelectedDate] = useState(false);

  // Forgot Password State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthdate(selectedDate);
      setHasSelectedDate(true);
    }
  };

  // Password strength check
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '#E7E5E4' };
    if (pass.length < 6) return { label: 'Weak', color: '#EF4444' };
    if (pass.length < 10) return { label: 'Medium', color: '#F59E0B' };
    return { label: 'Strong', color: '#10B981' };
  };

  const passStrength = getPasswordStrength(password);

  // Helper function to translate Firebase Error Codes into friendly messages
  const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/weak-password':
        return 'Your password should be at least 6 characters long.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in both email and password.');
      return;
    }

    try {
      if (isSignUp) {
        if (!firstName.trim() || !lastName.trim() || !hasSelectedDate) {
          Alert.alert('Missing Info', 'Please enter your first name, last name, and select your birthdate.');
          return;
        }

        if (password !== confirmPassword) {
          Alert.alert('Password Error', 'Passwords do not match. Please check and try again.');
          return;
        }

        const formattedBirthdate = formatDate(birthdate);
        const displayName = `${firstName.trim()} ${lastName.trim()}`;
        
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // Update Auth Profile
        await updateProfile(user, { displayName });

        // Save profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          displayName,
          birthdate: formattedBirthdate,
          role: 'user',
          createdAt: new Date().toISOString()
        });

        Alert.alert('Success', 'Account created successfully!');

      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        Alert.alert('Success', 'Logged in successfully!');
      }
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error.code);
      Alert.alert(isSignUp ? 'Registration Error' : 'Sign In Error', friendlyMessage);
    }
  };

  // Free Firebase Password Reset Handler
  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      Alert.alert(
        'Email Sent!', 
        'We have sent a password reset link to your email address. Please check your inbox.'
      );
      setResetEmail('');
      setIsForgotOpen(false);
    } catch (error) {
      const errorMsg = getFriendlyErrorMessage(error.code);
      Alert.alert('Reset Failed', errorMsg);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/splash-icon.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>

          <Text style={styles.brandTitle}>CookMate</Text>
          <Text style={styles.subtitle}>{isSignUp ? 'Create your chef account' : 'Sign in to continue'}</Text>

          {isSignUp && (
            <>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={firstName} 
                    onChangeText={setFirstName} 
                    placeholder="John" 
                    placeholderTextColor="#A8A29E" 
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={lastName} 
                    onChangeText={setLastName} 
                    placeholder="Doe" 
                    placeholderTextColor="#A8A29E" 
                  />
                </View>
              </View>

              <Text style={styles.label}>Birthdate</Text>
              <TouchableOpacity 
                style={styles.datePickerInput} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateText, !hasSelectedDate && styles.placeholderText]}>
                  {hasSelectedDate ? formatDate(birthdate) : 'Select birthdate'}
                </Text>
                <Calendar size={16} color="#78716C" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={birthdate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
            autoCapitalize="none" 
            placeholder="chef@cookmate.com" 
            placeholderTextColor="#A8A29E" 
          />

          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="••••••••" 
            placeholderTextColor="#A8A29E" 
          />

          {isSignUp && (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput 
                style={styles.input} 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry 
                placeholder="••••••••" 
                placeholderTextColor="#A8A29E" 
              />
            </>
          )}

          {isSignUp && password.length > 0 && (
            <View style={styles.strengthRow}>
              <Text style={styles.strengthText}>Password Strength: </Text>
              <Text style={{ fontWeight: '700', color: passStrength.color }}>{passStrength.label}</Text>
            </View>
          )}

          {!isSignUp && (
            <TouchableOpacity 
              style={styles.forgotBtn} 
              onPress={() => {
                setResetEmail(email);
                setIsForgotOpen(true);
              }}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth}>
            <Text style={styles.primaryBtnText}>{isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setIsSignUp(!isSignUp);
              setConfirmPassword('');
            }} 
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password Modal */}
        <Modal visible={isForgotOpen} animationType="fade" transparent={true} onRequestClose={() => setIsForgotOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsForgotOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <TouchableOpacity onPress={() => setIsForgotOpen(false)}>
                  <X size={18} color="#1C1917" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSub}>
                Enter your registered account email and we'll send you an instant reset link.
              </Text>

              <Text style={styles.label}>Account Email</Text>
              <TextInput
                style={styles.input}
                placeholder="chef@cookmate.com"
                placeholderTextColor="#A8A29E"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => setIsForgotOpen(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sendBtn} 
                  onPress={handleForgotPassword}
                  disabled={isSendingReset}
                >
                  <Text style={styles.sendBtnText}>
                    {isSendingReset ? 'Sending...' : 'Send Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E7E5E4' },
  logoContainer: { alignItems: 'center', marginBottom: 8 },
  logo: { width: 72, height: 72, borderRadius: 16 },
  brandTitle: { fontSize: 24, fontWeight: '700', color: '#1C1917', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#78716C', textAlign: 'center', marginBottom: 16, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  label: { fontSize: 10, textTransform: 'uppercase', color: '#57534E', marginTop: 10, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E7E5E4', backgroundColor: '#F5F5F0', padding: 10, fontSize: 13, color: '#1C1917', borderRadius: 4 },
  datePickerInput: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E7E5E4', 
    backgroundColor: '#F5F5F0', 
    padding: 10, 
    borderRadius: 4 
  },
  dateText: { fontSize: 13, color: '#1C1917' },
  placeholderText: { color: '#A8A29E' },
  strengthRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  strengthText: { fontSize: 11, color: '#78716C' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 6 },
  forgotText: { color: '#78716C', fontSize: 11, fontWeight: '600', textDecorationLine: 'underline' },
  primaryBtn: { backgroundColor: '#1C1917', paddingVertical: 12, alignItems: 'center', marginTop: 16, borderRadius: 4 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  toggleBtn: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: '#57534E', fontSize: 12 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#E7E5E4' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1C1917' },
  modalSub: { fontSize: 12, color: '#78716C', marginTop: 4, marginBottom: 12, lineHeight: 16 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4, borderWidth: 1, borderColor: '#E7E5E4' },
  cancelBtnText: { color: '#57534E', fontSize: 12, fontWeight: '600' },
  sendBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 4, backgroundColor: '#1C1917' },
  sendBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }
});
