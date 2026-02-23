import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/src/components/ui/FormInput";
import { NewPatientSchema } from "@/src/lib/validations";
import { adminService } from "@/src/services/adminService";
import { zealthyAlert } from "@/src/utils/alerts";
import { haptics } from "@/src/utils/haptics";
import { platformShadow } from "@/src/utils/shadows";
import colors from "@/src/theme/colors.js";

type NewPatientFormValues = z.infer<typeof NewPatientSchema>;

const buttonActiveShadow = platformShadow({ color: colors.bright_amber[400], offsetY: 8, blur: 16, opacity: 0.4, elevation: 8 });

export default function NewPatientScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { isSubmitting, isValid },
  } = useForm<NewPatientFormValues>({
    resolver: zodResolver(NewPatientSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: NewPatientFormValues) => {
    haptics.medium();
    const { error } = await adminService.createPatient(data);

    if (error) {
      haptics.error();
      zealthyAlert("Registration Failed", error || "An error occurred");
      return;
    }
    
    haptics.success();
    zealthyAlert("Success", "Patient record created successfully.");
    router.back();
  };

  return (
    <View className="flex-1 bg-papaya_whip-900">
      <Stack.Screen
        options={{
          headerTitle: "Register Patient",
          headerTitleStyle: {
            fontWeight: "900",
            fontSize: 20,
            color: colors.cerulean[100],
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
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-cerulean-100 font-black text-xs uppercase tracking-[2px] mb-8">
            Identity & Authentication
          </Text>

          <Controller
            control={control}
            name="first_name"
            render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
              <View>
                <FormInput
                  ref={ref}
                  label="First Name"
                  placeholder="John"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  returnKeyType="next"
                  onSubmitEditing={() => setFocus("last_name")}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="last_name"
            render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
              <View>
                <FormInput
                  ref={ref}
                  label="Last Name"
                  placeholder="Doe"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  returnKeyType="next"
                  onSubmitEditing={() => setFocus("email")}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
              <View>
                <FormInput
                  ref={ref}
                  label="Email Address"
                  placeholder="patient@example.com"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => setFocus("password")}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value, ref }, fieldState: { error } }) => (
              <View>
                <FormInput
                  ref={ref}
                  label="Temporary Password"
                  placeholder="••••••••"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting}
            activeOpacity={0.9}
            className="mt-10 py-6 rounded-[24px] items-center"
            style={[styles.buttonBase, isValid && !isSubmitting ? styles.buttonActive : styles.buttonDisabled, isValid && !isSubmitting ? buttonActiveShadow : null]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, { color: isValid ? colors.cerulean[100] : "#94a3b8" }]}>
                Create Record
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.primary_scarlet[500],
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: "600",
  },
  buttonBase: {
    backgroundColor: "#e2e8f0",
  },
  buttonActive: {
    backgroundColor: colors.bright_amber[500],
  },
  buttonDisabled: {
    backgroundColor: "#e2e8f0",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "900",
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
