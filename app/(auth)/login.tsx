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
import colors from "@/src/theme/colors.js";

interface FormInputProps extends TextInputProps {
  label: string;
  errorMessage?: string; 
}

const FormInput = React.forwardRef<TextInput, FormInputProps>(
  ({ label, errorMessage, onFocus, onBlur, className: propsClassName, secureTextEntry, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // High Contrast Border Logic
    const borderColor = errorMessage
      ? "border-primary_scarlet-500"
      : isFocused
      ? "border-cerulean-600"
      : "border-slate-200"; 

    return (
      <View className="mb-6">
        <Text 
          className="text-slate-900 font-black text-[10px] tracking-[2px] uppercase mb-2 ml-1"
        >
          {label}
        </Text>
        <View 
          className={`relative bg-white border-2 rounded-[24px] flex-row items-center ${borderColor}`}
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
            // pr-14 ensures text never overlaps the eye icon
            className={`flex-1 p-5 text-base font-bold text-slate-900 pr-14 ${propsClassName || ""}`}
            placeholderTextColor="#94a3b8"
            accessibilityLabel={label}
          />
          
          {secureTextEntry && (
            <TouchableOpacity 
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-5"
              activeOpacity={0.7}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Feather 
                name={isPasswordVisible ? "eye" : "eye-off"} 
                size={22} 
                color={colors.cerulean[500]} 
              />
            </TouchableOpacity>
          )}
        </View>

        {errorMessage && (
          <Text 
            className="text-xs font-black text-primary_scarlet-600 mt-2 ml-1 uppercase"
          >
            {errorMessage}
          </Text>
        )}
      </View>
    );
  }
);
FormInput.displayName = "FormInput";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const { login, isLoading, error } = useAuthActions(); 
  const router = useRouter(); 

  const passwordRef = useRef<TextInput>(null);

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
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingBottom: 320,
          }}
          className="px-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View className="mb-14 items-center" accessible={true} accessibilityRole="header">
            <View
              className="bg-cerulean-600 w-24 h-24 rounded-[32px] items-center justify-center mb-8"
              style={{
                shadowColor: colors.cerulean[900],
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Feather name="activity" size={48} color="white" />
            </View>
            <Text className="text-6xl font-black text-slate-900 tracking-tighter">
              Zealthy
            </Text>
            <Text className="text-xl text-cerulean-600 font-black mt-1 uppercase tracking-[3px]">
              Care Portal
            </Text>
          </View>

          {/* Form Section */}
          <View>
            {error && (
              <View
                className="bg-primary_scarlet-600 p-5 rounded-[24px] mb-8"
                style={{
                  shadowColor: colors.primary_scarlet[900],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="text-white text-center font-black text-sm uppercase">
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

          {/* High-Visibility Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isButtonDisabled}
            activeOpacity={0.9}
            accessibilityRole="button"
            className={`mt-6 py-6 rounded-[24px] items-center ${
              isButtonDisabled ? "bg-slate-200" : "bg-bright_amber-500"
            }`}
            style={
              isButtonDisabled
                ? {}
                : {
                    shadowColor: colors.bright_amber[400],
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 8,
                  }
            }
          >
            {isLoading ? (
              <ActivityIndicator color={colors.cerulean[100]} />
            ) : (
              <Text 
                className={`text-xl font-black uppercase tracking-[2px] ${
                  isButtonDisabled ? "text-slate-400" : "text-cerulean-100"
                }`}
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Admin access */}
          <TouchableOpacity
            onPress={() => router.push("/admin" as any)}
            activeOpacity={0.6}
            className="mt-32 py-4"
          >
            <Text className="text-center text-slate-400 font-bold text-xs tracking-[1px] uppercase">
              Staff & EMR Portal: <Text className="text-cerulean-600 font-black underline">Enter Here</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}