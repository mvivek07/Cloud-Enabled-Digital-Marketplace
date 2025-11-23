import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingCard } from "@/components/listings/ListingCard";
import { Heart, User, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Favorites() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [favoriteListings, setFavoriteListings] = useState<any[]>([]);
  const [favoriteFarmers, setFavoriteFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAndFavorites();
  }, []);

  const fetchUserAndFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setUserId(user.id);
      await Promise.all([fetchFavoriteListings(user.id), fetchFavoriteFarmers(user.id)]);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteListings = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*, listing:listings(*, farmer:farmers(farm_name, verified))")
        .eq("user_id", uid)
        .not("listing_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavoriteListings(data?.map(f => ({ ...f.listing, favoriteId: f.id })) || []);
    } catch (error) {
      console.error("Error fetching favorite listings:", error);
    }
  };

  const fetchFavoriteFarmers = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*, farmer:farmers(*, profiles(*))")
        .eq("user_id", uid)
        .not("farmer_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavoriteFarmers(data?.map(f => ({ ...f.farmer, favoriteId: f.id })) || []);
    } catch (error) {
      console.error("Error fetching favorite farmers:", error);
    }
  };

  const removeFavorite = async (favoriteId: string, type: "listing" | "farmer") => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      if (type === "listing") {
        setFavoriteListings(prev => prev.filter(f => f.favoriteId !== favoriteId));
      } else {
        setFavoriteFarmers(prev => prev.filter(f => f.favoriteId !== favoriteId));
      }

      toast.success("Removed from favorites");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove favorite");
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            My Favorites
          </h1>
          <p className="text-muted-foreground mt-1">Your bookmarked listings and farmers</p>
        </div>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="listings">
            <Package className="w-4 h-4 mr-2" />
            Listings ({favoriteListings.length})
          </TabsTrigger>
          <TabsTrigger value="farmers">
            <User className="w-4 h-4 mr-2" />
            Farmers ({favoriteFarmers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-6">
          {favoriteListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteListings.map((listing) => (
                <div key={listing.id} className="relative">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10 w-8 h-8"
                    onClick={() => removeFavorite(listing.favoriteId, "listing")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ListingCard
                    listing={listing}
                    onViewDetails={() => navigate("/listings")}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-2">No favorite listings yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse listings and click the heart icon to add favorites
                </p>
                <Button onClick={() => navigate("/listings")}>
                  Browse Listings
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="farmers" className="mt-6">
          {favoriteFarmers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteFarmers.map((farmer) => (
                <Card key={farmer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{farmer.farm_name}</CardTitle>
                          {farmer.profiles && (
                            <CardDescription>{farmer.profiles.full_name}</CardDescription>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFavorite(farmer.favoriteId, "farmer")}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {farmer.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{farmer.bio}</p>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/farmer/${farmer.id}`)}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <User className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-2">No favorite farmers yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Visit farmer profiles and add them to your favorites
                </p>
                <Button onClick={() => navigate("/listings")}>
                  Browse Farmers
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
