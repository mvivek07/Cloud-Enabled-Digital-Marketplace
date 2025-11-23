import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/ListingCard";
import { OrderCard } from "@/components/orders/OrderCard";
import { Search, ShoppingCart, Package, TrendingDown } from "lucide-react";

interface BuyerDashboardProps {
  userId?: string;
}

const BuyerDashboard = ({ userId }: BuyerDashboardProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalOrders: 0,
    foodSaved: 0,
  });
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      fetchStats();
      fetchListings();
      fetchOrders();
    }
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Get buyer profile
      const { data: buyerData } = await supabase
        .from("buyers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!buyerData) return;

      // Get orders count
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", buyerData.id);

      const { count: activeCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", buyerData.id)
        .in("status", ["pending", "confirmed"]);

      setStats(prev => ({ 
        ...prev, 
        totalOrders: ordersCount || 0,
        activeOrders: activeCount || 0
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: buyerData } = await supabase
        .from("buyers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!buyerData) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*, listing:listings(*)")
        .eq("buyer_id", buyerData.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*, farmer:farmers(farm_name, verified)")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Buyer Dashboard</h2>
          <p className="text-muted-foreground mt-1">Browse fresh local produce</p>
        </div>
        <Button onClick={() => navigate("/listings")} className="bg-gradient-earth shadow-accent">
          <Search className="w-4 h-4 mr-2" />
          Browse Listings
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Active Orders"
          value={stats.activeOrders}
          color="primary"
        />
        <StatCard
          icon={<Package className="w-6 h-6" />}
          title="Total Orders"
          value={stats.totalOrders}
          color="accent"
        />
        <StatCard
          icon={<TrendingDown className="w-6 h-6" />}
          title="Food Saved"
          value={`${stats.foodSaved} kg`}
          color="secondary"
        />
      </div>

      {/* My Orders */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>Track your recent purchases</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} type="buyer" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No orders yet</p>
              <p className="text-sm">Start browsing to place your first order!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Produce */}
      <Card className="shadow-medium">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Available Produce</CardTitle>
            <CardDescription>Fresh listings from local farmers</CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate("/listings")}>
            <Search className="w-4 h-4 mr-2" />
            Browse All
          </Button>
        </CardHeader>
        <CardContent>
          {listings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onViewDetails={() => navigate("/listings")}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No produce available</p>
              <p className="text-sm">Check back soon for fresh listings!</p>
            </div>
          )}
        </CardContent>
      </Card>
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

export default BuyerDashboard;