import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { router } from 'expo-router';
import { zealthyAlert } from '@/src/utils/alerts';

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, pass: string) => {
    if (!email || !pass) {
      zealthyAlert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (error) {
      zealthyAlert("Login Failed", error.message);
      setIsLoading(false);
      return;
    }

    router.replace('/');
  };

  return { login, isLoading };
};
