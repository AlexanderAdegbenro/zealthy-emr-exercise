import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { adminService } from "../../src/services/adminService";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
}

const cardShadow = {
  shadowColor: "#64748b",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 3,
};

const PatientCard = ({ patient, onPress }: { patient: Patient; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row rounded-3xl bg-white overflow-hidden border border-slate-100 mb-4 items-center"
    style={cardShadow}
  >
    <View className="w-1.5 bg-bright_amber-400 self-stretch" />
    <View className="flex-1 flex-row items-center py-5 px-5">
      <View className="w-12 h-12 rounded-2xl bg-cerulean-600 items-center justify-center mr-4 shadow-sm shadow-cerulean-200">
        <Ionicons name="person" size={20} color="#fff" />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-lg font-bold text-slate-900">
          {patient.last_name}, {patient.first_name}
        </Text>
        <View className="flex-row items-center">
          <View className="bg-slate-100 px-2.5 py-1 rounded-md">
            <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              ID {patient.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </View>
    </View>
  </TouchableOpacity>
);

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
        try {
          setIsLoading(true);
          const { data, error } = await adminService.getPatients();
          if (error) throw error;
          setPatients(data || []);
        } catch (error: any) {
          console.error("EMR Fetch Error:", error.message);
        } finally {
          setIsLoading(false);
        }
      }
    fetchPatients();
  }, []);

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <Stack.Screen 
        options={{ 
          title: "Mini-EMR Admin",
          headerStyle: { backgroundColor: "#f8fafc" }, // slate-50
          headerShadowVisible: false,
          headerTintColor: "#0f172a", // slate-900
          headerTitleStyle: { fontWeight: "700", fontSize: 16 },
        }} 
      />
      <View className="px-6 pt-2 pb-6">
        <View className="flex-row justify-between items-end">
          <View>
            <Text className="text-3xl font-black text-slate-900 tracking-tight">Directory</Text>
            <Text className="text-xs font-bold text-cerulean-600 uppercase tracking-wider mt-2">Active patients</Text>
            <View className="h-1.5 bg-bright_amber-400 rounded-full mt-3 w-12" />
          </View>
          <TouchableOpacity
            onPress={() => router.push("/admin/new-patient" as any)}
            activeOpacity={0.6}
            className="flex-row items-center gap-1 mb-2"
          >
            <Ionicons name="add" size={20} color="#0f172a" />
            <Text className="text-slate-900 font-bold text-base">New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#086788" />
          <Text className="text-slate-400 font-medium mt-4 text-sm">Loading records…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 10, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {patients.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-16 h-16 rounded-3xl bg-slate-100 items-center justify-center mb-4">
                <Ionicons name="people" size={32} color="#94a3b8" />
              </View>
              <Text className="text-lg font-bold text-slate-900">No patients yet</Text>
              <Text className="text-sm text-slate-500 mt-2 max-w-[200px] text-center leading-5">
                Tap <Text className="font-bold text-slate-900">+ New</Text> to add your first patient record.
              </Text>
            </View>
          ) : (
            patients.map((item) => (
              <PatientCard
                key={item.id}
                patient={item}
                onPress={() => router.push(`/admin/patient/${item.id}` as any)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
