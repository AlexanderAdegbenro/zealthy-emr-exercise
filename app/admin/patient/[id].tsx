import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  Alert,
  RefreshControl,
  LayoutAnimation,
  UIManager,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useAppointments, useCreateAppointment } from "@/src/hooks/useAppointments";
import { adminService } from "@/src/services/adminService";
import { zealthyAlert } from "@/src/utils/alerts";
import { PrescriptionSchema } from "@/src/lib/validations";
import { Feather } from "@expo/vector-icons";
import { FormInput } from "@/src/components/ui/FormInput";
import { StatusPill } from "@/src/components/ui/StatusPill";
import { MedicalCard } from "@/src/components/ui/MedicalCard";
import colors from "@/src/theme/colors.js";

const REPEAT_OPTIONS: ("none" | "weekly" | "monthly")[] = ["none", "weekly", "monthly"];

const isWeb = Platform.OS === "web";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatDateForDisplay(isoOrEmpty: string): string {
  if (!isoOrEmpty) return "";
  const d = new Date(isoOrEmpty);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PatientDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const queryClient = useQueryClient();
  const { data: appointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useAppointments(id || "");
  const { mutate: createAppointment, isPending: isCreatingAppointment } = useCreateAppointment();
  const [refreshing, setRefreshing] = useState(false);

  const handleEndRecurring = async (appointmentId: string) => {
    try {
      await adminService.endRecurringAppointment(appointmentId);
      zealthyAlert("Success", "Recurring series ended.");
      queryClient.invalidateQueries({ queryKey: ["appointments", id] });
    } catch (err: any) {
      zealthyAlert("Error", err?.message ?? "Failed to end series.");
    }
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      "Cancel Appointment?",
      "Are you sure you want to delete this appointment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await adminService.deleteAppointment(appointmentId);
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              zealthyAlert("Success", "Appointment cancelled.");
              queryClient.invalidateQueries({ queryKey: ["appointments", id] });
            } catch (err: any) {
              zealthyAlert("Error", err?.message ?? "Failed to cancel appointment.");
            }
          },
        },
      ]
    );
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    const doDelete = async () => {
      try {
        await adminService.deletePrescription(prescriptionId);
        zealthyAlert("Success", "Medication removed.");
        fetchHistory();
      } catch {
        zealthyAlert("Error", "Could not remove medication.");
      }
    };

    if (isWeb && typeof window !== "undefined") {
      const ok = window.confirm("Remove Medication?\n\nAre you sure you want to delete this prescription?");
      if (ok) await doDelete();
      return;
    }

    Alert.alert(
      "Remove Medication?",
      "Are you sure you want to delete this prescription?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doDelete },
      ]
    );
  };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const isLoading = loading || appointmentsLoading;

  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [firstAppointmentDate, setFirstAppointmentDate] = useState("");
  const [repeatSchedule, setRepeatSchedule] = useState<"none" | "weekly" | "monthly">("none");
  const [showAppointmentDatePicker, setShowAppointmentDatePicker] = useState(false);

  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [medications, setMedications] = useState<{ id: string; name: string; available_dosages: string[] }[]>([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [selectedDosage, setSelectedDosage] = useState("");
  const [quantity, setQuantity] = useState("30");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);
  const [showPrescriptionDatePicker, setShowPrescriptionDatePicker] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: history, error } = await adminService.getPatientMedicalHistory(id);
      if (error) throw error;
      setData(history);
    } catch {
      zealthyAlert("Error", "Could not load patient data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchHistory(), refetchAppointments()]);
    setRefreshing(false);
  }, [fetchHistory, refetchAppointments]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (prescriptionModalVisible && medications.length === 0) {
      setMedicationsLoading(true);
      adminService.getAvailableMedications().then(({ data: meds, error }) => {
        if (error) {
          zealthyAlert("Error", "Could not load medications.");
          return;
        }
        setMedications(meds ?? []);
      }).finally(() => setMedicationsLoading(false));
    }
  }, [prescriptionModalVisible, medications.length]);

  const openAppointmentModal = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setProviderName("");
    setFirstAppointmentDate("");
    setRepeatSchedule("none");
    setShowAppointmentDatePicker(false);
    setAppointmentModalVisible(true);
  };

  const closeAppointmentModal = () => {
    setAppointmentModalVisible(false);
    setShowAppointmentDatePicker(false);
  };

  const isScheduleFormValid = providerName.trim().length > 0 && !!firstAppointmentDate;

  const handleScheduleAppointment = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const trimmed = providerName.trim();
    if (!trimmed || !firstAppointmentDate) {
      zealthyAlert("Missing fields", "Please enter provider name and appointment date.");
      return;
    }
    if (!id) return;
    
    createAppointment({
      patient_id: id,
      provider_name: trimmed,
      first_appointment_date: new Date(firstAppointmentDate).toISOString().split("T")[0],
      repeat_schedule: repeatSchedule,
      status: "scheduled",
    }, {
      onSuccess: () => {
        zealthyAlert("Success", "Appointment scheduled.");
        closeAppointmentModal();
      },
      onError: (error) => {
        zealthyAlert("Error", error.message ?? "Failed to schedule appointment.");
      }
    });
  };

  const openPrescriptionModal = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedMedicationId("");
    setSelectedDosage("");
    setQuantity("30");
    setFrequency("");
    setStartDate("");
    setInstructions("");
    setShowPrescriptionDatePicker(false);
    setPrescriptionModalVisible(true);
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalVisible(false);
    setShowPrescriptionDatePicker(false);
  };

  const selectedMed = medications.find((m) => m.id === selectedMedicationId);
  const dosageOptions = selectedMed?.available_dosages ?? [];

  const isPrescriptionValid = PrescriptionSchema.safeParse({
    medication_id: selectedMedicationId,
    dosage: selectedDosage,
    quantity: parseInt(quantity || "0"),
    frequency: frequency.trim(),
    start_date: startDate,
    instructions: instructions.trim() || undefined,
  }).success;

  const handleAddPrescription = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!id) return;
    if (!isPrescriptionValid) {
      zealthyAlert("Missing fields", "Please complete all required fields correctly.");
      return;
    }
    setPrescriptionSubmitting(true);
    const refillDateIso = new Date(startDate).toISOString().split("T")[0];
    const { error } = await adminService.addPrescription({
      patient_id: id,
      medication_id: selectedMedicationId,
      dosage: selectedDosage,
      refill_schedule: frequency.trim(),
      refill_date: refillDateIso,
      quantity: parseInt(quantity, 10) || 30,
      instructions: instructions.trim() || undefined,
    });
    setPrescriptionSubmitting(false);
    if (error) {
      zealthyAlert("Error", error.message ?? "Failed to add prescription.");
      return;
    }
    zealthyAlert("Success", "Prescription added.");
    closePrescriptionModal();
    fetchHistory();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-papaya_whip-900 justify-center items-center">
        <ActivityIndicator color={colors.cerulean[500]} size="large" />
      </View>
    );
  }

  const patientDisplayName = data ? [data.first_name, data.last_name].filter(Boolean).join(" ") : "Patient";
  const patientIdDisplay = id ? `#${id.slice(-6).toUpperCase()}` : "";

  const fabShadow = {
    shadowColor: "#06aed5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  };

  const within48Hours = (isoDate: string) => {
    const ms = new Date(isoDate).getTime() - Date.now();
    return ms > 0 && ms <= 48 * 60 * 60 * 1000;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="flex-1 bg-papaya_whip-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.cerulean[500]]} />
        }
      >
        {/* Header: Admin Mode - turquoise distinguishes from Patient Portal */}
        <View
          className="relative bg-turquoise_surf-600 rounded-b-[40px] pt-12 pb-8 px-6"
          style={[styles.headerShadow, { paddingTop: insets.top + 48 }]}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="absolute left-4 top-0 z-10 p-2"
            style={{ paddingTop: insets.top }}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text className="text-white text-3xl font-bold pr-10" numberOfLines={1}>
            Patient Profile: {patientDisplayName}
          </Text>
          <Text className="text-white text-lg mt-1" numberOfLines={1}>
            ID: {patientIdDisplay}
          </Text>
        </View>

        {/* Upcoming Appointments */}
        <Text className="text-cerulean-100 font-bold text-xl mt-8 mb-4 px-2">Upcoming Appointments</Text>

        {appointments && appointments.length > 0 ? (
          <View className="gap-4">
            {appointments.map((apt: any) => {
              const isUrgent = within48Hours(apt.first_appointment_date);
              return (
                <MedicalCard key={apt.id} className="relative">
                  <TouchableOpacity
                    onPress={() => handleDeleteAppointment(apt.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="absolute top-0 right-0 z-10 flex-row items-center gap-1.5"
                    activeOpacity={0.8}
                  >
                    <Feather name="trash-2" size={14} color={colors.primary_scarlet[500]} />
                    <Text className="text-primary_scarlet-500 font-semibold text-sm">Cancel</Text>
                  </TouchableOpacity>
                  <Text className="text-xl font-bold text-cerulean-100 pr-20">
                    {new Date(apt.first_appointment_date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  {isUrgent && (
                    <View className="bg-bright_amber-500 rounded-full px-3 py-1 self-start mt-2 shadow-sm">
                      <Text className="text-white text-[10px] font-black uppercase">Urgent</Text>
                    </View>
                  )}
                  {apt.repeat_schedule && apt.repeat_schedule !== "none" && (
                    <StatusPill label={apt.repeat_schedule} variant="info" />
                  )}
                  <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mt-1">Provider</Text>
                  <Text className="text-xl font-bold text-cerulean-100">{apt.provider_name || "—"}</Text>
                  {apt.status ? (
                    <>
                      <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mt-1">Status</Text>
                      <Text className="text-xl font-bold text-cerulean-100">{apt.status}</Text>
                    </>
                  ) : null}
                  {apt.repeat_schedule && apt.repeat_schedule !== "none" && (
                    <TouchableOpacity
                      onPress={() => handleEndRecurring(apt.id)}
                      className="mt-3 pt-3 border-t border-papaya_whip-800 rounded-2xl"
                      activeOpacity={0.8}
                    >
                      <Text className="text-primary_scarlet-500 font-semibold text-sm">End Series</Text>
                    </TouchableOpacity>
                  )}
                </MedicalCard>
              );
            })}
          </View>
        ) : (
          <MedicalCard className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-2xl bg-cerulean-600 items-center justify-center flex-shrink-0">
              <Ionicons name="calendar-outline" size={28} color="#fff" />
            </View>
            <Text className="text-cerulean-600 font-medium flex-1" numberOfLines={2}>
              No appointments on record
            </Text>
          </MedicalCard>
        )}

        {/* Active Prescriptions */}
        <Text className="text-cerulean-100 font-bold text-xl mt-8 mb-4 px-2">Active Prescriptions</Text>

        {data?.prescriptions?.length > 0 ? (
          <View className="gap-4">
            {data.prescriptions.map((rx: any) => (
              <MedicalCard key={rx.id} className="relative">
                <TouchableOpacity
                  onPress={() => handleDeletePrescription(rx.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="absolute top-0 right-0 z-10 flex-row items-center gap-1.5"
                  activeOpacity={0.8}
                >
                  <Feather name="trash-2" size={14} color={colors.primary_scarlet[500]} />
                  <Text className="text-primary_scarlet-500 font-semibold text-sm">Remove</Text>
                </TouchableOpacity>
                <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-1">Dosage</Text>
                <View className="bg-turquoise_surf-500 rounded-full px-4 py-2 self-start mb-2 shadow-sm">
                  <Text className="text-white font-semibold text-sm">{rx.dosage}</Text>
                </View>
                <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase">Medication</Text>
                <Text className="text-xl font-bold text-cerulean-100 pr-24">
                  {rx.medications?.name || "Unknown Medication"}
                </Text>
                {(rx.refill_schedule || rx.refill_date || rx.instructions) ? (
                  <Text className="text-slate-500 font-medium mt-1">
                    {[rx.refill_schedule, rx.refill_date ? `Refill ${new Date(rx.refill_date).toLocaleDateString()}` : null, rx.instructions].filter(Boolean).join(" · ")}
                  </Text>
                ) : null}
              </MedicalCard>
            ))}
            <Pressable className="bg-slate-50 p-4 rounded-2xl flex-row justify-between items-center mt-0" style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <Text className="text-cerulean-500 font-semibold">View full Prescriptions</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.cerulean[500]} />
            </Pressable>
          </View>
        ) : (
          <MedicalCard className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-2xl bg-cerulean-600 items-center justify-center flex-shrink-0">
              <Ionicons name="medkit-outline" size={28} color="#fff" />
            </View>
            <Text className="text-cerulean-600 font-medium flex-1" numberOfLines={2}>
              No active prescriptions
            </Text>
          </MedicalCard>
        )}
      </ScrollView>
      </View>

      {/* FABs: Schedule Appt + New Rx */}
      <View
        className="absolute right-0 flex-row gap-3 items-center"
        style={{ bottom: 24 + insets.bottom, paddingHorizontal: 24 }}
      >
        <TouchableOpacity
          onPress={openAppointmentModal}
          className="w-14 h-14 rounded-2xl bg-turquoise_surf-500 items-center justify-center"
          style={fabShadow}
          activeOpacity={0.9}
        >
          <Ionicons name="calendar" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openPrescriptionModal}
          className="w-14 h-14 rounded-2xl bg-cerulean-500 items-center justify-center"
          style={[fabShadow, { shadowColor: colors.cerulean[500] }]}
          activeOpacity={0.9}
        >
          <Ionicons name="medkit" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Schedule Appointment Modal */}
      <Modal
        visible={appointmentModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeAppointmentModal}
        presentationStyle="overFullScreen"
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Pressable style={styles.modalBackdrop} onPress={closeAppointmentModal} />
          <View style={[styles.modalSheet, styles.modalShadow, { maxHeight: "90%", paddingBottom: insets.bottom }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <View className="w-12 h-1.5 bg-papaya_whip-400 rounded-full self-center mt-3 mb-2" />
              <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 12, paddingBottom: 16 }} style={styles.modalScroll}>
              <View className="flex-row items-center gap-3 mb-6">
                <View className="w-12 h-12 rounded-2xl bg-cerulean-50 items-center justify-center">
                  <Ionicons name="calendar" size={24} color={colors.cerulean[500]} />
                </View>
                <Text className="text-2xl font-bold text-cerulean-100">Schedule</Text>
              </View>

              <FormInput
                label="Provider name"
                placeholder="e.g. Dr. Smith"
                value={providerName}
                onChangeText={setProviderName}
                editable={!isCreatingAppointment}
              />

              <View className="mb-4">
                <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-2 ml-1">Date</Text>
                {isWeb ? (
                  <TextInput
                    className="bg-papaya_whip-500 border border-papaya_whip-800 p-4 rounded-xl text-base text-cerulean-100"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.cerulean[500]}
                    value={firstAppointmentDate}
                    onChangeText={setFirstAppointmentDate}
                    editable={!isCreatingAppointment}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowAppointmentDatePicker(!showAppointmentDatePicker)}
                      disabled={isCreatingAppointment}
                      className="bg-papaya_whip-500 border border-papaya_whip-800 p-4 rounded-xl flex-row justify-between items-center active:opacity-80"
                    >
                      <Text className={firstAppointmentDate ? "text-base text-cerulean-100 font-medium" : "text-base text-cerulean-500"}>
                        {firstAppointmentDate ? formatDateForDisplay(firstAppointmentDate) : "Select date"}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={colors.cerulean[500]} />
                    </TouchableOpacity>
                    {showAppointmentDatePicker && (
                      <DateTimePicker
                        value={firstAppointmentDate ? new Date(firstAppointmentDate) : new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        themeVariant="light"
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === "android") setShowAppointmentDatePicker(false);
                          if (event.type === "set" && selectedDate) {
                            setFirstAppointmentDate(selectedDate.toISOString().split("T")[0]);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-2 ml-1">Repeat</Text>
                <View className="flex-row gap-2">
                  {REPEAT_OPTIONS.map((opt) => {
                    const isSelected = repeatSchedule === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => setRepeatSchedule(opt)}
                        disabled={isCreatingAppointment}
                        className={`flex-1 py-3 rounded-xl border-2 items-center active:opacity-90 ${
                          isSelected
                            ? "bg-cerulean-500 border-cerulean-600"
                            : "bg-papaya_whip-500 border-papaya_whip-800"
                        }`}
                      >
                        <Text
                          className={`font-semibold text-sm capitalize ${
                            isSelected ? "text-white" : "text-cerulean-600"
                          }`}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            {/* Sticky action row so Schedule is always visible */}
            <View className="flex-row justify-between items-center gap-3 px-6 pb-6 pt-2 bg-white border-t border-papaya_whip-800 flex-shrink-0">
              <Pressable
                onPress={closeAppointmentModal}
                disabled={isCreatingAppointment}
                style={({ pressed }) => [
                  { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, alignItems: "center", backgroundColor: colors.papaya_whip[400] },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text className="text-cerulean-600 font-bold text-base">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleScheduleAppointment}
                disabled={isCreatingAppointment}
                style={({ pressed }) => [
                  {
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 16,
                    alignItems: "center",
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  },
                  isScheduleFormValid
                    ? { backgroundColor: colors.cerulean[500], shadowColor: colors.cerulean[500], shadowOpacity: 0.25, elevation: 2 }
                    : { backgroundColor: colors.cerulean[300], opacity: 0.8 },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                {isCreatingAppointment ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className={`font-bold text-base ${isScheduleFormValid ? "text-white" : "text-cerulean-500"}`}>Schedule</Text>
                )}
              </Pressable>
            </View>
            </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      {/* Add Prescription Modal */}
      <Modal
        visible={prescriptionModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closePrescriptionModal}
        presentationStyle="overFullScreen"
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Pressable style={styles.modalBackdrop} onPress={closePrescriptionModal} />
          <View style={[styles.modalSheet, styles.modalShadow, { maxHeight: "90%", paddingBottom: insets.bottom }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <View className="w-12 h-1.5 bg-papaya_whip-400 rounded-full self-center mt-3 mb-2" />
              <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 12, paddingBottom: 16 }} style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center gap-3 mb-6">
                <View className="w-12 h-12 rounded-2xl bg-cerulean-50 items-center justify-center">
                  <Ionicons name="medkit" size={24} color={colors.cerulean[500]} />
                </View>
                <View>
                  <Text className="text-2xl font-bold text-cerulean-100">Add Med</Text>
                  <Text className="text-sm text-cerulean-500">Assign a new prescription</Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-2 ml-1">Medication</Text>
                {medicationsLoading ? (
                  <View className="py-6 items-center rounded-xl bg-papaya_whip-500">
                    <ActivityIndicator size="small" color={colors.cerulean[500]} />
                    <Text className="text-cerulean-500 text-sm mt-2">Loading...</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                    <View className="flex-row gap-2 px-1">
                      {medications.map((m) => {
                        const isSelected = selectedMedicationId === m.id;
                        return (
                          <TouchableOpacity
                            key={m.id}
                            onPress={() => {
                              setSelectedMedicationId(m.id);
                              setSelectedDosage("");
                            }}
                            disabled={prescriptionSubmitting}
                            className={`py-3 px-4 rounded-xl border-2 items-center active:opacity-90 ${
                              isSelected
                                ? "bg-cerulean-500 border-cerulean-600"
                                : "bg-papaya_whip-500 border-papaya_whip-800"
                            }`}
                          >
                            <Text
                              className={`font-semibold text-sm ${isSelected ? "text-white" : "text-cerulean-600"}`}
                              numberOfLines={1}
                            >
                              {m.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>

              {selectedMedicationId && dosageOptions.length > 0 && (
                <View className="mb-5">
                  <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-2 ml-1">Dosage</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {dosageOptions.map((d) => {
                      const isSelected = selectedDosage === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setSelectedDosage(d)}
                          disabled={prescriptionSubmitting}
                          className={`py-3 px-4 rounded-xl border-2 items-center active:opacity-90 ${
                            isSelected
                              ? "bg-cerulean-500 border-cerulean-600"
                              : "bg-papaya_whip-500 border-papaya_whip-800"
                          }`}
                        >
                          <Text
                            className={`font-semibold text-sm ${
                              isSelected ? "text-white" : "text-cerulean-600"
                            }`}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <FormInput
                    label="Quantity"
                    placeholder="30"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    editable={!prescriptionSubmitting}
                  />
                </View>
                <View className="flex-1">
                  <FormInput
                    label="Refill Schedule"
                    placeholder="e.g. Daily"
                    value={frequency}
                    onChangeText={setFrequency}
                    editable={!prescriptionSubmitting}
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-slate-600 font-bold text-[10px] tracking-[1.5px] uppercase mb-2 ml-1">Start date</Text>
                {isWeb ? (
                  <TextInput
                    className="bg-papaya_whip-500 border border-papaya_whip-800 p-4 rounded-xl text-base text-cerulean-100"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.cerulean[500]}
                    value={startDate}
                    onChangeText={setStartDate}
                    editable={!prescriptionSubmitting}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowPrescriptionDatePicker(!showPrescriptionDatePicker)}
                      disabled={prescriptionSubmitting}
                      className="bg-papaya_whip-500 border border-papaya_whip-800 p-4 rounded-xl flex-row justify-between items-center active:opacity-80"
                    >
                      <Text className={startDate ? "text-base text-cerulean-100 font-medium" : "text-base text-cerulean-500"}>
                        {startDate ? formatDateForDisplay(startDate) : "Select date"}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={colors.cerulean[500]} />
                    </TouchableOpacity>
                    {showPrescriptionDatePicker && (
                      <DateTimePicker
                        value={startDate ? new Date(startDate) : new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        themeVariant="light"
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === "android") setShowPrescriptionDatePicker(false);
                          if (event.type === "set" && selectedDate) {
                            setStartDate(selectedDate.toISOString().split("T")[0]);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              </View>

              <FormInput
                label="Instructions (optional)"
                placeholder="Notes for patient..."
                value={instructions}
                onChangeText={setInstructions}
                editable={!prescriptionSubmitting}
              />
            </ScrollView>
            {/* Sticky action row so Add Prescription is always visible */}
            <View className="flex-row justify-between items-center gap-3 px-6 pb-6 pt-2 bg-white border-t border-papaya_whip-800 flex-shrink-0">
              <Pressable
                onPress={closePrescriptionModal}
                disabled={prescriptionSubmitting}
                style={({ pressed }) => [
                  { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, alignItems: "center", backgroundColor: colors.papaya_whip[400] },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text className="text-cerulean-600 font-bold text-base">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddPrescription}
                disabled={prescriptionSubmitting || !isPrescriptionValid}
                style={({ pressed }) => [
                  {
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 16,
                    alignItems: "center",
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  },
                  !isPrescriptionValid
                    ? { backgroundColor: colors.cerulean[300], opacity: 0.8 }
                    : { backgroundColor: colors.cerulean[500], shadowColor: colors.cerulean[500], shadowOpacity: 0.25, elevation: 2 },
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                {prescriptionSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className={`font-bold text-base ${!isPrescriptionValid ? "text-cerulean-500" : "text-white"}`}>
                    Add Prescription
                  </Text>
                )}
              </Pressable>
            </View>
            </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 21, 27, 0.4)",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalShadow: {
    shadowColor: colors.cerulean[100],
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  modalContent: { flex: 1, minHeight: 0 },
  modalScroll: { flex: 1, minHeight: 0 },
});
