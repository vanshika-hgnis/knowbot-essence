import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  full_name: string;
  firstName: string;
}

export const useUsername = () => {
  const [username, setUsername] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (data) {
            const firstName = data.full_name.split(' ')[0];
            setUsername({ ...data, firstName });
          }
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  return { username, isLoading };
};
