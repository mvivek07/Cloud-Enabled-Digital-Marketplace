import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sprout, Users, TrendingUp, Leaf, ShoppingBag, Truck } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-earth opacity-10" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Connecting Local Agriculture</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Farm Fresh to Your Business
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              HarvestLink bridges the gap between local farmers and businesses, reducing food waste while supporting sustainable agriculture.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button asChild size="lg" className="bg-gradient-earth shadow-accent hover:shadow-large transition-all">
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary hover:bg-primary/5">
                <Link to="/auth">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How HarvestLink Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent, and built for the agricultural community
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sprout className="w-8 h-8" />}
              title="For Farmers"
              description="List your produce, set prices, and connect with buyers directly. Pool resources with other farmers for bulk orders."
            />
            <FeatureCard
              icon={<ShoppingBag className="w-8 h-8" />}
              title="For Businesses"
              description="Source fresh, local produce at competitive prices. Support your community while reducing your carbon footprint."
            />
            <FeatureCard
              icon={<Truck className="w-8 h-8" />}
              title="Smart Logistics"
              description="Efficient delivery routing and scheduling. Real-time tracking from farm to your door."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatCard icon={<Users />} value="500+" label="Active Farmers" />
            <StatCard icon={<TrendingUp />} value="10k+" label="Successful Orders" />
            <StatCard icon={<Leaf />} value="50 tons" label="Food Waste Prevented" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-earth">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join HarvestLink today and be part of the sustainable agriculture revolution.
          </p>
          <Button asChild size="lg" variant="secondary" className="shadow-large">
            <Link to="/auth">Join Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="p-8 bg-gradient-subtle rounded-2xl shadow-soft hover:shadow-medium transition-all border border-border group">
      <div className="w-16 h-16 bg-gradient-earth rounded-xl flex items-center justify-center text-primary-foreground mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => {
  return (
    <div className="space-y-3">
      <div className="w-12 h-12 mx-auto text-primary">{icon}</div>
      <div className="text-4xl font-bold text-primary">{value}</div>
      <div className="text-lg text-muted-foreground">{label}</div>
    </div>
  );
};

export default Index;