import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
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
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isFormValid = Object.values(form).every(v => v.trim().length > 0);

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;
    const validation = NewPatientSchema.safeParse(form);

    if (!validation.success) {
      zealthyAlert("Validation Error", validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    const { error } = await adminService.createPatient(validation.data);
    setIsSubmitting(false);

    if (error) {
      zealthyAlert("Registration Failed", error);
      return;
    }
    zealthyAlert("Success", "Patient record created successfully.");
    router.back();
  };

  return (
    <View className="flex-1 bg-papaya_whip-900">
      <Stack.Screen
        options={{
          headerTitle: "Register Patient",
          headerTitleStyle: {
            fontWeight: "900" as const,
            fontSize: 20,
            color: colors.cerulean[100]
          },
          headerStyle: { backgroundColor: colors.papaya_whip[900] },
          headerShadowVisible: false,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 320 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section Label: High Contrast */}
          <Text className="text-cerulean-100 font-black text-xs uppercase tracking-[2px] mb-8">
            Identity & Authentication
          </Text>

          <FormInput 
            label="First Name" 
            placeholder="John" 
            value={form.first_name} 
            onChangeText={(t) => setForm({...form, first_name: t})} 
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />

          <FormInput 
            ref={lastNameRef}
            label="Last Name" 
            placeholder="Doe" 
            value={form.last_name} 
            onChangeText={(t) => setForm({...form, last_name: t})} 
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <FormInput 
            ref={emailRef}
            label="Email Address" 
            placeholder="patient@example.com" 
            value={form.email} 
            onChangeText={(t) => setForm({...form, email: t})} 
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <FormInput 
            ref={passwordRef}
            label="Temporary Password" 
            placeholder="••••••••" 
            value={form.password} 
            onChangeText={(t) => setForm({...form, password: t})} 
            secureTextEntry
          />

          {/* Action Button: Punchy & Bold */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            activeOpacity={0.9}
            className="mt-10 py-6 rounded-[24px] items-center"
            style={
              isFormValid && !isSubmitting
                ? {
                    backgroundColor: colors.bright_amber[500],
                    shadowColor: colors.bright_amber[400],
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 8,
                  }
                : { backgroundColor: "#e2e8f0" }
            }
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "900",
                  color: isFormValid ? colors.cerulean[100] : "#94a3b8",
                }}
                className="uppercase tracking-widest"
              >
                Create Record
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}