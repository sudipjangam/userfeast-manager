import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Pencil, Trash2, Plus, CreditCard, Info } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Restaurant, SubscriptionPlan } from './types';
import { ScrollArea } from "@/components/ui/scroll-area";

interface RestaurantFormData {
  name: string;
  address: string;
  email?: string;
  phone?: string;
}

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const { toast } = useToast();
  const form = useForm<RestaurantFormData>();

  useEffect(() => {
    fetchRestaurants();
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setSubscriptionPlans(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching subscription plans",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          subscription:restaurant_subscriptions!restaurant_id(
            *,
            plan:subscription_plans(*)
          )
        `);

      if (error) throw error;

      // Map the data to handle the subscription array
      const mappedData = data?.map(restaurant => ({
        ...restaurant,
        subscription: restaurant.subscription?.[0] || null
      })) || [];

      console.log('Fetched restaurants:', mappedData); // Debug log
      setRestaurants(mappedData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching restaurants",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (data: RestaurantFormData) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Restaurant created successfully",
        description: "The new restaurant has been added to the system.",
      });
      
      fetchRestaurants();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating restaurant",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleUpdateRestaurant = async (id: string, data: RestaurantFormData) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Restaurant updated successfully",
        description: "The restaurant's information has been updated.",
      });
      
      fetchRestaurants();
      setEditingRestaurant(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating restaurant",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Restaurant deleted successfully",
        description: "The restaurant has been removed from the system.",
      });
      
      fetchRestaurants();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting restaurant",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleSubscribe = async (restaurantId: string, planId: string) => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      const plan = subscriptionPlans.find(p => p.id === planId);
      
      if (!plan) throw new Error("Plan not found");
      
      // Calculate end date based on plan interval
      switch (plan.interval) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'half_yearly':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      const { error } = await supabase
        .from('restaurant_subscriptions')
        .upsert({
          restaurant_id: restaurantId,
          plan_id: planId,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false
        }, {
          onConflict: 'restaurant_id'
        });

      if (error) throw error;

      toast({
        title: "Subscription updated successfully",
        description: "The restaurant's subscription has been updated.",
      });
      
      // Immediately fetch the updated restaurant data to refresh the UI
      const { data: updatedRestaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select(`
          *,
          subscription:restaurant_subscriptions(
            *,
            plan:subscription_plans(*)
          )
        `)
        .eq('id', restaurantId)
        .single();

      if (fetchError) throw fetchError;

      // Update the restaurants list with the new subscription data
      setRestaurants(restaurants.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...updatedRestaurant, subscription: updatedRestaurant.subscription[0] }
          : restaurant
      ));
      
      setIsSubscriptionDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating subscription",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const getSubscriptionStatus = (restaurant: Restaurant) => {
    if (!restaurant.subscription) {
      return (
        <Badge 
          variant="destructive" 
          className="bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-600 hover:to-orange-600"
        >
          No Subscription
        </Badge>
      );
    }

    const endDate = new Date(restaurant.subscription.current_period_end);
    const now = new Date();

    if (restaurant.subscription.status === 'active' && endDate > now) {
      return (
        <HoverCard>
          <HoverCardTrigger>
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
            >
              {restaurant.subscription.plan?.name} - Active until {endDate.toLocaleDateString()}
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Subscription Details
              </h4>
              <p className="font-bold text-gray-700">Plan: {restaurant.subscription.plan?.name}</p>
              <p className="font-bold text-gray-700">
                Price: ₹{restaurant.subscription.plan?.price}/
                {restaurant.subscription.plan?.interval}
              </p>
              <p className="font-bold text-gray-700">Features:</p>
              <ul className="list-disc pl-4">
                {restaurant.subscription.plan?.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600">{feature}</li>
                ))}
              </ul>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }

    return (
      <Badge 
        variant="destructive"
        className="bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-600 hover:to-orange-600"
      >
        Expired
      </Badge>
    );
  };

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingRestaurant(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const openEditDialog = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    form.reset({
      name: restaurant.name,
      address: restaurant.address || '',
      email: restaurant.email || '',
      phone: restaurant.phone || '',
    });
    setIsDialogOpen(true);
  };

  const openSubscriptionDialog = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsSubscriptionDialogOpen(true);
  };

  return (
    <div className="space-y-4 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Restaurants Management
        </h1>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search restaurants..."
            className="max-w-xs shadow-sm hover:shadow-md transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Restaurant
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
              <TableHead className="font-bold text-gray-700">Name</TableHead>
              <TableHead className="font-bold text-gray-700">Address</TableHead>
              <TableHead className="font-bold text-gray-700">Email</TableHead>
              <TableHead className="font-bold text-gray-700">Phone</TableHead>
              <TableHead className="font-bold text-gray-700">Subscription</TableHead>
              <TableHead className="font-bold text-gray-700">Created At</TableHead>
              <TableHead className="text-right font-bold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredRestaurants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No restaurants found
                </TableCell>
              </TableRow>
            ) : (
              filteredRestaurants.map((restaurant) => (
                <TableRow 
                  key={restaurant.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer font-medium text-gray-700">
                          {restaurant.name}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Restaurant ID: {restaurant.id}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer">
                          {restaurant.address}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{restaurant.address}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer">
                          {restaurant.email || 'N/A'}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Email: {restaurant.email || 'Not Available'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer">
                          {restaurant.phone || 'N/A'}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Phone: {restaurant.phone || 'Not Available'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>{getSubscriptionStatus(restaurant)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-pointer">
                          {new Date(restaurant.created_at).toLocaleDateString()}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Created: {new Date(restaurant.created_at).toLocaleString()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(restaurant)}
                            className="hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Restaurant</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRestaurant(restaurant.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Restaurant</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openSubscriptionDialog(restaurant)}
                            className="hover:bg-blue-50"
                          >
                            <CreditCard className="h-4 w-4 text-blue-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Manage Subscription</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingRestaurant ? 'Edit Restaurant' : 'Create New Restaurant'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingRestaurant ? 
              (data) => handleUpdateRestaurant(editingRestaurant.id, data) : 
              handleCreateRestaurant)} 
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  {editingRestaurant ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Manage Subscription for {selectedRestaurant?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50"
                  onClick={() => handleSubscribe(selectedRestaurant!.id, plan.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        ₹{plan.price}
                      </p>
                      <p className="text-sm text-gray-600">per {plan.interval}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-gray-700">Features:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {plan.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Restaurants;
