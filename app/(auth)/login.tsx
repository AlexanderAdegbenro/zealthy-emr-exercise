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
import { platformShadow } from "@/src/utils/shadows";

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
              style={{
                position: "absolute",
                right: 28,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
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
      style={{ paddingBottom: insets.bottom }}
    >
      {/* Premium cerulean header - matches Directory style */}
      <View
        className="bg-cerulean-600 rounded-b-[48px] px-8 pb-12 items-center"
        style={[{ paddingTop: insets.top + 24 }, platformShadow({ color: colors.cerulean[900], offsetY: 16, blur: 24, opacity: 0.35, elevation: 20 })]}
        accessible
        accessibilityRole="header"
      >
        <View
          className="bg-white/20 w-20 h-20 rounded-[28px] items-center justify-center mb-6"
          style={{
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.3)",
          }}
        >
          <Feather name="activity" size={40} color="white" />
        </View>
        <Text className="text-4xl font-black text-white tracking-tighter">
          Zealthy
        </Text>
        <Text className="text-base text-white/90 font-bold mt-1 uppercase tracking-[4px]">
          Care Portal
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form card - Directory-style white card */}
          <View
            className="bg-white rounded-[32px] p-6 mb-6"
            style={[platformShadow({ color: colors.cerulean[300], offsetY: 12, blur: 24, opacity: 0.12, elevation: 12 }), { borderWidth: 1, borderColor: colors.papaya_whip[800] }]}
          >
            {error && (
              <View
                className="bg-primary_scarlet-500 p-4 rounded-[20px] mb-6"
                style={platformShadow({ color: colors.primary_scarlet[900], offsetY: 4, blur: 8, opacity: 0.2, elevation: 6 })}
              >
                <Text className="text-white text-center font-bold text-sm">
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

          {/* Sign In - yellow CTA matching NEW PATIENT FAB */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isButtonDisabled}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            style={{
              backgroundColor: isButtonDisabled ? "#e2e8f0" : colors.bright_amber[500],
              paddingVertical: 20,
              borderRadius: 24,
              alignItems: "center",
              ...(isButtonDisabled ? {} : platformShadow({ color: colors.bright_amber[400], offsetY: 10, blur: 20, opacity: 0.45, elevation: 10 })),
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.cerulean[500]} />
            ) : (
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  letterSpacing: 2,
                  color: isButtonDisabled ? "#94a3b8" : colors.cerulean[500],
                }}
                className="uppercase"
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Staff portal - pinned to bottom, compact */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 16,
            paddingTop: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/admin" as any)}
            activeOpacity={0.7}
            className="py-3 px-4 rounded-xl border border-cerulean-200 bg-cerulean-50"
          >
            <Text className="text-center text-slate-500 font-medium text-[10px] tracking-widest uppercase">
              Staff & EMR Portal · <Text style={{ color: colors.cerulean[500], fontWeight: "700" }}>Enter Here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}