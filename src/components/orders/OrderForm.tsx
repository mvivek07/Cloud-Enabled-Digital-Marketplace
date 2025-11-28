import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Clock, Package } from "lucide-react";

interface OrderFormProps {
  listing: any;
  farmerId: string;
  buyerId: string;
  onSuccess: () => void;
}

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Estimate delivery time based on distance (assuming 40 km/hr average)
const estimateDeliveryTime = (distance: number): number => {
  const avgSpeed = 40; // km/hr
  const hours = distance / avgSpeed;
  return Math.ceil(hours * 60); // return in minutes
};

export const OrderForm = ({ listing, farmerId, buyerId, onSuccess }: OrderFormProps) => {
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!deliveryAddress || !locationLat || !locationLng) {
        toast.error("Please fill in all address details");
        setLoading(false);
        return;
      }

      if (quantity <= 0 || quantity > listing.quantity) {
        toast.error(`Please enter a valid quantity (1-${listing.quantity})`);
        setLoading(false);
        return;
      }

      const buyerLat = parseFloat(locationLat);
      const buyerLng = parseFloat(locationLng);

      // Check if listing has location coordinates
      if (!listing.location_lat || !listing.location_lng) {
        toast.error("This product doesn't have location information. Cannot calculate delivery.");
        setLoading(false);
        return;
      }

      // Calculate distance
      const distance = calculateDistance(
        listing.location_lat,
        listing.location_lng,
        buyerLat,
        buyerLng
      );

      // Check if distance is within acceptable range (50 km)
      const MAX_DELIVERY_DISTANCE = 50; // km
      if (distance > MAX_DELIVERY_DISTANCE) {
        toast.error(
          `Sorry, this farmer's product is too far away (${distance.toFixed(1)} km). We can only deliver within ${MAX_DELIVERY_DISTANCE} km.`,
          { duration: 6000 }
        );
        setLoading(false);
        return;
      }

      // Calculate estimated delivery time
      const estimatedMinutes = estimateDeliveryTime(distance);
      const pickupTime = new Date();
      pickupTime.setMinutes(pickupTime.getMinutes() + estimatedMinutes);

      // Create order
      const totalPrice = quantity * listing.price_per_unit;
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          buyer_id: buyerId,
          listing_id: listing.id,
          quantity,
          price_per_unit: listing.price_per_unit,
          total_price: totalPrice,
          delivery_address: deliveryAddress,
          pickup_time: pickupTime.toISOString(),
          status: "pending"
        });

      if (orderError) throw orderError;

      // Update buyer's location
      await supabase
        .from("buyers")
        .update({
          location_address: deliveryAddress,
          location_lat: buyerLat,
          location_lng: buyerLng
        })
        .eq("id", buyerId);

      toast.success(
        `Order placed successfully! Estimated delivery in ${estimatedMinutes} minutes (${distance.toFixed(1)} km away)`,
        { duration: 5000 }
      );

      onSuccess();
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const maxQuantity = listing.quantity;
  const totalPrice = quantity * listing.price_per_unit;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Product</span>
          <span className="font-semibold">{listing.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price per {listing.unit}</span>
          <span className="font-semibold">${listing.price_per_unit.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Available</span>
          <span className="font-semibold">{listing.quantity} {listing.unit}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity" className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Quantity ({listing.unit})
        </Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max={maxQuantity}
          value={quantity}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 1;
            // Prevent exceeding available quantity
            setQuantity(Math.min(val, maxQuantity));
          }}
          required
        />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Total: ${totalPrice.toFixed(2)}
          </span>
          <span className={quantity > maxQuantity ? "text-destructive font-semibold" : "text-muted-foreground"}>
            Max: {maxQuantity} {listing.unit}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Delivery Address
        </Label>
        <Textarea
          id="address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          placeholder="Enter your complete delivery address"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={locationLat}
            onChange={(e) => setLocationLat(e.target.value)}
            placeholder="e.g., 12.9716"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={locationLng}
            onChange={(e) => setLocationLng(e.target.value)}
            placeholder="e.g., 77.5946"
            required
          />
        </div>
      </div>

      <div className="bg-primary/10 p-4 rounded-lg flex items-start gap-3">
        <Clock className="w-5 h-5 text-primary mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-primary">Delivery Estimate</p>
          <p className="text-muted-foreground mt-1">
            Distance and delivery time will be calculated based on your location and the farmer's location.
          </p>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Processing..." : "Confirm Order"}
      </Button>
    </form>
  );
};
