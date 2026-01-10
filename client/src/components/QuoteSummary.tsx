import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Send, Plane, Car, Users, User } from "lucide-react";
import { type QuoteBreakdown, type CalculateQuoteRequest } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

interface QuoteSummaryProps {
  breakdown: QuoteBreakdown | null;
  isLoading: boolean;
  onSave: () => void;
  isSaving: boolean;
}

export function QuoteSummary({ breakdown, isLoading, onSave, isSaving }: QuoteSummaryProps) {
  if (isLoading && !breakdown) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-primary/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-primary/20">
        <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
          <Plane className="h-8 w-8 text-primary/40" />
        </div>
        <h3 className="text-lg font-medium text-foreground">Ready to Plan?</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">
          Adjust the options on the left to see your custom travel estimate in real-time.
        </p>
      </div>
    );
  }

  return (
    <Card className="sticky top-6 overflow-hidden border-0 shadow-xl shadow-primary/5 bg-white/90 backdrop-blur-md">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
      <CardHeader className="bg-primary/5 pb-6">
        <CardTitle className="flex items-center justify-between text-2xl">
          <span>Trip Estimate</span>
          <span className="text-3xl text-primary font-bold">
            ${breakdown.total.toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <AnimatePresence mode="wait">
          {breakdown.villa.price > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Plane className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Villa Stay</span>
                    <span>${breakdown.villa.price}</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    {breakdown.villa.details.map((detail, idx) => (
                      <p key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary/40" />
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              <Separator className="bg-border/50" />
            </motion.div>
          )}

          {breakdown.vehicle.price > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Car className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Transportation</span>
                    <span>${breakdown.vehicle.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{breakdown.vehicle.description}</p>
                </div>
              </div>
              <Separator className="bg-border/50" />
            </motion.div>
          )}

          {breakdown.ecoGirl.price > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Eco Girl Service</span>
                    <span>${breakdown.ecoGirl.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{breakdown.ecoGirl.description}</p>
                </div>
              </div>
              <Separator className="bg-border/50" />
            </motion.div>
          )}

          {breakdown.guide.price > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Tour Guide</span>
                    <span>${breakdown.guide.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{breakdown.guide.description}</p>
                </div>
              </div>
              <Separator className="bg-border/50" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 space-y-3">
          <Button 
            className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" 
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" /> Save Quote
              </>
            )}
          </Button>
          <Button variant="outline" className="w-full border-dashed border-2 hover:border-solid hover:bg-secondary/50">
            <Send className="mr-2 h-4 w-4" /> Email Quote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
