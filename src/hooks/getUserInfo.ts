// src/hooks/getUserInfo.ts
import { supabase } from "@/integrations/supabase/client";

export async function getUserInfo() {
    const { data, error } = await supabase.auth.getUser(); // Adjust this based on your auth setup
    if (error) {
        console.error("Error fetching user:", error);
        return null;
    }
    return { userId: data?.user?.id };
}
