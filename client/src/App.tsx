import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import Home from "@/pages/Home";
import PlacesGuide from "@/pages/PlacesGuide";
import ExpenseTracker from "@/pages/ExpenseTracker";
import NearbyPlaces from "@/pages/NearbyPlaces";
import TravelPlanner from "@/pages/TravelPlanner";
import ChatRoom from "@/pages/ChatRoom";
import Board from "@/pages/Board";
import DietProducts from "@/pages/DietProducts";
import LocationShare from "@/pages/LocationShare";
import Privacy from "@/pages/Privacy";
import AdminVillas from "@/pages/AdminVillas";
import AdminPlaces from "@/pages/AdminPlaces";
import AdminMembers from "@/pages/AdminMembers";
import AdminSettings from "@/pages/AdminSettings";
import AdminQuoteCategories from "@/pages/AdminQuoteCategories";
import AdminChat from "@/pages/AdminChat";
import MyPage from "@/pages/MyPage";
import MyCoupons from "@/pages/MyCoupons";
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
      <Route path="/board/:id" component={Board} />
      <Route path="/board" component={Board} />
      <Route path="/diet" component={DietProducts} />
      <Route path="/locations" component={LocationShare} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/admin/villas" component={AdminVillas} />
      <Route path="/admin/places" component={AdminPlaces} />
      <Route path="/admin/members" component={AdminMembers} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/quote-categories" component={AdminQuoteCategories} />
      <Route path="/admin/chat" component={AdminChat} />
      <Route path="/mypage" component={MyPage} />
      <Route path="/my-coupons" component={MyCoupons} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PushSubscriptionManager() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(true, !!isAuthenticated);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <PushSubscriptionManager />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
