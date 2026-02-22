import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppointments, useCreateAppointment } from "../../../src/hooks/useAppointments";
import { adminService } from "../../../src/services/adminService";
import { zealthyAlert } from "../../../src/utils/alerts";
import { FormInput } from "../../../src/components/ui/FormInput";
import { PrescriptionCard } from "../../../src/components/PrescriptionCard";
import { EmptyState } from "../../../src/components/ui/EmptyState";

const REPEAT_OPTIONS: Array<"none" | "weekly" | "monthly"> = ["none", "weekly", "monthly"];

const isWeb = Platform.OS === "web";

function formatDateForDisplay(isoOrEmpty: string): string {
  if (!isoOrEmpty) return "";
  const d = new Date(isoOrEmpty);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

import { PrescriptionSchema } from "../../../src/lib/validations";

export default function PatientDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments(id || "");
  const { mutate: createAppointment, isPending: isCreatingAppointment } = useCreateAppointment();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const isLoading = loading || appointmentsLoading;

  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [firstAppointmentDate, setFirstAppointmentDate] = useState("");
  const [repeatSchedule, setRepeatSchedule] = useState<"none" | "weekly" | "monthly">("none");
  const [repeatDropdownOpen, setRepeatDropdownOpen] = useState(false);
  const [showAppointmentDatePicker, setShowAppointmentDatePicker] = useState(false);

  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [medications, setMedications] = useState<Array<{ id: string; name: string; available_dosages: string[] }>>([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [selectedDosage, setSelectedDosage] = useState("");
  const [quantity, setQuantity] = useState("30");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [medDropdownOpen, setMedDropdownOpen] = useState(false);
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);
  const [showPrescriptionDatePicker, setShowPrescriptionDatePicker] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: history, error } = await adminService.getPatientMedicalHistory(id);
      if (error) throw error;
      setData(history);
    } catch (err) {
      console.error("Error fetching patient history:", err);
      zealthyAlert("Error", "Could not load patient data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    setProviderName("");
    setFirstAppointmentDate("");
    setRepeatSchedule("none");
    setRepeatDropdownOpen(false);
    setShowAppointmentDatePicker(false);
    setAppointmentModalVisible(true);
  };

  const closeAppointmentModal = () => {
    setAppointmentModalVisible(false);
    setRepeatDropdownOpen(false);
    setShowAppointmentDatePicker(false);
  };

  const handleScheduleAppointment = async () => {
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
    setSelectedMedicationId("");
    setSelectedDosage("");
    setQuantity("30");
    setFrequency("");
    setStartDate("");
    setInstructions("");
    setMedDropdownOpen(false);
    setShowPrescriptionDatePicker(false);
    setPrescriptionModalVisible(true);
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalVisible(false);
    setMedDropdownOpen(false);
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
    if (!id) return;
    if (!isPrescriptionValid) {
      zealthyAlert("Missing fields", "Please complete all required fields correctly.");
      return;
    }
    setPrescriptionSubmitting(true);
    const { error } = await adminService.addPrescription({
      patient_id: id,
      medication_id: selectedMedicationId,
      dosage: selectedDosage,
      quantity: parseInt(quantity),
      frequency: frequency.trim(),
      start_date: new Date(startDate).toISOString().split("T")[0],
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
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator color="#086788" size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: data ? `${data.last_name}, ${data.first_name}` : "Patient Details",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: "#f8fafc" }, // slate-50
          headerShadowVisible: false,
          headerTintColor: "#0f172a", // slate-900
          headerTitleStyle: { fontWeight: "700", fontSize: 18 },
        }}
      />
      <ScrollView
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient ID Badge */}
        <View className="px-5 mb-8 items-center">
          <View className="bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ID {id?.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Sections */}
        <View className="px-5 mt-2 gap-6">
          {/* Appointments card */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100" style={styles.cardShadow}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-cerulean-600 items-center justify-center">
                  <Ionicons name="calendar" size={16} color="#fff" />
                </View>
                <Text className="text-lg font-bold text-slate-900">Appointments</Text>
              </View>
              <TouchableOpacity
                onPress={openAppointmentModal}
                className="flex-row items-center gap-1 active:opacity-60"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text className="text-sm font-bold text-neutral-800">Schedule</Text>
                <Ionicons name="add" size={18} color="#262626" />
              </TouchableOpacity>
            </View>

            <View>
              {appointments && appointments.length > 0 ? (
                <View className="gap-3">
                  {appointments.map((apt: any) => (
                    <View
                      key={apt.id}
                      className="bg-white rounded-2xl border border-bright_amber-200 p-4 relative overflow-hidden"
                    >
                      <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-bright_amber-400" />
                      <View className="pl-3">
                        <Text className="font-bold text-slate-900 text-base">
                          {new Date(apt.first_appointment_date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                        <Text className="text-slate-500 text-sm mt-1 font-medium">{apt.provider_name || "—"}</Text>
                        {apt.repeat_schedule && apt.repeat_schedule !== "none" && (
                          <View className="mt-2 flex-row items-center gap-1.5">
                            <Ionicons name="repeat" size={12} color="#086788" />
                            <Text className="text-cerulean-600 text-xs font-semibold capitalize">{apt.repeat_schedule}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="border-2 border-dashed border-slate-200 rounded-2xl p-8 items-center justify-center bg-slate-50/50">
                  <View className="w-12 h-12 rounded-xl bg-slate-100 items-center justify-center mb-3">
                    <Ionicons name="calendar-outline" size={24} color="#94a3b8" />
                  </View>
                  <Text className="text-slate-400 font-medium text-sm text-center">No appointments on record</Text>
                </View>
              )}
            </View>
          </View>

          {/* Prescriptions card */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100" style={styles.cardShadow}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-cerulean-600 items-center justify-center">
                  <Ionicons name="medkit" size={16} color="#fff" />
                </View>
                <Text className="text-lg font-bold text-slate-900">Prescriptions</Text>
              </View>
              <TouchableOpacity
                onPress={openPrescriptionModal}
                className="flex-row items-center gap-1 active:opacity-60"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text className="text-sm font-bold text-neutral-800">New med</Text>
                <Ionicons name="add" size={18} color="#262626" />
              </TouchableOpacity>
            </View>

            <View>
              {data?.prescriptions?.length > 0 ? (
                <View className="gap-3">
                  {data.prescriptions.map((rx: any) => (
                    <PrescriptionCard
                      key={rx.id}
                      medicationName={rx.medications?.name || "Unknown"}
                      dosage={rx.dosage}
                      quantity={rx.quantity}
                      refillDate={rx.refill_date}
                      refillSchedule={rx.refill_schedule}
                    />
                  ))}
                </View>
              ) : (
                <View className="border-2 border-dashed border-slate-200 rounded-2xl p-8 items-center justify-center bg-slate-50/50">
                  <View className="w-12 h-12 rounded-xl bg-slate-100 items-center justify-center mb-3">
                    <Ionicons name="medkit-outline" size={24} color="#94a3b8" />
                  </View>
                  <Text className="text-slate-400 font-medium text-sm text-center">No active prescriptions</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Schedule Appointment Modal */}
      <Modal visible={appointmentModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/40 justify-end md:justify-center px-0 md:px-4 pb-0 md:pb-8">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="bg-white rounded-t-3xl md:rounded-3xl max-h-[90%]"
            style={styles.modalShadow}
          >
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 12 }}>
              <View className="flex-row items-center gap-3 mb-6">
                <View className="w-12 h-12 rounded-2xl bg-cerulean-50 items-center justify-center">
                  <Ionicons name="calendar" size={24} color="#086788" />
                </View>
                <Text className="text-2xl font-bold text-slate-900">Schedule</Text>
              </View>

              <FormInput
                label="Provider name"
                placeholder="e.g. Dr. Smith"
                value={providerName}
                onChangeText={setProviderName}
                editable={!isCreatingAppointment}
              />

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wider">Date</Text>
                {isWeb ? (
                  <TextInput
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-base text-slate-900"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    value={firstAppointmentDate}
                    onChangeText={setFirstAppointmentDate}
                    editable={!isCreatingAppointment}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowAppointmentDatePicker(!showAppointmentDatePicker)}
                      disabled={isCreatingAppointment}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-row justify-between items-center active:bg-slate-100"
                    >
                      <Text className={firstAppointmentDate ? "text-base text-slate-900 font-medium" : "text-base text-slate-400"}>
                        {firstAppointmentDate ? formatDateForDisplay(firstAppointmentDate) : "Select date"}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#64748b" />
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

              <View className="mb-8">
                <Text className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1 tracking-wider">Repeat</Text>
                <TouchableOpacity
                  onPress={() => setRepeatDropdownOpen(!repeatDropdownOpen)}
                  className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-row justify-between items-center active:bg-slate-100"
                  disabled={isCreatingAppointment}
                >
                  <Text className="text-base text-slate-900 capitalize font-medium">{repeatSchedule}</Text>
                  <Ionicons name={repeatDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                </TouchableOpacity>
                {repeatDropdownOpen && (
                  <View className="mt-2 bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                    {REPEAT_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          setRepeatSchedule(opt);
                          setRepeatDropdownOpen(false);
                        }}
                        className="px-4 py-3 border-b border-slate-50 active:bg-slate-50 last:border-0"
                      >
                        <Text className="text-slate-700 font-medium capitalize">{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={closeAppointmentModal}
                  className="flex-1 py-4 rounded-xl bg-slate-100 items-center active:bg-slate-200"
                  disabled={isCreatingAppointment}
                >
                  <Text className="text-slate-600 font-bold text-base">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleScheduleAppointment}
                  disabled={isCreatingAppointment}
                  className="flex-1 py-4 rounded-xl bg-cerulean-600 items-center active:bg-cerulean-700 shadow-sm shadow-cerulean-200"
                >
                  {isCreatingAppointment ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">Schedule</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Prescription Modal */}
      <Modal visible={prescriptionModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/40 justify-end md:justify-center px-0 md:px-4 pb-0 md:pb-8">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="bg-white rounded-t-3xl md:rounded-3xl max-h-[90%]"
            style={styles.modalShadow}
          >
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 12, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center gap-3 mb-6">
                <View className="w-12 h-12 rounded-2xl bg-cerulean-50 items-center justify-center">
                  <Ionicons name="medkit" size={24} color="#086788" />
                </View>
                <View>
                  <Text className="text-2xl font-bold text-slate-900">Add Med</Text>
                  <Text className="text-sm text-slate-500">Assign a new prescription</Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Medication</Text>
                <View className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <TouchableOpacity
                    onPress={() => {
                      setMedDropdownOpen(!medDropdownOpen);
                    }}
                    className={`flex-row justify-between items-center px-4 py-4 ${medDropdownOpen ? "border-b border-slate-200" : ""}`}
                    disabled={prescriptionSubmitting}
                  >
                    <Text className={`text-base flex-1 ${selectedMed ? "text-slate-900 font-medium" : "text-slate-400"}`} numberOfLines={1}>
                      {selectedMed ? selectedMed.name : "Select medication"}
                    </Text>
                    <Ionicons name={medDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                  </TouchableOpacity>
                  {medDropdownOpen && (
                    <View className="max-h-52 bg-white">
                      {medicationsLoading ? (
                        <View className="py-8 items-center">
                          <ActivityIndicator size="small" color="#086788" />
                          <Text className="text-slate-400 text-sm mt-2">Loading...</Text>
                        </View>
                      ) : (
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                          {medications.map((m) => (
                            <TouchableOpacity
                              key={m.id}
                              onPress={() => {
                                setSelectedMedicationId(m.id);
                                setSelectedDosage("");
                                setMedDropdownOpen(false);
                              }}
                              className="px-4 py-3 border-b border-slate-50 active:bg-slate-50"
                            >
                              <Text className="text-slate-900 font-semibold text-base">{m.name}</Text>
                              {m.available_dosages?.length > 0 && (
                                <Text className="text-slate-500 text-sm mt-0.5">{m.available_dosages.join(", ")}</Text>
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {selectedMedicationId && (
                <View className="mb-5">
                  <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Dosage</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {dosageOptions.map((d) => {
                      const isSelected = selectedDosage === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setSelectedDosage(d)}
                          className={`mr-2 px-4 py-2 rounded-full border ${
                            isSelected
                              ? "bg-cerulean-600 border-cerulean-600"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <Text
                            className={`font-semibold ${
                              isSelected ? "text-white" : "text-slate-600"
                            }`}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
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
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Start date</Text>
                {isWeb ? (
                  <TextInput
                    className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-base text-slate-900"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    value={startDate}
                    onChangeText={setStartDate}
                    editable={!prescriptionSubmitting}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowPrescriptionDatePicker(!showPrescriptionDatePicker)}
                      disabled={prescriptionSubmitting}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-row justify-between items-center active:bg-slate-100"
                    >
                      <Text className={startDate ? "text-base text-slate-900 font-medium" : "text-base text-slate-400"}>
                        {startDate ? formatDateForDisplay(startDate) : "Select date"}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#64748b" />
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

              <View className="flex-row gap-3 mt-8">
                <TouchableOpacity
                  onPress={closePrescriptionModal}
                  className="flex-1 py-4 rounded-xl bg-slate-100 items-center active:bg-slate-200"
                  disabled={prescriptionSubmitting}
                >
                  <Text className="text-slate-600 font-bold text-base">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddPrescription}
                  disabled={prescriptionSubmitting || !isPrescriptionValid}
                  className={`flex-1 py-4 rounded-xl items-center justify-center shadow-sm shadow-cerulean-200 ${
                    !isPrescriptionValid ? "bg-slate-200" : "bg-cerulean-600 active:bg-cerulean-700"
                  }`}
                >
                  {prescriptionSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className={`font-bold text-base ${!isPrescriptionValid ? "text-slate-400" : "text-white"}`}>
                      Add Prescription
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  modalShadow: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
});
