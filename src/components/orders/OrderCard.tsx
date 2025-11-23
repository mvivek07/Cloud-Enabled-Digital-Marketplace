import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface OrderCardProps {
  order: any;
  type: "buyer" | "farmer";
}

export const OrderCard = ({ order, type }: OrderCardProps) => {
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Est. {format(new Date(order.pickup_time), "MMM dd, h:mm a")}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Ordered: {format(new Date(order.created_at), "MMM dd, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
};
