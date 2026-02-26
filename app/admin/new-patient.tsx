import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { adminService } from "@/src/services/adminService";
import { FormInput } from "@/src/components/ui/FormInput";
import { NewPatientSchema, type NewPatientFormValues } from "@/src/lib/validations";
import { zealthyAlert } from "@/src/utils/alerts";
import colors from "@/src/theme/colors.js";
import { platformShadow } from "@/src/utils/shadows";
import { haptics } from "@/src/utils/haptics";

export default function NewPatientScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [first_name, setFirst_name] = useState("");
  const [last_name, setLast_name] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    haptics.medium();
    setError(null);
    const parsed = NewPatientSchema.safeParse({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      password,
    });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg =
        first.first_name?.[0] ??
        first.last_name?.[0] ??
        first.email?.[0] ??
        first.password?.[0] ??
        "Please fix the form.";
      setError(msg);
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error: createError } = await adminService.createPatient(parsed.data as NewPatientFormValues);
      if (createError) throw new Error(createError);
      if (!data?.id) throw new Error("User creation failed");
      zealthyAlert("Success", "Patient account created.");
      router.replace({ pathname: "/admin", params: { newPatientId: data.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create patient.");
    } finally {
      setIsSubmitting(false);
    }
  }, [first_name, last_name, email, password, router]);

  const isFormValid =
    first_name.trim().length >= 2 &&
    last_name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6;
  const isButtonDisabled = isSubmitting || !isFormValid;

  return (
    <View className="flex-1 bg-papaya_whip-900" style={{ paddingBottom: insets.bottom }}>
      <Stack.Screen options={{ title: "New Patient", headerShown: true }} />
      <View
        className="bg-cerulean-600 rounded-b-[48px] px-8 pb-10"
        style={[
          { paddingTop: insets.top + 16 },
          platformShadow({ color: colors.cerulean[900], offsetY: 16, blur: 24, opacity: 0.2, elevation: 20 }),
        ]}
      >
        <View className="items-center">
          <View className="bg-white/20 w-16 h-16 rounded-2xl items-center justify-center mb-3">
            <Feather name="user-plus" size={28} color="white" />
          </View>
          <Text className="text-white text-2xl font-black tracking-tighter">Add Patient</Text>
          <Text className="text-white/90 text-sm font-bold mt-1 uppercase tracking-widest">
            Create account
          </Text>
        </View>
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
            paddingTop: 24,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="bg-white rounded-[32px] p-6 mb-6"
            style={[
              platformShadow({ color: colors.cerulean[300], offsetY: 12, blur: 24, opacity: 0.12, elevation: 12 }),
              { borderWidth: 1, borderColor: colors.papaya_whip[800] },
            ]}
          >
            {error && (
              <View className="bg-primary_scarlet-50 border border-primary_scarlet-200 p-4 rounded-xl mb-4">
                <Text className="text-primary_scarlet-700 font-bold text-sm">{error}</Text>
              </View>
            )}

            <FormInput
              label="First name"
              placeholder="Jane"
              value={first_name}
              onChangeText={setFirst_name}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
            <FormInput
              label="Last name"
              placeholder="Doe"
              value={last_name}
              onChangeText={setLast_name}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
            <FormInput
              label="Email"
              placeholder="jane.doe@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isSubmitting}
            />
            <FormInput
              label="Password (min 6 characters)"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isButtonDisabled}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Create patient"
            style={{
              backgroundColor: isButtonDisabled ? "#e2e8f0" : colors.bright_amber[500],
              paddingVertical: 20,
              borderRadius: 24,
              alignItems: "center",
              ...(isButtonDisabled
                ? {}
                : platformShadow({
                    color: colors.bright_amber[400],
                    offsetY: 10,
                    blur: 20,
                    opacity: 0.45,
                    elevation: 10,
                  })),
            }}
          >
            {isSubmitting ? (
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
                Create Patient
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
