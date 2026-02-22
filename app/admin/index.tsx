import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { adminService } from "@/src/services/adminService";
import { MedicalCard } from "@/src/components/ui/MedicalCard";
import colors from "@/src/theme/colors.js";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  return (
    <View className="flex-1 bg-papaya_whip-900">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 1. REFACTORED COMMAND HEADER */}
      <View
        className="bg-cerulean-600 rounded-b-[48px] px-8 pb-10"
        style={[styles.headerShadow, { paddingTop: insets.top + 20 }]}
      >
        {/* TOP ROW: Title & Subtitle (Left) + Close Button (Right) */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-4">
            <Text className="text-white text-4xl font-black tracking-tighter">
              Directory
            </Text>
            <Text className="text-white text-lg font-bold opacity-90 mt-1">
              {patients.length} Registered Patients
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center"
            accessibilityLabel="Close directory"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

      </View>

      {/* 2. PATIENT LIST */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.cerulean[600]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={colors.cerulean[600]} 
                colors={[colors.cerulean[600]]}
            />
          }
        >
          {patients.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-slate-400 font-bold">No records found.</Text>
            </View>
          ) : (
            patients.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => router.push(`/admin/patient/${item.id}` as any)}
                activeOpacity={0.9}
              >
                <MedicalCard className="mb-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-slate-400 font-black text-[10px] tracking-widest uppercase mb-1">
                        Patient Name
                      </Text>
                      <Text className="text-2xl font-black text-slate-900">
                        {item.last_name}, {item.first_name}
                      </Text>
                      <Text className="text-cerulean-600 font-bold mt-1 uppercase text-[10px] tracking-widest">
                        ID: {item.id.slice(0, 8).toUpperCase()}
                      </Text>
                    </View>
                    <View className="bg-cerulean-50 p-3 rounded-2xl">
                      <Feather name="chevron-right" size={20} color={colors.cerulean[600]} />
                    </View>
                  </View>
                </MedicalCard>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB: New Patient - bottom right */}
      <TouchableOpacity
        onPress={() => router.push("/admin/new-patient" as any)}
        activeOpacity={0.85}
        accessibilityLabel="Add new patient"
        accessibilityRole="button"
        className="absolute flex-row items-center justify-center rounded-full"
        style={{
          position: "absolute",
          right: 24,
          bottom: 24 + insets.bottom,
          backgroundColor: colors.bright_amber[500],
          borderRadius: 100,
          paddingHorizontal: 20,
          paddingVertical: 18,
          shadowColor: colors.bright_amber[600],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <View className="flex-row items-center" style={{ minWidth: 140, justifyContent: "space-between" }}>
          <Text
            className="font-black uppercase tracking-wider"
            style={{ color: colors.cerulean[100], fontSize: 12 }}
            numberOfLines={1}
          >
            New Patient
          </Text>
          <Feather name="plus" size={18} color={colors.cerulean[100]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerShadow: {
    shadowColor: colors.cerulean[900],
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  yellowButtonShadow: {
    shadowColor: colors.bright_amber[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  }
});