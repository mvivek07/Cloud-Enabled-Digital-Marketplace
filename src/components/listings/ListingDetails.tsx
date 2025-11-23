import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderForm } from "@/components/orders/OrderForm";
import { MapPin, Calendar, Package, Star, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ListingDetailsProps {
  listingId: string;
  currentUserId: string;
}

export const ListingDetails = ({ listingId, currentUserId }: ListingDetailsProps) => {
  const [listing, setListing] = useState<any>(null);
  const [farmer, setFarmer] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [buyerId, setBuyerId] = useState<string>("");

  useEffect(() => {
    fetchListingDetails();
    fetchRatings();
    fetchBuyerId();
  }, [listingId]);

  const fetchBuyerId = async () => {
    try {
      const { data } = await supabase
        .from("buyers")
        .select("id")
        .eq("user_id", currentUserId)
        .single();
      
      if (data) setBuyerId(data.id);
    } catch (error) {
      console.error("Error fetching buyer ID:", error);
    }
  };

  const fetchListingDetails = async () => {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

      if (listingError) throw listingError;
      setListing(listingData);

      // Fetch farmer info
      const { data: farmerData } = await supabase
        .from("farmers")
        .select("*, profiles(*)")
        .eq("id", listingData.farmer_id)
        .single();

      setFarmer(farmerData);
    } catch (error: any) {
      toast.error("Failed to load listing details");
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      // First get the listing to find the farmer_id
      const { data: listingData } = await supabase
        .from("listings")
        .select("farmer_id")
        .eq("id", listingId)
        .single();

      if (!listingData) return;

      // Get ratings for this specific farmer
      const { data } = await supabase
        .from("ratings")
        .select("*, profiles(*), order:orders!inner(listing_id, listing:listings!inner(farmer_id))")
        .eq("rated_user_id", listingData.farmer_id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setRatings(data);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!listing) {
    return <div className="text-center py-12">Listing not found</div>;
  }

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Photo Gallery */}
      <div className="grid md:grid-cols-2 gap-4">
        {listing.photos && listing.photos.length > 0 ? (
          listing.photos.map((photo: string, index: number) => (
            <img
              key={index}
              src={photo}
              alt={`${listing.title} ${index + 1}`}
              className="w-full h-64 object-cover rounded-lg shadow-soft"
            />
          ))
        ) : (
          <img
            src="/placeholder.svg"
            alt={listing.title}
            className="w-full h-64 object-cover rounded-lg shadow-soft"
          />
        )}
      </div>

      {/* Main Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{listing.title}</CardTitle>
              <Badge className="mt-2 bg-earth text-earth-foreground">{listing.category}</Badge>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                ${listing.price_per_unit.toFixed(2)}
                <span className="text-lg text-muted-foreground">/{listing.unit}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total: ${(listing.quantity * listing.price_per_unit).toFixed(2)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center text-muted-foreground">
              <Package className="w-5 h-5 mr-2" />
              <span>Quantity: {listing.quantity} {listing.unit}</span>
            </div>
            {listing.harvest_date && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-5 h-5 mr-2" />
                <span>Harvested: {format(new Date(listing.harvest_date), "MMM dd, yyyy")}</span>
              </div>
            )}
            {listing.pickup_location && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{listing.pickup_location}</span>
              </div>
            )}
          </div>

          {listing.cosmetic_notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Cosmetic Notes</h4>
                <p className="text-muted-foreground">{listing.cosmetic_notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Farmer Info */}
          {farmer && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{farmer.farm_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {farmer.profiles?.full_name}
                  </div>
                  {farmer.verified && (
                    <Badge variant="outline" className="mt-1">Verified</Badge>
                  )}
                </div>
              </div>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Farmer
              </Button>
            </div>
          )}

          <Button 
            className="w-full" 
            size="lg"
            onClick={() => setShowOrderForm(true)}
            disabled={!buyerId}
          >
            Place Order
          </Button>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Reviews & Ratings
            {averageRating > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({averageRating.toFixed(1)} avg from {ratings.length} reviews)
              </span>
            )}
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
                  <p className="text-sm text-muted-foreground">{rating.review}</p>
                )}
                <div className="text-xs text-muted-foreground mt-2">
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

      {/* Order Form Dialog */}
      <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
          </DialogHeader>
          {listing && buyerId && (
            <OrderForm
              listing={listing}
              farmerId={listing.farmer_id}
              buyerId={buyerId}
              onSuccess={() => {
                setShowOrderForm(false);
                toast.success("Order placed successfully!");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
