import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ListingCard } from "@/components/listings/ListingCard";
import { User, MapPin, Star, Package, CheckCircle, Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function FarmerProfile() {
  const { farmerId } = useParams<{ farmerId: string }>();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (farmerId) {
      fetchFarmerProfile();
      fetchListings();
      fetchRatings();
      fetchStats();
      if (currentUserId) {
        checkFavoriteStatus();
      }
    }
  }, [farmerId, currentUserId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchFarmerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*, profiles(*)")
        .eq("id", farmerId)
        .single();

      if (error) throw error;
      setFarmer(data);
    } catch (error: any) {
      toast.error("Failed to load farmer profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from("ratings")
        .select("*, profiles(*)")
        .eq("rated_user_id", farmerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total completed orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, listing:listings!inner(farmer_id)")
        .eq("listing.farmer_id", farmerId)
        .eq("status", "completed");

      // Get ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("rating")
        .eq("rated_user_id", farmerId);

      const totalOrders = ordersData?.length || 0;
      const totalReviews = ratingsData?.length || 0;
      const averageRating = totalReviews > 0
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      setStats({ totalOrders, averageRating, totalReviews });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("farmer_id", farmerId)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUserId) {
      toast.error("Please log in to add favorites");
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", currentUserId)
          .eq("farmer_id", farmerId);
        
        toast.success("Removed from favorites");
        setIsFavorite(false);
      } else {
        await supabase
          .from("favorites")
          .insert({
            user_id: currentUserId,
            farmer_id: farmerId,
          });
        
        toast.success("Added to favorites");
        setIsFavorite(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (!farmer) {
    return <div className="container mx-auto px-4 py-8 text-center">Farmer not found</div>;
  }

  const availableListings = listings.filter(l => l.status === "available");

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Farmer Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-3xl">{farmer.farm_name}</CardTitle>
                  {farmer.verified && (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  )}
                </div>
                {farmer.profiles && (
                  <CardDescription className="text-base mt-1">
                    {farmer.profiles.full_name}
                  </CardDescription>
                )}
                {farmer.location_address && (
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{farmer.location_address}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant={isFavorite ? "default" : "outline"}
              onClick={toggleFavorite}
              className="gap-2"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
              {isFavorite ? "Favorited" : "Add to Favorites"}
            </Button>
          </div>
        </CardHeader>
        {farmer.bio && (
          <CardContent>
            <p className="text-muted-foreground">{farmer.bio}</p>
          </CardContent>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-3xl font-bold text-foreground">{stats.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Orders Fulfilled</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="w-8 h-8 mx-auto mb-2 text-amber-500 fill-amber-500" />
              <div className="text-3xl font-bold text-foreground">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="w-8 h-8 mx-auto mb-2 text-accent" />
              <div className="text-3xl font-bold text-foreground">{availableListings.length}</div>
              <div className="text-sm text-muted-foreground">Available Listings</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Available Produce</CardTitle>
          <CardDescription>Current listings from this farmer</CardDescription>
        </CardHeader>
        <CardContent>
          {availableListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={{ ...listing, farmer }}
                  onViewDetails={() => navigate("/listings")}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No listings available at the moment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Reviews ({stats.totalReviews})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratings.length > 0 ? (
            ratings.map((rating) => (
              <div key={rating.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold">{rating.profiles?.full_name || "Anonymous"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rating.rating ? "fill-amber-500 text-amber-500" : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rating.review && (
                  <p className="text-sm text-muted-foreground ml-10">{rating.review}</p>
                )}
                <div className="text-xs text-muted-foreground mt-2 ml-10">
                  {format(new Date(rating.created_at), "MMM dd, yyyy")}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No reviews yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
