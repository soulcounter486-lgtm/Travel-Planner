import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n";
import { MapPin, Star, Navigation, Phone, Clock, ExternalLink, Loader2, AlertCircle, Coffee, Utensils, Building, Pill, CreditCard, ShoppingBag, Scissors, Car, Hospital, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  types: string[];
  location: { lat: number; lng: number };
  photoReference?: string;
}

interface PlaceDetails {
  name: string;
  address: string;
  phone?: string;
  openingHours?: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  reviews?: { author_name: string; rating: number; text: string; relative_time_description: string }[];
  website?: string;
  googleMapsUrl: string;
  photoReferences?: string[];
}

const placeCategories = [
  { id: "restaurant", icon: Utensils, type: "restaurant" },
  { id: "cafe", icon: Coffee, type: "cafe" },
  { id: "pharmacy", icon: Pill, type: "pharmacy" },
  { id: "atm", icon: CreditCard, type: "atm" },
  { id: "convenience_store", icon: ShoppingBag, type: "convenience_store" },
  { id: "hospital", icon: Hospital, type: "hospital" },
  { id: "gas_station", icon: Car, type: "gas_station" },
  { id: "hair_care", icon: Scissors, type: "hair_care" },
  { id: "lodging", icon: Home, type: "lodging" },
];

export default function NearbyPlaces() {
  const { t, language } = useLanguage();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("restaurant");
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Location error:", error);
          setLocationError(t("nearby.locationError"));
          setCurrentLocation({ lat: 10.3460, lng: 107.0843 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationError(t("nearby.noGeolocation"));
      setCurrentLocation({ lat: 10.3460, lng: 107.0843 });
    }
  }, [t]);

  const { data: placesData, isLoading: placesLoading, error: placesError } = useQuery<{ places: NearbyPlace[]; status: string }>({
    queryKey: ["/api/nearby-places", currentLocation?.lat, currentLocation?.lng, selectedCategory, language],
    enabled: !!currentLocation,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/nearby-places?lat=${currentLocation!.lat}&lng=${currentLocation!.lng}&type=${selectedCategory}&radius=1500&lang=${language}`);
      return res.json();
    },
  });

  const { data: placeDetails, isLoading: detailsLoading } = useQuery<PlaceDetails>({
    queryKey: ["/api/place-details", selectedPlace?.placeId, language],
    enabled: !!selectedPlace && showDetails,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/place-details/${selectedPlace!.placeId}?lang=${language}`);
      return res.json();
    },
  });

  const getCategoryName = (categoryId: string) => {
    return t(`nearby.category.${categoryId}`);
  };

  const getPriceLevelString = (level?: number) => {
    if (!level) return "";
    return "$".repeat(level);
  };

  const getDistanceFromUser = (placeLat: number, placeLng: number) => {
    if (!currentLocation) return null;
    const R = 6371;
    const dLat = (placeLat - currentLocation.lat) * Math.PI / 180;
    const dLon = (placeLng - currentLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(placeLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000;
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  const handlePlaceClick = (place: NearbyPlace) => {
    setSelectedPlace(place);
    setShowDetails(true);
  };

  const openInGoogleMaps = (place: NearbyPlace) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("nearby.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("nearby.subtitle")}</p>
          {locationError && (
            <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{locationError} {t("nearby.usingDefault")}</span>
            </div>
          )}
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            {placeCategories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.type}
                className="flex items-center gap-1 text-xs px-2 py-1.5"
                data-testid={`tab-${category.id}`}
              >
                <category.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{getCategoryName(category.id)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {!currentLocation || placesLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t("nearby.loading")}</p>
          </div>
        ) : placesError ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-8 h-8 text-destructive mb-4" />
            <p className="text-muted-foreground">{t("nearby.error")}</p>
          </div>
        ) : placesData?.places?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MapPin className="w-8 h-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("nearby.noResults")}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {placesData?.places?.map((place, index) => (
                <motion.div
                  key={place.placeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="hover-elevate cursor-pointer"
                    onClick={() => handlePlaceClick(place)}
                    data-testid={`place-card-${place.placeId}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {place.photoReference ? (
                          <img
                            src={`/api/place-photo/${place.photoReference}?maxwidth=100`}
                            alt={place.name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Building className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{place.name}</h3>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{place.address}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {place.rating && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                                {place.rating.toFixed(1)}
                                {place.userRatingsTotal && (
                                  <span className="text-muted-foreground ml-1">({place.userRatingsTotal})</span>
                                )}
                              </Badge>
                            )}
                            {place.priceLevel && (
                              <Badge variant="outline" className="text-xs">
                                {getPriceLevelString(place.priceLevel)}
                              </Badge>
                            )}
                            {place.openNow !== undefined && (
                              <Badge variant={place.openNow ? "default" : "secondary"} className="text-xs">
                                {place.openNow ? t("nearby.open") : t("nearby.closed")}
                              </Badge>
                            )}
                            {place.location && (
                              <span className="text-xs text-muted-foreground">
                                {getDistanceFromUser(place.location.lat, place.location.lng)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlace?.name}</DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : placeDetails ? (
            <div className="space-y-4">
              {placeDetails.photoReferences && placeDetails.photoReferences.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {placeDetails.photoReferences.map((ref, i) => (
                    <img
                      key={i}
                      src={`/api/place-photo/${ref}?maxwidth=300`}
                      alt={`${placeDetails.name} ${i + 1}`}
                      className="w-32 h-24 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {placeDetails.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{placeDetails.address}</span>
                  </div>
                )}
                {placeDetails.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${placeDetails.phone}`} className="text-sm text-primary hover:underline">
                      {placeDetails.phone}
                    </a>
                  </div>
                )}
                {placeDetails.openingHours && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm space-y-0.5">
                      {placeDetails.openingHours.map((hours, i) => (
                        <div key={i}>{hours}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {placeDetails.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{placeDetails.rating.toFixed(1)}</span>
                  {placeDetails.userRatingsTotal && (
                    <span className="text-muted-foreground text-sm">({placeDetails.userRatingsTotal} {t("nearby.reviews")})</span>
                  )}
                </div>
              )}

              {placeDetails.reviews && placeDetails.reviews.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">{t("nearby.recentReviews")}</h4>
                  {placeDetails.reviews.map((review, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{review.author_name}</span>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs ml-0.5">{review.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.relative_time_description}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{review.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => window.open(placeDetails.googleMapsUrl, "_blank")}
                  data-testid="button-open-maps"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {t("nearby.openMaps")}
                </Button>
                {placeDetails.website && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(placeDetails.website, "_blank")}
                    data-testid="button-open-website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
