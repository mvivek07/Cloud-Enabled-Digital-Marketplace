import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Star, Package } from "lucide-react";
import { format } from "date-fns";

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
  };
  onViewDetails?: (id: string) => void;
  showActions?: boolean;
}

export const ListingCard = ({ listing, onViewDetails, showActions = true }: ListingCardProps) => {
  const totalPrice = listing.quantity * listing.price_per_unit;
  const mainPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0] : "/placeholder.svg";

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
      </div>

      <CardHeader className="pb-3">
        <h3 className="text-xl font-bold text-foreground line-clamp-1">{listing.title}</h3>
        <div className="flex items-center justify-between mt-2">
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
