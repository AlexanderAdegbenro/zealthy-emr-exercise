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
import { useAuthActions } from "../../src/hooks/useAuthActions";
import { useRouter } from "expo-router";

// --- 1. ATOMIC COMPONENT: Reusable Form Input ---
interface FormInputProps extends TextInputProps {
  label: string;
  errorMessage?: string; 
}

const FormInput = React.forwardRef<TextInput, FormInputProps>(
  ({ label, errorMessage, onFocus, onBlur, className: propsClassName, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    // Dynamic border logic based on custom palette
    const borderColor = errorMessage
      ? "border-primary_scarlet-500" 
      : isFocused
      ? "border-cerulean-400" 
      : "border-papaya_whip-300"; 

    const baseClassName = `bg-white border-2 p-5 rounded-2xl text-base text-cerulean-500 transition-colors ${borderColor}`;

    return (
      <View className="mb-4">
        <Text
          className="text-xs font-black text-cerulean-300 uppercase mb-2 ml-1 tracking-widest"
          accessibilityElementsHidden={true}
        >
          {label}
        </Text>
        <TextInput
          {...props}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={propsClassName ? `${baseClassName} ${propsClassName}` : baseClassName}
          placeholderTextColor="#74d6f7"
          accessibilityLabel={label}
        />
        {errorMessage ? (
          <Text
            className="text-xs font-bold text-primary_scarlet-500 mt-2 ml-1"
            accessibilityLiveRegion="polite"
          >
            {errorMessage}
          </Text>
        ) : null}
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
  const { login, isLoading } = useAuthActions();
  const router = useRouter(); // Initialize the router to power the new button

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
          {/* Header Section */}
          <View className="mb-12" accessible={true} accessibilityRole="header">
            <Text className="text-6xl font-black text-cerulean-500 tracking-tighter">
              Zealthy
            </Text>
            <Text className="text-xl text-cerulean-300 font-bold mt-2 tracking-wide">
              Patient Care Portal
            </Text>
          </View>

          {/* Form Section */}
          <View className="gap-y-1">
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

          {/* Action Section */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: isButtonDisabled, busy: isLoading }}
            className={`mt-6 p-5 rounded-2xl items-center shadow-xl border ${
              isButtonDisabled
                ? "bg-papaya_whip-300 border-papaya_whip-400"
                : "bg-cerulean-500 border-cerulean-400 shadow-turquoise_surf-900"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`font-black text-lg tracking-wide ${
                  isButtonDisabled ? "text-papaya_whip-100" : "text-white"
                }`}
              >
                Sign In to Account
              </Text>
            )}
          </TouchableOpacity>

          {/* NEW: Admin Access Door */}
          <TouchableOpacity 
           onPress={() => router.push("/admin" as any)}
            activeOpacity={0.6}
            className="mt-8 py-4"
          >
            <Text className="text-center text-cerulean-300 font-bold text-sm">
              Staff & EMR Portal: <Text className="underline text-cerulean-500">Enter Here (Unauthenticated)</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}