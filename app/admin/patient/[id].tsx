import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  RefreshControl,
  UIManager,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useAppointments, useCreateAppointment } from "@/src/hooks/useAppointments";
import { adminService } from "@/src/services/adminService";
import { zealthyAlert } from "@/src/utils/alerts";
import { FormInput } from "@/src/components/ui/FormInput";
import { StatusPill } from "@/src/components/ui/StatusPill";
import { MedicalCard } from "@/src/components/ui/MedicalCard";
import { EmptyState } from "@/src/components/ui/EmptyState";
import colors from "@/src/theme/colors.js";

/** Parses YYYY-MM-DD as local date to avoid UTC timezone shift. */
function formatDateLocal(isoDate: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  const [y, m, d] = isoDate.split("T")[0].split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, options);
}

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PatientDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const queryClient = useQueryClient();
  const { data: appointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useAppointments(id || "");
  const { mutate: createAppointment } = useCreateAppointment();
  const [refreshing, setRefreshing] = useState(false);

  // Patient Data State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isLoading = loading || appointmentsLoading;

  // Appointment Modal State
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [firstAppointmentDate, setFirstAppointmentDate] = useState("");
  const [repeatSchedule] = useState<"none" | "weekly" | "monthly">("none");

  // Prescription Modal State
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

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Handle Logic Helpers (Delete/Add)
  const handleDeleteAppointment = (appointmentId: string) => {
    Alert.alert("Cancel?", "Delete this appointment?", [
      { text: "No", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await adminService.deleteAppointment(appointmentId);
        queryClient.invalidateQueries({ queryKey: ["appointments", id] });
      }}
    ]);
  };

  const handleScheduleAppointment = async () => {
    if (!providerName || !firstAppointmentDate) return;
    createAppointment({
      patient_id: id!,
      provider_name: providerName.trim(),
      first_appointment_date: firstAppointmentDate,
      repeat_schedule: repeatSchedule,
      status: "scheduled",
    }, {
      onSuccess: () => {
        setAppointmentModalVisible(false);
        queryClient.invalidateQueries({ queryKey: ["appointments", id] });
      }
    });
  };

  const handleAddPrescription = async () => {
    if (!selectedMedicationId || !selectedDosage || !startDate) return;
    setPrescriptionSubmitting(true);
    const { error } = await adminService.addPrescription({
      patient_id: id!,
      medication_id: selectedMedicationId,
      dosage: selectedDosage,
      refill_schedule: frequency.trim() || "As needed",
      refill_date: startDate,
      quantity: parseInt(quantity, 10) || 30,
      instructions: instructions.trim(),
    });
    setPrescriptionSubmitting(false);
    if (!error) {
      await fetchHistory();
      setPrescriptionModalVisible(false);
      zealthyAlert("Success", "Prescription added.");
    } else {
      zealthyAlert("Error", error.message ?? "Failed to add prescription.");
    }
  };

  const handleDeletePrescription = (prescriptionId: string) => {
    Alert.alert("Remove Medication?", "Delete this prescription?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await adminService.deletePrescription(prescriptionId);
            fetchHistory();
            zealthyAlert("Success", "Medication removed.");
          } catch {
            zealthyAlert("Error", "Could not remove medication.");
          }
        },
      },
    ]);
  };

  const openPrescriptionModal = () => {
    setSelectedMedicationId("");
    setSelectedDosage("");
    setStartDate("");
    setFrequency("");
    setPrescriptionModalVisible(true);
  };

  useEffect(() => {
    if (prescriptionModalVisible && medications.length === 0) {
      setMedicationsLoading(true);
      adminService.getAvailableMedications().then(({ data: meds, error }) => {
        if (error) zealthyAlert("Error", "Could not load medications.");
        else setMedications(meds ?? []);
      }).finally(() => setMedicationsLoading(false));
    }
  }, [prescriptionModalVisible, medications.length]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-papaya_whip-900 justify-center items-center">
        <ActivityIndicator color={colors.cerulean[500]} size="large" />
      </View>
    );
  }

  const patientName = data ? `${data.first_name} ${data.last_name}` : "Patient Detail";

  const fabShadow = {
    shadowColor: "#06536c",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  };
  const fabShadowAmber = {
    shadowColor: "#615103",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  };

  return (
    <View className="flex-1 bg-papaya_whip-900">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 1. ADMIN HD HEADER - match directory */}
      <View
        className="bg-cerulean-600 rounded-b-[48px] px-8 pb-10"
        style={{
          paddingTop: insets.top + 20,
          shadowColor: colors.cerulean[900],
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 20,
        }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/10 w-10 h-10 rounded-xl items-center justify-center">
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <Text className="text-white text-3xl font-black tracking-tighter" numberOfLines={1}>
              {patientName}
            </Text>
            <Text className="text-white text-sm font-bold opacity-90 mt-0.5">
              ID: {id?.slice(-8).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.cerulean[500]]} tintColor={colors.cerulean[500]} />}
      >
        <View className="px-6">
          {/* Section: Appointments */}
          <Text className="text-slate-900 font-black text-xs uppercase tracking-[2px] mb-4 mt-10 px-2">Upcoming Visits</Text>
          {appointments && appointments.length > 0 ? (
            appointments.map((apt: any) => (
              <MedicalCard key={apt.id} className="mb-4">
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Appointment</Text>
                    <Text className="text-2xl font-black text-slate-900">
                      {formatDateLocal(apt.first_appointment_date)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteAppointment(apt.id)} className="bg-primary_scarlet-50 p-2 rounded-lg">
                    <Feather name="trash-2" size={16} color={colors.primary_scarlet[600]} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center justify-between pt-4 border-t border-slate-50">
                  <Text className="text-cerulean-800 font-bold">{apt.provider_name}</Text>
                  <StatusPill label={apt.status || "Scheduled"} variant="info" />
                </View>
              </MedicalCard>
            ))
          ) : (
            <View className="mb-4">
              <EmptyState icon="calendar-outline" message="No visits scheduled" />
            </View>
          )}

          {/* Section: Prescriptions */}
          <Text className="text-slate-900 font-black text-xs uppercase tracking-[2px] mb-4 mt-10 px-2">Active Meds</Text>
          {data?.prescriptions?.length > 0 ? (
            data.prescriptions.map((rx: any) => (
              <MedicalCard key={rx.id} className="mb-4">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-2xl font-black text-slate-900 flex-1">{rx.medications?.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeletePrescription(rx.id)}
                    className="bg-primary_scarlet-50 p-2 rounded-lg"
                  >
                    <Feather name="trash-2" size={16} color={colors.primary_scarlet[600]} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center mt-3">
                  <View className="bg-cerulean-600 px-3 py-1 rounded-lg mr-3">
                    <Text className="text-white font-bold text-xs">{rx.dosage}</Text>
                  </View>
                  <Text className="text-slate-400 font-bold text-[10px] uppercase">Refill: {rx.refill_schedule || "—"}</Text>
                </View>
              </MedicalCard>
            ))
          ) : (
            <View className="mb-4">
              <EmptyState icon="medkit-outline" message="No active prescriptions" />
            </View>
          )}
        </View>
      </ScrollView>

      {/* 2. FABs - differentiated actions with Zealthy accents */}
      <View
        className="absolute flex-row gap-6 items-end px-4 py-3 rounded-[28px]"
        style={{
          bottom: 24 + insets.bottom,
          right: 24,
          backgroundColor: "rgba(255,255,255,0.92)",
          shadowColor: "#06536c",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <TouchableOpacity onPress={() => setAppointmentModalVisible(true)} activeOpacity={0.85} className="items-center">
          <View
            className="w-[68px] h-[68px] rounded-[20px] items-center justify-center border-2"
            style={[
              fabShadow,
              {
                backgroundColor: colors.turquoise_surf[500],
                borderColor: "rgba(255,255,255,0.5)",
              },
            ]}
          >
            <Feather name="calendar" size={32} color="#fff" />
          </View>
          <Text className="text-turquoise_surf-500 font-black text-[11px] uppercase tracking-wider mt-2.5">Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openPrescriptionModal} activeOpacity={0.85} className="items-center">
          <View
            className="w-[68px] h-[68px] rounded-[20px] items-center justify-center border-2"
            style={[
              fabShadowAmber,
              {
                backgroundColor: colors.bright_amber[500],
                borderColor: "rgba(255,255,255,0.6)",
              },
            ]}
          >
            <Feather name="plus-circle" size={32} color="#fff" />
          </View>
          <Text className="text-cerulean-500 font-black text-[11px] uppercase tracking-wider mt-2.5">Medication</Text>
        </TouchableOpacity>
      </View>

      {/* Appointment Modal */}
      <Modal visible={appointmentModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-slate-900/40">
          <View className="bg-white rounded-t-[40px] p-8 pb-12" style={{ paddingBottom: insets.bottom + 32 }}>
            <Text className="text-2xl font-black text-cerulean-100 mb-8">Schedule Appointment</Text>
            <FormInput label="Provider" placeholder="Dr. Name" value={providerName} onChangeText={setProviderName} />
            <FormInput label="Date (YYYY-MM-DD)" placeholder="2026-02-22" value={firstAppointmentDate} onChangeText={setFirstAppointmentDate} />
            <View className="flex-row justify-end mt-6">
              <TouchableOpacity
                onPress={handleScheduleAppointment}
                disabled={!providerName.trim() || !firstAppointmentDate}
                className="items-center justify-center"
                style={{
                  backgroundColor: providerName.trim() && firstAppointmentDate ? colors.cerulean[500] : "#e2e8f0",
                  borderRadius: 100,
                  paddingHorizontal: 32,
                  paddingVertical: 18,
                }}
              >
                <Text
                  className="font-black uppercase tracking-widest"
                  style={{ color: providerName.trim() && firstAppointmentDate ? "#fff" : "#94a3b8" }}
                >
                  Confirm Schedule
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setAppointmentModalVisible(false)} className="mt-4 items-center">
              <Text className="text-slate-400 font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Prescription Modal */}
      <Modal visible={prescriptionModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-slate-900/40">
          <View className="bg-white rounded-t-[40px] max-h-[90%]" style={{ paddingBottom: insets.bottom + 32 }}>
            <View className="p-6 pb-2">
              <Text className="text-2xl font-black text-cerulean-100 mb-6">Add Medication</Text>
            </View>
            {medicationsLoading ? (
              <View className="p-8 items-center">
                <ActivityIndicator color={colors.cerulean[500]} size="large" />
              </View>
            ) : (
              <ScrollView
                className="px-6"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text className="text-cerulean-100 font-black text-[10px] uppercase tracking-[2px] mb-3">Medication</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  {medications.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => {
                        setSelectedMedicationId(m.id);
                        setSelectedDosage(m.available_dosages?.[0] ?? "");
                      }}
                      className="rounded-full"
                      style={{
                        backgroundColor: selectedMedicationId === m.id ? colors.bright_amber[500] : "#e2e8f0",
                        borderWidth: selectedMedicationId === m.id ? 0 : 2,
                        borderColor: colors.cerulean[400],
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 100,
                      }}
                    >
                      <Text
                        className="font-bold text-xs"
                        style={{ color: selectedMedicationId === m.id ? colors.cerulean[100] : "#64748b" }}
                      >
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedMedicationId && medications.find((m) => m.id === selectedMedicationId)?.available_dosages?.length ? (
                  <>
                    <Text className="text-cerulean-100 font-black text-[10px] uppercase tracking-[2px] mb-3">Dosage</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                      {medications.find((m) => m.id === selectedMedicationId)?.available_dosages?.map((d: string) => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setSelectedDosage(d)}
                          className="rounded-full"
                          style={{
                            backgroundColor: selectedDosage === d ? colors.bright_amber[500] : "#e2e8f0",
                            borderWidth: selectedDosage === d ? 0 : 2,
                            borderColor: colors.cerulean[400],
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 100,
                          }}
                        >
                          <Text className="font-bold text-xs" style={{ color: selectedDosage === d ? colors.cerulean[100] : "#64748b" }}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                ) : (
                  <FormInput label="Dosage" placeholder="e.g. 100mg" value={selectedDosage} onChangeText={setSelectedDosage} />
                )}

                <FormInput label="Start Date" placeholder="2026-02-22" value={startDate} onChangeText={setStartDate} />
                <FormInput label="Refill Schedule" placeholder="Daily, Weekly" value={frequency} onChangeText={setFrequency} />
                <FormInput label="Quantity" placeholder="30" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
                <FormInput label="Instructions (optional)" placeholder="Take with food" value={instructions} onChangeText={setInstructions} />

                <View className="flex-row justify-end mt-6">
                  <TouchableOpacity
                    onPress={handleAddPrescription}
                    disabled={!selectedMedicationId || !selectedDosage?.trim() || !startDate || prescriptionSubmitting}
                    activeOpacity={0.9}
                    className="items-center justify-center"
                    style={{
                      backgroundColor:
                        selectedMedicationId && selectedDosage?.trim() && startDate && !prescriptionSubmitting
                          ? colors.bright_amber[500]
                          : "#e2e8f0",
                      borderRadius: 100,
                      paddingHorizontal: 32,
                      paddingVertical: 18,
                    }}
                  >
                    {prescriptionSubmitting ? (
                      <ActivityIndicator color={colors.cerulean[100]} size="small" />
                    ) : (
                      <Text
                        className="font-black uppercase tracking-widest"
                        style={{
                          color:
                            selectedMedicationId && selectedDosage?.trim() && startDate ? colors.cerulean[100] : "#94a3b8",
                        }}
                      >
                        Add Prescription
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => setPrescriptionModalVisible(false)}
                  className="py-4 items-end mt-2"
                  activeOpacity={0.8}
                >
                  <Text className="text-cerulean-500 font-bold">Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
