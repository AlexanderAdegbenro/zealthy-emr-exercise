import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { adminService } from "@/src/services/adminService";
import { MedicalCard } from "@/src/components/ui/MedicalCard";
import colors from "@/src/theme/colors.js";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
}

const PatientCard = ({ patient, onPress }: { patient: Patient; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.92 : 1 },
    ]}
  >
    <MedicalCard
      className="mb-5 overflow-hidden flex-row items-center rounded-2xl px-5 py-4 border border-papaya_whip-800"
      style={{
        shadowColor: colors.cerulean[100],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="w-1.5 bg-bright_amber-400 self-stretch rounded-l-2xl mr-4" />
      <View className="flex-1 flex-row items-center">
        <View className="w-12 h-12 rounded-2xl bg-cerulean-600 items-center justify-center mr-4 shadow-sm flex-shrink-0">
          <Ionicons name="person" size={20} color="#fff" />
        </View>
        <View className="flex-1 gap-1 min-w-0">
          <Text className="text-lg font-bold text-cerulean-100" numberOfLines={1}>
            {patient.last_name}, {patient.first_name}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-slate-400 font-bold text-[10px] tracking-[1.5px] uppercase">
              ID {patient.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
        <View className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-papaya_whip-500 items-center justify-center flex-shrink-0 ml-2">
          <Ionicons name="chevron-forward" size={20} color={colors.cerulean[400]} />
        </View>
      </View>
    </MedicalCard>
  </Pressable>
);

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const { data, error } = await adminService.getPatients();
      if (error) throw error;
      setPatients(data || []);
    } catch {
      // fetch failed; patients stay []
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPatients();
  }, [fetchPatients]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, [fetchPatients]);

  return (
    <View className="flex-1 bg-papaya_whip-900" style={{ paddingTop: insets.top }}>
      <Stack.Screen
        options={{
          title: "Mini-EMR Admin",
          headerStyle: { backgroundColor: "#fffcf6" },
          headerShadowVisible: false,
          headerTintColor: colors.cerulean[600],
          headerTitleStyle: { fontWeight: "700", fontSize: 16 },
          headerRight: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ minWidth: 44, minHeight: 44, justifyContent: "center", alignItems: "center" }}
            >
              <Ionicons name="close" size={24} color={colors.cerulean[600]} />
            </Pressable>
          ),
        }}
      />
      <View className="px-6 pt-2 pb-6">
        <View className="flex-row justify-between items-end">
          <View>
            <Text className="text-3xl font-black text-cerulean-100 tracking-tight">Directory</Text>
            <Text className="text-xs font-bold text-cerulean-600 uppercase tracking-wider mt-2">Active patients</Text>
            <View className="h-1.5 bg-bright_amber-400 rounded-full mt-3 w-12" />
          </View>
          <Pressable
            onPress={() => router.push("/admin/new-patient" as any)}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
                minHeight: 44,
                justifyContent: "center",
                paddingVertical: 10,
                paddingHorizontal: 16,
                backgroundColor: colors.cerulean[500],
                borderRadius: 16,
              },
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text className="text-white font-bold text-base">New</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.cerulean[500]} />
          <Text className="text-cerulean-500 font-medium mt-4 text-sm">Loading records…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: 10, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          showsVerticalScrollIndicator
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.cerulean[500]]}
              tintColor={colors.cerulean[500]}
            />
          }
        >
          {patients.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-16 h-16 rounded-3xl bg-papaya_whip-400 items-center justify-center mb-4">
                <Ionicons name="people" size={32} color={colors.cerulean[500]} />
              </View>
              <Text className="text-lg font-bold text-cerulean-100">No patients yet</Text>
              <Text className="text-sm text-cerulean-500 mt-2 max-w-[200px] text-center leading-5">
                Tap <Text className="font-bold text-cerulean-100">+ New</Text> to add your first patient record.
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
