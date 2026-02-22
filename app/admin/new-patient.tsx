import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormInput } from "@/src/components/ui/FormInput";
import { NewPatientSchema } from "@/src/lib/validations";
import { adminService } from "@/src/services/adminService";
import { zealthyAlert } from "@/src/utils/alerts";
import colors from "@/src/theme/colors.js";

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
      className="flex-1 bg-papaya_whip-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Stack.Screen 
        options={{ 
          title: "New Patient",
          headerStyle: { backgroundColor: colors.papaya_whip[900] },
          headerShadowVisible: false,
          headerTintColor: colors.cerulean[100],
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
          <View className="mb-6">
            <Text className="text-xs font-bold text-cerulean-600 uppercase tracking-wider">
              Set login and profile
            </Text>
            <View className="h-1.5 bg-bright_amber-400 rounded-full mt-2 w-12" />
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

          <Pressable
            onPress={handleSubmit}
            disabled={isButtonDisabled}
            style={({ pressed }) => [
              {
                marginTop: 32,
                paddingVertical: 14,
                paddingHorizontal: 24,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isButtonDisabled ? colors.papaya_whip[400] : colors.cerulean[500],
                shadowColor: isButtonDisabled ? "transparent" : colors.cerulean[500],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isButtonDisabled ? 0 : 0.25,
                shadowRadius: 6,
                elevation: isButtonDisabled ? 0 : 2,
              },
              { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: pressed ? 0.9 : 1 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: isButtonDisabled ? colors.cerulean[500] : "#fff",
                }}
              >
                Create patient
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
