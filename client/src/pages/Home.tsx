import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { useCalculateQuote, useCreateQuote } from "@/hooks/use-quotes";
import { calculateQuoteSchema, type CalculateQuoteRequest, type QuoteBreakdown } from "@shared/schema";

import { SectionCard } from "@/components/SectionCard";
import { QuoteSummary } from "@/components/QuoteSummary";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Plane, Car, Users, User, CalendarIcon, Check } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [breakdown, setBreakdown] = useState<QuoteBreakdown | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const form = useForm<CalculateQuoteRequest>({
    resolver: zodResolver(calculateQuoteSchema),
    defaultValues: {
      villa: { enabled: true },
      vehicle: { enabled: false, type: "7_seater", route: "city", days: 1 },
      ecoGirl: { enabled: false, count: 0, nights: 0 },
      guide: { enabled: false, days: 0, groupSize: 1 },
    },
  });

  const calculateMutation = useCalculateQuote();
  const createQuoteMutation = useCreateQuote();

  // Watch for changes to recalculate
  const values = form.watch();

  useEffect(() => {
    const subscription = form.watch((value) => {
      // Debounce slightly to avoid too many requests
      const timer = setTimeout(() => {
        if (value.villa?.enabled && (!value.villa?.checkIn || !value.villa?.checkOut)) {
            // Wait for full date range
            return;
        }
        
        // Ensure proper types for calculation
        const payload = calculateQuoteSchema.parse(value);
        calculateMutation.mutate(payload, {
          onSuccess: (data) => setBreakdown(data),
          onError: (error) => {
             console.error("Calculation error", error);
          }
        });
      }, 300);
      return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, calculateMutation]);

  const handleSaveQuote = () => {
    if (!breakdown) return;
    setIsCustomerDialogOpen(true);
  };

  const confirmSaveQuote = () => {
    if (!customerName.trim() || !breakdown) return;
    
    createQuoteMutation.mutate({
      customerName,
      totalPrice: breakdown.total,
      breakdown: breakdown,
    }, {
      onSuccess: () => {
        setIsCustomerDialogOpen(false);
        toast({
          title: "Quote Saved Successfully",
          description: `Quote for ${customerName} has been saved.`,
        });
        setCustomerName("");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save quote. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Header */}
      <div className="relative bg-white border-b border-border/40">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">
              Vietnam Travel Calculator
            </h1>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              Plan your perfect trip with real-time pricing for villas, transport, and premium services in Vung Tau & Ho Chi Minh City.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Villa Section */}
            <Controller
              control={form.control}
              name="villa.enabled"
              render={({ field }) => (
                <SectionCard
                  title="Luxury Villa Stay"
                  icon={Plane}
                  isEnabled={field.value ?? false}
                  onToggle={field.onChange}
                  gradient="from-blue-500/10"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Check-in Date</Label>
                      <Controller
                        control={form.control}
                        name="villa.checkIn"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal h-12 rounded-xl",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out Date</Label>
                      <Controller
                        control={form.control}
                        name="villa.checkOut"
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal h-12 rounded-xl",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-muted-foreground border border-blue-100">
                    <p><strong>Weekday:</strong> $350 | <strong>Friday:</strong> $380 | <strong>Saturday:</strong> $500</p>
                  </div>
                </SectionCard>
              )}
            />

            {/* Vehicle Section */}
            <Controller
              control={form.control}
              name="vehicle.enabled"
              render={({ field }) => (
                <SectionCard
                  title="Private Transportation"
                  icon={Car}
                  isEnabled={field.value ?? false}
                  onToggle={field.onChange}
                  gradient="from-indigo-500/10"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Controller
                        control={form.control}
                        name="vehicle.type"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7_seater">7 Seater SUV</SelectItem>
                              <SelectItem value="16_seater">16 Seater Van</SelectItem>
                              <SelectItem value="9_limo">9 Seater Limousine</SelectItem>
                              <SelectItem value="9_lux_limo">9 Seater Luxury Limo</SelectItem>
                              <SelectItem value="12_lux_limo">12 Seater Luxury Limo</SelectItem>
                              <SelectItem value="16_lux_limo">16 Seater Luxury Limo</SelectItem>
                              <SelectItem value="29_seater">29 Seater Bus</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Route Plan</Label>
                      <Controller
                        control={form.control}
                        name="vehicle.route"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Select route" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="city">Vung Tau City Tour (12-14h)</SelectItem>
                              <SelectItem value="oneway">HCMC ↔ Vung Tau (One way)</SelectItem>
                              <SelectItem value="roundtrip">HCMC ↔ Vung Tau (Round trip)</SelectItem>
                              <SelectItem value="city_pickup_drop">Pickup/Drop + City Tour (+50%)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Days</Label>
                      <Controller
                        control={form.control}
                        name="vehicle.days"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            min="1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="h-12 rounded-xl"
                          />
                        )}
                      />
                    </div>
                  </div>
                </SectionCard>
              )}
            />

            {/* Eco Girl Section */}
            <Controller
              control={form.control}
              name="ecoGirl.enabled"
              render={({ field }) => (
                <SectionCard
                  title="Eco Girl Service"
                  icon={User}
                  isEnabled={field.value ?? false}
                  onToggle={field.onChange}
                  gradient="from-rose-500/10"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Number of Companions</Label>
                      <Controller
                        control={form.control}
                        name="ecoGirl.count"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="h-12 rounded-xl"
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Nights</Label>
                      <Controller
                        control={form.control}
                        name="ecoGirl.nights"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="h-12 rounded-xl"
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-rose-600 font-medium">
                    Rate: $220 / night per person
                  </div>
                </SectionCard>
              )}
            />

            {/* Guide Section */}
            <Controller
              control={form.control}
              name="guide.enabled"
              render={({ field }) => (
                <SectionCard
                  title="Tour Guide"
                  icon={Users}
                  isEnabled={field.value ?? false}
                  onToggle={field.onChange}
                  gradient="from-emerald-500/10"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Service Days</Label>
                      <Controller
                        control={form.control}
                        name="guide.days"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="h-12 rounded-xl"
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Group Size</Label>
                      <Controller
                        control={form.control}
                        name="guide.groupSize"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            min="1" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="h-12 rounded-xl"
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-emerald-600 font-medium">
                    Base: $120/day (up to 4 pax) + $20/person extra
                  </div>
                </SectionCard>
              )}
            />

          </div>

          {/* Right Column: Sticky Summary */}
          <div className="lg:col-span-4">
             <QuoteSummary 
               breakdown={breakdown} 
               isLoading={calculateMutation.isPending}
               onSave={handleSaveQuote}
               isSaving={createQuoteMutation.isPending}
             />
          </div>

        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Save Quotation</DialogTitle>
            <DialogDescription>
              Enter the customer's name to save this estimate for later reference.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name" className="text-right">Customer Name</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="mt-2 h-12 rounded-xl"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={confirmSaveQuote} className="rounded-xl">
              <Check className="mr-2 h-4 w-4" /> Save Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
