import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Star, Package, CheckCircle, User, Heart } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    category: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    harvest_date: string | null;
    pickup_location: string | null;
    photos: string[] | null;
    status: string | null;
    cosmetic_notes: string | null;
    created_at: string;
    farmer_id: string;
    farmer?: {
      farm_name: string;
      verified: boolean | null;
    } | null;
  };
  onViewDetails?: (id: string) => void;
  showActions?: boolean;
}

export const ListingCard = ({ listing, onViewDetails, showActions = true }: ListingCardProps) => {
  const navigate = useNavigate();
  const totalPrice = listing.quantity * listing.price_per_unit;
  const mainPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : "/placeholder.svg";
  const [farmerRating, setFarmerRating] = useState<{ avg: number; count: number } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchCurrentUser();
    fetchFarmerRating();
  }, [listing.farmer_id]);

  useEffect(() => {
    if (currentUserId) {
      checkFavoriteStatus();
    }
  }, [currentUserId, listing.id]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchFarmerRating = async () => {
    try {
      const { data } = await supabase
        .from("ratings")
        .select("rating")
        .eq("rated_user_id", listing.farmer_id);

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setFarmerRating({ avg, count: data.length });
      }
    } catch (error) {
      console.error("Error fetching farmer rating:", error);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("listing_id", listing.id)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
          .eq("listing_id", listing.id);
        
        toast.success("Removed from favorites");
        setIsFavorite(false);
      } else {
        await supabase
          .from("favorites")
          .insert({
            user_id: currentUserId,
            listing_id: listing.id,
          });
        
        toast.success("Added to favorites");
        setIsFavorite(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={mainPhoto}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-3 right-3 bg-earth text-earth-foreground">
          {listing.category}
        </Badge>
        {listing.status === "available" && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
            Available
          </Badge>
        )}
        {listing.status === "out_of_stock" && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
            Out of Stock
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 right-3 bg-background/80 hover:bg-background"
          onClick={toggleFavorite}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-primary text-primary" : "text-foreground"}`} />
        </Button>
      </div>

      <CardHeader className="pb-3">
        <h3 className="text-xl font-bold text-foreground line-clamp-1">{listing.title}</h3>
        
        {/* Seller Info - More Prominent */}
        {listing.farmer && (
          <div 
            className="bg-muted/50 rounded-lg p-3 mt-2 space-y-2 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => navigate(`/farmer/${listing.farmer_id}`)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{listing.farmer.farm_name}</span>
                  {listing.farmer.verified && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
                {farmerRating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-medium text-foreground">
                      {farmerRating.avg.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({farmerRating.count} {farmerRating.count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="text-2xl font-bold text-primary">
            ${listing.price_per_unit.toFixed(2)}
            <span className="text-sm text-muted-foreground font-normal">/{listing.unit}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <Package className="w-4 h-4 inline mr-1" />
            {listing.quantity} {listing.unit}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        {listing.harvest_date && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            Harvested: {format(new Date(listing.harvest_date), "MMM dd, yyyy")}
          </div>
        )}
        
        {listing.pickup_location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            {listing.pickup_location}
          </div>
        )}

        {listing.cosmetic_notes && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            Note: {listing.cosmetic_notes}
          </p>
        )}

        <div className="pt-2 border-t border-border mt-3">
          <div className="text-sm font-semibold text-foreground">
            Total Available: ${totalPrice.toFixed(2)}
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-0">
          <Button 
            onClick={() => onViewDetails?.(listing.id)}
            className="w-full"
            variant="default"
          >
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
