
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Brain, Sparkles, Book, Users } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative overflow-hidden pt-16 pb-32">
      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-2xl p-2 bg-knowledge-100 animate-float">
                <Brain className="h-12 w-12 text-knowledge-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your AI-Powered
              <span className="text-knowledge-500 block">Knowledge Assistant</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Transform the way you learn with our advanced AI system. Get personalized insights,
              summaries, and recommendations tailored to your educational journey.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Get Started
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/about">Learn more</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-lg grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="glass-card rounded-2xl px-8 py-10 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-x-3">
                    {feature.icon}
                    <h3 className="text-lg font-semibold leading-7 text-gray-900">
                      {feature.name}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const features = [
  {
    name: "Smart Content Retrieval",
    description: "Access and summarize academic resources with state-of-the-art AI technology.",
    icon: <Book className="h-6 w-6 text-knowledge-500" />,
  },
  {
    name: "Personalized Learning",
    description: "Get tailored recommendations based on your unique learning patterns and preferences.",
    icon: <Brain className="h-6 w-6 text-knowledge-500" />,
  },
  {
    name: "Collaborative Learning",
    description: "Connect with peers and experts to enhance your educational experience.",
    icon: <Users className="h-6 w-6 text-knowledge-500" />,
  },
];

export default Hero;
