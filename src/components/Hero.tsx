
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
const Hero = () => {

const [username,setUsername] = useState(null);

useEffect(() => {
  const getUser = async() => {
    const {data: {user}} = await supabase.auth.getUser();
    if(user){
      const {data} = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id',user.id)
      .single();

      if(data){
        const firstName = data.full_name.split(' ')[0]
        setUsername({...data,firstName})
      }
    }
  };
  getUser();
},[])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      { username && (
        <h1 className="text-4xl mb-4"> Hi {username.firstName}</h1>
      )
      }
      <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
        Welcome to KnowledgeHub
      </h2>
      <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
        Your AI-powered learning companion. Create notebooks, upload your resources, and chat with an AI that understands your content.
      </p>
      <div className="mt-8">
        <Button size="lg" asChild>
          <Link to="/notebooks">Get Started</Link>
        </Button>
      </div>
    </div>
  );
};

export default Hero;
