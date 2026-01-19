import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import Home from "@/pages/Home";
import PlacesGuide from "@/pages/PlacesGuide";
import ExpenseTracker from "@/pages/ExpenseTracker";
import NearbyPlaces from "@/pages/NearbyPlaces";
import TravelPlanner from "@/pages/TravelPlanner";
import ChatRoom from "@/pages/ChatRoom";
import Board from "@/pages/Board";
import DietProducts from "@/pages/DietProducts";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/guide" component={PlacesGuide} />
      <Route path="/expenses" component={ExpenseTracker} />
      <Route path="/nearby" component={NearbyPlaces} />
      <Route path="/planner" component={TravelPlanner} />
      <Route path="/chat" component={ChatRoom} />
      <Route path="/board" component={Board} />
      <Route path="/diet" component={DietProducts} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
