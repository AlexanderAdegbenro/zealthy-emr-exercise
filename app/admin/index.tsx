import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Animated } from "react-native";
import { useRouter, Stack, useLocalSearchParams, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { adminService } from "@/src/services/adminService";
import { MedicalCard } from "@/src/components/ui/MedicalCard";
import colors from "@/src/theme/colors.js";

import { haptics } from "@/src/utils/haptics";
import { platformShadow } from "@/src/utils/shadows";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

/** Row with highlight animation when it's the newly added patient (from new-patient flow). */
const AnimatedPatientRow = ({ 
  item, 
  isNew, 
  onPress, 
  onLayout 
}: { 
  item: Patient, 
  isNew: boolean, 
  onPress: () => void,
  onLayout?: (event: any) => void
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 1500, useNativeDriver: false })
      ]).start();
    }
  }, [isNew, fadeAnim]);

  const backgroundColor = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.cerulean[100]] 
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={{ backgroundColor, borderRadius: 24, marginBottom: 16 }} onLayout={onLayout}>
        <MedicalCard>
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
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { newPatientId } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

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
    haptics.selection();
    setRefreshing(true);
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => { fetchPatients(); }, [fetchPatients, newPatientId]);

  return (
    <View className="flex-1 bg-papaya_whip-900">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View
        className="bg-cerulean-600 rounded-b-[48px] px-8 pb-10"
        style={[headerShadow, { paddingTop: insets.top + 20 }]}
      >
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
            onPress={() => {
              haptics.medium();
              router.back();
            }}
            className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center"
            accessibilityLabel="Close directory"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.cerulean[600]} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={colors.cerulean[600]} 
                colors={Platform.OS === "android" ? [colors.cerulean[600]] : undefined}
            />
          }
        >
          {patients.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-slate-400 font-bold">No records found.</Text>
            </View>
          ) : (
            patients.map((item) => {
              const isNew = item.id === newPatientId;
              return (
                <AnimatedPatientRow 
                  key={item.id} 
                  item={item} 
                  isNew={isNew}
                  onPress={() => {
                    haptics.light();
                    router.push(`/admin/patient/${item.id}` as any);
                  }}
                  onLayout={(event) => {
                    if (isNew) {
                      const { y } = event.nativeEvent.layout;
                      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 40), animated: true }); // 40px padding above card
                    }
                  }}
                />
              );
            })
          )}
        </ScrollView>
      )}

      <Link href="/admin/new-patient" asChild>
        <TouchableOpacity
          onPress={() => haptics.medium()}
          activeOpacity={0.85}
          accessibilityLabel="Add new patient"
          accessibilityRole="button"
          className="absolute flex-row items-center justify-center rounded-full"
          style={[{
            position: "absolute",
            right: 24,
            bottom: 24 + insets.bottom,
            backgroundColor: colors.bright_amber[500],
            borderRadius: 100,
            paddingHorizontal: 20,
            paddingVertical: 18,
          }, fabShadow]}
        >
          <View className="flex-row items-center" style={{ minWidth: 140, justifyContent: "space-between" }}>
            <Text
              className="font-black uppercase tracking-wider"
              style={{ color: colors.cerulean[500], fontSize: 12 }}
              numberOfLines={1}
            >
              New Patient
            </Text>
            <Feather name="plus" size={18} color={colors.cerulean[500]} />
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const headerShadow = platformShadow({ color: colors.cerulean[900], offsetY: 16, blur: 24, opacity: 0.2, elevation: 20 });
const fabShadow = platformShadow({ color: colors.bright_amber[600], offsetY: 8, blur: 12, opacity: 0.4, elevation: 10 });