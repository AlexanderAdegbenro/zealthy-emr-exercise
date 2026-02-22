import { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { router } from 'expo-router';
import { zealthyAlert } from '@/src/utils/alerts';

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, pass: string) => {
    if (!email || !pass) {
      zealthyAlert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    setError(null);
    router.replace('/');
  };

  return { login, isLoading, error };
};
