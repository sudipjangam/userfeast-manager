
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
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

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
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const { toast } = useToast();
  const form = useForm<RestaurantFormData>();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
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

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditDialog = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    form.reset({
      name: restaurant.name,
      address: restaurant.address,
      email: restaurant.email || '',
      phone: restaurant.phone || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingRestaurant(null);
    form.reset({
      name: '',
      address: '',
      email: '',
      phone: '',
    });
    setIsDialogOpen(true);
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
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredRestaurants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
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
                    <HoverCard>
                      <HoverCardTrigger className="cursor-pointer">
                        {restaurant.name}
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Restaurant Details</h4>
                          <div className="text-sm">
                            <p><strong>ID:</strong> {restaurant.id}</p>
                            <p><strong>Name:</strong> {restaurant.name}</p>
                            <p><strong>Address:</strong> {restaurant.address}</p>
                            <p><strong>Email:</strong> {restaurant.email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {restaurant.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell>{restaurant.address}</TableCell>
                  <TableCell>{restaurant.email || 'N/A'}</TableCell>
                  <TableCell>{restaurant.phone || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(restaurant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(restaurant)}
                      className="hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRestaurant(restaurant.id)}
                      className="hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
    </div>
  );
};

export default Restaurants;
