import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

interface ListingFormData {
  title: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  harvest_date: string;
  pickup_location: string;
  location_lat: number;
  location_lng: number;
  cosmetic_notes: string;
}

interface ListingFormProps {
  farmerId: string;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Dairy",
  "Herbs",
  "Root Crops",
  "Leafy Greens",
  "Other"
];

const UNITS = ["kg", "lbs", "tons", "pieces", "bunches", "boxes"];

export const ListingForm = ({ farmerId, onSuccess }: ListingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ListingFormData>();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }

    setPhotos(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingFormData) => {
    setIsSubmitting(true);
    try {
      // Upload photos if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(fileName);
        
        photoUrls.push(publicUrl);
      }

      // Create listing
      const { error } = await supabase.from("listings").insert({
        farmer_id: farmerId,
        title: data.title,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        price_per_unit: data.price_per_unit,
        harvest_date: data.harvest_date,
        pickup_location: data.pickup_location,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        cosmetic_notes: data.cosmetic_notes,
        photos: photoUrls.length > 0 ? photoUrls : null,
        status: "available"
      });

      if (error) throw error;

      toast.success("Listing created successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Product Title *</Label>
        <Input
          id="title"
          {...register("title", { required: "Title is required" })}
          placeholder="e.g., Fresh Organic Tomatoes"
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select onValueChange={(value) => setValue("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="harvest_date">Harvest Date *</Label>
          <Input
            id="harvest_date"
            type="date"
            {...register("harvest_date", { required: "Harvest date is required" })}
          />
          {errors.harvest_date && <p className="text-sm text-destructive">{errors.harvest_date.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            {...register("quantity", { required: "Quantity is required", min: 0.01 })}
            placeholder="100"
          />
          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Select onValueChange={(value) => setValue("unit", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map(unit => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_per_unit">Price per Unit ($) *</Label>
          <Input
            id="price_per_unit"
            type="number"
            step="0.01"
            {...register("price_per_unit", { required: "Price is required", min: 0.01 })}
            placeholder="5.00"
          />
          {errors.price_per_unit && <p className="text-sm text-destructive">{errors.price_per_unit.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pickup_location">Pickup Location *</Label>
        <Input
          id="pickup_location"
          {...register("pickup_location", { required: "Pickup location is required" })}
          placeholder="Farm address or collection center"
        />
        {errors.pickup_location && <p className="text-sm text-destructive">{errors.pickup_location.message}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location_lat">Latitude *</Label>
          <Input
            id="location_lat"
            type="number"
            step="any"
            {...register("location_lat", { required: "Latitude is required" })}
            placeholder="e.g., 12.9716"
          />
          {errors.location_lat && <p className="text-sm text-destructive">{errors.location_lat.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location_lng">Longitude *</Label>
          <Input
            id="location_lng"
            type="number"
            step="any"
            {...register("location_lng", { required: "Longitude is required" })}
            placeholder="e.g., 77.5946"
          />
          {errors.location_lng && <p className="text-sm text-destructive">{errors.location_lng.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cosmetic_notes">Cosmetic Notes</Label>
        <Textarea
          id="cosmetic_notes"
          {...register("cosmetic_notes")}
          placeholder="Any imperfections or cosmetic issues (optional)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Photos (up to 5)</Label>
        <div className="flex flex-wrap gap-4">
          {photoPreviews.map((preview, index) => (
            <div key={index} className="relative w-24 h-24">
              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <label className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Listing...
          </>
        ) : (
          "Create Listing"
        )}
      </Button>
    </form>
  );
};
