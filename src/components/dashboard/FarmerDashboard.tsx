import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListingForm } from "@/components/listings/ListingForm";
import { ListingCard } from "@/components/listings/ListingCard";
import { Plus, Sprout, Package, TrendingUp } from "lucide-react";

interface FarmerDashboardProps {
  userId?: string;
}

const FarmerDashboard = ({ userId }: FarmerDashboardProps) => {
  const [stats, setStats] = useState({
    totalListings: 0,
    activeOrders: 0,
    totalRevenue: 0,
  });
  const [showListingForm, setShowListingForm] = useState(false);
  const [farmerId, setFarmerId] = useState<string>("");
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      fetchStats();
      fetchListings();
    }
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Get farmer profile
      const { data: farmerData } = await supabase
        .from("farmers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!farmerData) return;
      setFarmerId(farmerData.id);

      // Get listings count
      const { count: listingsCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("farmer_id", farmerData.id);

      setStats(prev => ({ ...prev, totalListings: listingsCount || 0 }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchListings = async () => {
    try {
      const { data: farmerData } = await supabase
        .from("farmers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!farmerData) return;

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("farmer_id", farmerData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const handleListingSuccess = () => {
    setShowListingForm(false);
    fetchStats();
    fetchListings();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Farmer Dashboard</h2>
          <p className="text-muted-foreground mt-1">Manage your produce and orders</p>
        </div>
        <Button onClick={() => setShowListingForm(true)} className="bg-gradient-earth shadow-accent">
          <Plus className="w-4 h-4 mr-2" />
          New Listing
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<Package className="w-6 h-6" />}
          title="Active Listings"
          value={stats.totalListings}
          color="primary"
        />
        <StatCard
          icon={<Sprout className="w-6 h-6" />}
          title="Pending Orders"
          value={stats.activeOrders}
          color="accent"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          color="secondary"
        />
      </div>

      {/* Recent Listings */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Your Listings</CardTitle>
          <CardDescription>Manage your produce offerings</CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showActions={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No listings yet</p>
              <p className="text-sm">Create your first listing to start selling!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Listing Dialog */}
      <Dialog open={showListingForm} onOpenChange={setShowListingForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Listing</DialogTitle>
          </DialogHeader>
          <ListingForm farmerId={farmerId} onSuccess={handleListingSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: string | number; color: string }) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    secondary: "bg-secondary/10 text-secondary",
  };

  return (
    <Card className="shadow-soft hover:shadow-medium transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmerDashboard;