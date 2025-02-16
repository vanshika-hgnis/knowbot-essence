
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotebookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notebook, isLoading } = useQuery({
    queryKey: ['notebook', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/notebooks')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Notebooks
        </Button>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 bg-muted rounded" />
            <div className="h-4 w-1/4 bg-muted rounded" />
          </div>
        ) : notebook ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{notebook.title}</h1>
              {notebook.description && (
                <p className="text-muted-foreground">{notebook.description}</p>
              )}
            </div>
            
            {/* Chat interface will be added here in Phase 2 */}
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">File upload and chat interface coming soon!</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-muted-foreground">Notebook not found</h3>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotebookDetail;
