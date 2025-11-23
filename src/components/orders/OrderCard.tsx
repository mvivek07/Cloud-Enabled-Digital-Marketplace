import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Clock, DollarSign, Check, Truck, Star } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface OrderCardProps {
  order: any;
  type: "buyer" | "farmer";
  onUpdate?: () => void;
}

export const OrderCard = ({ order, type, onUpdate }: OrderCardProps) => {
  const [loading, setLoading] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  // Check if buyer has already reviewed this order
  useEffect(() => {
    if (type === "buyer" && order.status === "completed") {
      checkExistingReview();
    }
  }, [order.id, order.status, type]);

  const checkExistingReview = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from("ratings")
        .select("id")
        .eq("order_id", order.id)
        .eq("rater_id", userData.user.id)
        .maybeSingle();

      setHasReviewed(!!data);
    } catch (error) {
      console.error("Error checking review:", error);
    }
  };

  // Auto-complete order when pickup time is reached
  useEffect(() => {
    if (type === "buyer" && order.status === "confirmed" && order.pickup_time) {
      const checkDelivery = () => {
        const now = new Date();
        const pickupTime = new Date(order.pickup_time);
        
        if (now >= pickupTime) {
          handleAutoComplete();
        }
      };

      const handleAutoComplete = async () => {
        try {
          const { error } = await supabase
            .from("orders")
            .update({ status: "completed" })
            .eq("id", order.id);

          if (!error) {
            toast.success("Order delivered successfully!");
            onUpdate?.();
          }
        } catch (error) {
          console.error("Failed to auto-complete order:", error);
        }
      };

      // Check immediately
      checkDelivery();

      // Then check every minute
      const interval = setInterval(checkDelivery, 60000);

      return () => clearInterval(interval);
    }
  }, [order.id, order.status, order.pickup_time, type, onUpdate]);

  const handleApprove = async () => {
    setLoading(true);
    try {
      // Set pickup time to 30 minutes from now
      const pickupTime = new Date();
      pickupTime.setMinutes(pickupTime.getMinutes() + 30);

      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "confirmed",
          pickup_time: pickupTime.toISOString()
        })
        .eq("id", order.id);

      if (error) throw error;

      toast.success("Order approved! Delivery in 30 minutes.");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to approve order");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Get farmer ID from listing
      const { data: listingData } = await supabase
        .from("listings")
        .select("farmer_id")
        .eq("id", order.listing_id)
        .single();

      if (!listingData) throw new Error("Listing not found");

      const { error } = await supabase
        .from("ratings")
        .insert({
          order_id: order.id,
          rater_id: userData.user.id,
          rated_user_id: listingData.farmer_id,
          rating: rating,
          review: review.trim() || null,
        });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setShowReviewDialog(false);
      setHasReviewed(true);
      setReview("");
      setRating(5);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "completed",
          pickup_time: new Date().toISOString()
        })
        .eq("id", order.id);

      if (error) throw error;

      toast.success("Order marked as delivered!");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to complete order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "confirmed":
        return "bg-primary/10 text-primary border-primary/20";
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    if (type === "buyer") {
      switch (status) {
        case "pending":
          return "Order Placed";
        case "confirmed":
          return "On the Way";
        case "completed":
          return "Buying Successful";
        default:
          return status;
      }
    } else {
      switch (status) {
        case "pending":
          return "New Order";
        case "confirmed":
          return "Sent";
        case "completed":
          return "Delivered";
        default:
          return status;
      }
    }
  };

  return (
    <Card className="shadow-soft hover:shadow-medium transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{order.listing?.title || "Order"}</CardTitle>
          <Badge className={getStatusColor(order.status)} variant="outline">
            {getStatusText(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>{order.quantity} {order.listing?.unit || "units"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>${order.total_price.toFixed(2)}</span>
          </div>
        </div>

        {order.delivery_address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{order.delivery_address}</span>
          </div>
        )}

        {order.pickup_time && (
          <div className={`flex items-center gap-2 text-sm ${
            type === "buyer" && order.status === "confirmed" 
              ? "text-primary font-medium" 
              : "text-muted-foreground"
          }`}>
            <Clock className="w-4 h-4" />
            <span>
              {type === "buyer" && order.status === "confirmed" 
                ? `Arriving: ${format(new Date(order.pickup_time), "MMM dd, h:mm a")}`
                : `Est. ${format(new Date(order.pickup_time), "MMM dd, h:mm a")}`
              }
            </span>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Ordered: {format(new Date(order.created_at), "MMM dd, yyyy")}
        </div>

        {type === "farmer" && (
          <div className="flex gap-2 mt-4">
            {order.status === "pending" && (
              <Button 
                onClick={handleApprove} 
                disabled={loading}
                size="sm"
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
            {order.status === "confirmed" && (
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                size="sm"
                variant="secondary"
                className="flex-1"
              >
                <Truck className="w-4 h-4 mr-1" />
                Mark Delivered
              </Button>
            )}
          </div>
        )}

        {type === "buyer" && order.status === "completed" && !hasReviewed && (
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full mt-4">
                <Star className="w-4 h-4 mr-2" />
                Write Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Your Order</DialogTitle>
                <DialogDescription>
                  Share your experience with {order.listing?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className="transition-colors"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            value <= rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review">Review (Optional)</Label>
                  <Textarea
                    id="review"
                    placeholder="Share your thoughts about the produce quality, farmer, etc..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmitReview} disabled={loading} className="w-full">
                  Submit Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {type === "buyer" && order.status === "completed" && hasReviewed && (
          <div className="text-sm text-muted-foreground text-center py-2 mt-4 border-t">
            <Star className="w-4 h-4 inline mr-1" />
            Review submitted
          </div>
        )}
      </CardContent>
    </Card>
  );
};
