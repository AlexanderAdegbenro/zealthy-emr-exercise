import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";

export const usePatients = () => {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_admin", false); // Only get patients, not admins

      if (error) throw error;
      return data || [];
    },
  });
};
