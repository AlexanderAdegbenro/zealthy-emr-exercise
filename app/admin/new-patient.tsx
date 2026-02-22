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
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormInput } from "../../src/components/ui/FormInput";
import { NewPatientSchema } from "../../src/lib/validations";
import { adminService } from "../../src/services/adminService";
import { zealthyAlert } from "../../src/utils/alerts";

export default function NewPatientScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [first_name, setFirst_name] = useState("");
  const [last_name, setLast_name] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isFormValid =
    first_name.trim().length > 0 &&
    last_name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0;
  const isButtonDisabled = isSubmitting || !isFormValid;

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    // 1. Validate with Zod
    const validationResult = NewPatientSchema.safeParse({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      password,
    });

    // 2. Handle validation errors
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0].message;
      zealthyAlert("Validation Error", firstError);
      return;
    }

    // 3. Proceed with valid data
    const validData = validationResult.data;
    setIsSubmitting(true);
    const { error } = await adminService.createPatient(validData);
    setIsSubmitting(false);
    if (error) {
      zealthyAlert("Create patient failed", error);
      return;
    }
    zealthyAlert("Patient created", "The patient can now sign in with the email and password you set.");
    router.back();
  };

  return (
    <View
      className="flex-1 bg-slate-50"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Stack.Screen 
        options={{ 
          title: "New Patient",
          headerStyle: { backgroundColor: "#f8fafc" }, // slate-50
          headerShadowVisible: false,
          headerTintColor: "#0f172a", // slate-900
          headerTitleStyle: { fontWeight: "700", fontSize: 16 },
        }} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="border-b border-slate-200 pb-4 mb-6">
            <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Set login and profile
            </Text>
          </View>

          <View className="mb-2">
            <FormInput
              label="First name"
              placeholder="First name"
              value={first_name}
              onChangeText={setFirst_name}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
            <FormInput
              ref={lastNameRef}
              label="Last name"
              placeholder="Last name"
              value={last_name}
              onChangeText={setLast_name}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
            <FormInput
              ref={emailRef}
              label="Email"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
            <FormInput
              ref={passwordRef}
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isButtonDisabled}
            activeOpacity={0.8}
            className={`mt-8 p-5 rounded-2xl items-center shadow-sm ${
              isButtonDisabled
                ? "bg-slate-200 shadow-none"
                : "bg-cerulean-600 shadow-cerulean-200"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`font-bold text-lg ${
                  isButtonDisabled ? "text-slate-400" : "text-white"
                }`}
              >
                Create patient
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
