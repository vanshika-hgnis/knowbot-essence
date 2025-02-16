import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import CreateNotebookDialog from "@/components/notebooks/CreateNotebookDialog";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useUsername } from '@/hooks/useUsername';
import type { Notebook } from "@/types/notebook";

const Notebooks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { username, isLoading: isUsernameLoading } = useUsername();

  const { data: notebooks, isLoading: isNotebooksLoading } = useQuery({
    queryKey: ['notebooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .order('updated_at', { ascending: false });
  
      if (error) throw error;
      return data as Notebook[];
    },
    enabled: !!user,
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const isLoading = isUsernameLoading || isNotebooksLoading;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            {isUsernameLoading ? (
              <span className="animate-pulse bg-muted rounded h-8 w-32 inline-block" />
            ) : (
              `${username?.firstName}'s Notebooks`
            )}
          </h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2" />
            New Notebook
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-[200px] animate-pulse bg-muted" />
            ))}
          </div>
        ) : notebooks?.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-muted-foreground mb-4">No notebooks yet</h3>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create your first notebook</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notebooks?.map((notebook) => (
              <Card
                key={notebook.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/notebooks/${notebook.id}`)}
              >
                <CardHeader>
                  <CardTitle>{notebook.title}</CardTitle>
                  <CardDescription>{notebook.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">
                    Last updated {format(new Date(notebook.updated_at), 'MMM d, yyyy')}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <CreateNotebookDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </Layout>
  );
};

export default Notebooks;