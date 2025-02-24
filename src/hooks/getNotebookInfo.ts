import { supabase } from "@/integrations/supabase/client";

export async function getNotebookInfo() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("User not logged in");

    const userId = session.user.id;

    // Fetch all notebooks created by the user
    const { data: notebooks, error } = await supabase
        .from("notebooks")
        .select("id, title")
        .eq("user_id", userId);

    if (error) throw new Error("Error fetching notebooks");

    return { userId, notebooks };
}
