import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/context/AuthProvider";

import { EmptyState } from "../../src/components/ui/EmptyState";

export default function PatientFullSchedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFullSchedule() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", user.id)
          .order("first_appointment_date", { ascending: true });

        if (error) throw error;

        // Filter for the next 90 days (3 months)
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
        const now = new Date();

        const filtered = data.filter((apt: any) => {
          const aptDate = new Date(apt.first_appointment_date);
          return aptDate >= now && aptDate <= ninetyDaysFromNow;
        });

        setAppointments(filtered);
      } catch (err) {
        console.error("Schedule Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFullSchedule();
  }, [user?.id]);

  if (loading) {
    return (
      <View className="flex-1 bg-papaya_whip-500 justify-center items-center">
        <ActivityIndicator color="#086788" size="large" />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-papaya_whip-500" 
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
    >
      <View className="px-6 py-4 flex-row items-center border-b border-cerulean-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-cerulean-500 font-black text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-black text-cerulean-500 tracking-tight">3-Month Schedule</Text>
      </View>

      <View className="px-6 mt-6">
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <View key={apt.id} className="bg-papaya_whip-900 p-5 rounded-2xl border border-papaya_whip-300 shadow-sm mb-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-cerulean-500 font-black text-lg">
                  {new Date(apt.first_appointment_date).toLocaleDateString(undefined, { 
                    weekday: 'short', month: 'short', day: 'numeric' 
                  })}
                </Text>
                <View className="bg-cerulean-100 px-2 py-1 rounded-md">
                  <Text className="text-cerulean-500 text-[10px] font-bold uppercase tracking-widest">{apt.status}</Text>
                </View>
              </View>
              
              <Text className="text-cerulean-400 font-bold">{apt.provider_name}</Text>
              
              {apt.repeat_schedule !== 'none' && (
                <View className="mt-3 pt-3 border-t border-papaya_whip-300 flex-row items-center">
                  <Text className="text-turquoise_surf-600 text-xs font-bold uppercase tracking-tighter italic">
                    🔄 Recurring {apt.repeat_schedule}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View className="mt-10">
            <EmptyState message="No appointments scheduled for the next 90 days." icon="calendar-outline" />
          </View>
        )}
      </View>
    </ScrollView>
  );
}