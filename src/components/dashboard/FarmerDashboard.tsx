import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ListingForm } from "@/components/listings/ListingForm";
import { ListingCard } from "@/components/listings/ListingCard";
import { OrderCard } from "@/components/orders/OrderCard";
import { Plus, Sprout, Package, TrendingUp, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [orders, setOrders] = useState<any[]>([]);
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchStats();
      fetchListings();
      fetchOrders();
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

      // Get active orders for this farmer's listings
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*, listing:listings!inner(*)")
        .eq("listing.farmer_id", farmerData.id)
        .in("status", ["pending", "confirmed"]);

      setStats(prev => ({ 
        ...prev, 
        totalListings: listingsCount || 0,
        activeOrders: ordersData?.length || 0
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: farmerData } = await supabase
        .from("farmers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!farmerData) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*, listing:listings!inner(*)")
        .eq("listing.farmer_id", farmerData.id)
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
    fetchOrders();
  };

  const handleDeleteListing = async () => {
    if (!deleteListingId) return;

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", deleteListingId);

      if (error) throw error;

      toast.success("Listing deleted successfully");
      fetchStats();
      fetchListings();
    } catch (error) {
      toast.error("Failed to delete listing");
    } finally {
      setDeleteListingId(null);
    }
  };

  const handleOrderUpdate = () => {
    fetchStats();
    fetchOrders();
  };

  const toggleStockStatus = async (listingId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "available" ? "out_of_stock" : "available";
      
      const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", listingId);

      if (error) throw error;

      toast.success(newStatus === "out_of_stock" ? "Marked as out of stock" : "Marked as available");
      fetchListings();
      fetchStats();
    } catch (error) {
      toast.error("Failed to update stock status");
    }
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

      {/* Incoming Orders */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Incoming Orders</CardTitle>
          <CardDescription>Orders from buyers</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} type="farmer" onUpdate={handleOrderUpdate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sprout className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No orders yet</p>
              <p className="text-sm">Orders will appear here when buyers place them</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                <div key={listing.id} className="space-y-2">
                  <div className="relative group">
                    <ListingCard
                      listing={listing}
                      showActions={false}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => setDeleteListingId(listing.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor={`stock-${listing.id}`} className="text-sm font-medium cursor-pointer">
                        {listing.status === "out_of_stock" ? "Out of Stock" : "In Stock"}
                      </Label>
                    </div>
                    <Switch
                      id={`stock-${listing.id}`}
                      checked={listing.status === "available"}
                      onCheckedChange={() => toggleStockStatus(listing.id, listing.status)}
                    />
                  </div>
                </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteListingId} onOpenChange={() => setDeleteListingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteListing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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