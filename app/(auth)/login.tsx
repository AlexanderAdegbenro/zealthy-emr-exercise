import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthActions } from "@/src/hooks/useAuthActions";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

// --- 1. ATOMIC COMPONENT: Reusable Form Input ---
interface FormInputProps extends TextInputProps {
  label: string;
  errorMessage?: string; 
}

const FormInput = React.forwardRef<TextInput, FormInputProps>(
  ({ label, errorMessage, onFocus, onBlur, className: propsClassName, secureTextEntry, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Dynamic border logic
    const borderColor = errorMessage
      ? "border-primary_scarlet-500"
      : isFocused
      ? "border-cerulean-400"
      : "border-papaya_whip-800"; 

    return (
      <View className="mb-6">
        <Text 
          className="text-slate-400 font-bold text-[10px] tracking-[2px] uppercase mb-2 ml-1"
          accessibilityElementsHidden={true}
        >
          {label}
        </Text>
        <View 
          className={`relative bg-white border rounded-[20px] transition-colors ${borderColor}`}
        >
          <TextInput
            {...props}
            ref={ref}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`p-5 text-base text-cerulean-900 ${propsClassName || ""}`}
            placeholderTextColor="#94a3b8"
            accessibilityLabel={label}
          />
          
          {/* Password Toggle Eye Icon */}
          {secureTextEntry && (
            <TouchableOpacity 
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-4 top-4"
              activeOpacity={0.7}
            >
              <Feather 
                name={isPasswordVisible ? "eye" : "eye-off"} 
                size={20} 
                color="#086788" 
              />
            </TouchableOpacity>
          )}
        </View>

        {errorMessage && (
          <Text 
            className="text-xs font-bold text-primary_scarlet-500 mt-2 ml-1"
            accessibilityLiveRegion="polite"
          >
            {errorMessage}
          </Text>
        )}
      </View>
    );
  }
);
FormInput.displayName = "FormInput";


// --- 2. MAIN SCREEN ---
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Destructure 'error' to show login failures to the user
  const { login, isLoading, error } = useAuthActions(); 
  const router = useRouter(); 

  const passwordRef = useRef<TextInput>(null);

  // --- 3. DERIVED STATE ---
  const isFormValid = email.trim().length > 0 && password.trim().length > 0;
  const isButtonDisabled = isLoading || !isFormValid;

  const handleLogin = () => {
    if (isFormValid) login(email, password);
  };

  return (
    <View 
      className="flex-1 bg-papaya_whip-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section: Now with a Brand Icon */}
          <View className="mb-12 items-center" accessible={true} accessibilityRole="header">
            <View className="bg-cerulean-600 w-20 h-20 rounded-[24px] items-center justify-center shadow-xl mb-6">
               <Feather name="activity" size={40} color="white" />
            </View>
            <Text className="text-5xl font-black text-cerulean-800 tracking-tighter">
              Zealthy
            </Text>
            <Text className="text-lg text-cerulean-400 font-semibold mt-1 tracking-wide">
              Patient Care Portal
            </Text>
          </View>

          {/* Form Section */}
          <View>
            {/* Global Error Notice */}
            {error && (
              <View className="bg-primary_scarlet-900/30 p-4 rounded-2xl mb-6 border border-primary_scarlet-800">
                <Text className="text-primary_scarlet-600 text-center font-bold text-sm">
                  {error}
                </Text>
              </View>
            )}

            <FormInput
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isLoading}
            />

            <FormInput
              ref={passwordRef}
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
            />
          </View>

          {/* Action Button: Clean Tailwind refactor with dynamic state */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: isButtonDisabled, busy: isLoading }}
            className={`mt-6 py-5 rounded-full items-center shadow-lg transition-all ${
              isButtonDisabled 
                ? "bg-papaya_whip-400 shadow-none" 
                : "bg-cerulean-600 shadow-cerulean-200"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text 
                className={`text-lg font-black tracking-wide ${
                  isButtonDisabled ? "text-papaya_whip-700" : "text-white"
                }`}
              >
                Sign In to Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Admin access: Redesigned as a subtle text button */}
          <TouchableOpacity
            onPress={() => router.push("/admin" as any)}
            activeOpacity={0.6}
            className="mt-12 py-4"
          >
            <Text className="text-center text-slate-400 font-bold text-xs tracking-[1px] uppercase">
              Staff & EMR Portal: <Text className="text-cerulean-600 underline">Enter Here</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}