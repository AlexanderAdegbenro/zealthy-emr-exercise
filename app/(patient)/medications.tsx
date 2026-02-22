import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/context/AuthProvider";

import { PrescriptionCard } from "../../src/components/PrescriptionCard";
import { EmptyState } from "../../src/components/ui/EmptyState";

export default function PatientMedicationsSchedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRefills() {
      if (!user?.id) return;
      try {
        setLoading(true);
        // Fetching prescriptions and joining the medication name
        const { data, error } = await supabase
          .from("prescriptions")
          .select("*, medications(name)")
          .eq("patient_id", user.id)
          .order("refill_date", { ascending: true });

        if (error) throw error;

        // Filter for the next 90 days (3 months)
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
        const now = new Date();

        const filtered = data.filter((rx: any) => {
          if (!rx.refill_date) return false;
          const refillDate = new Date(rx.refill_date);
          return refillDate >= now && refillDate <= ninetyDaysFromNow;
        });

        setPrescriptions(filtered);
      } catch (err) {
        console.error("Refills Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRefills();
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
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-cerulean-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-cerulean-500 font-black text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-black text-cerulean-500 tracking-tight">3-Month Refills</Text>
      </View>

      {/* List */}
      <View className="px-6 mt-6">
        {prescriptions.length > 0 ? (
          prescriptions.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              medicationName={rx.medications?.name || "Unknown Medication"}
              dosage={rx.dosage}
              quantity={rx.quantity}
              refillDate={rx.refill_date}
              refillSchedule={rx.refill_schedule}
            />
          ))
        ) : (
          <View className="mt-10">
            <EmptyState message="No active prescriptions" icon="medkit-outline" />
          </View>
        )}
      </View>
    </ScrollView>
  );
}