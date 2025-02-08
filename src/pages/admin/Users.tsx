
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  restaurant_id: string | null;
  restaurant?: Restaurant | null;
}

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
}

interface UserFormData {
  first_name: string;
  last_name: string;
  role: string;
  restaurant_name?: string;
  restaurant_address?: string;
  restaurant_email?: string;
  restaurant_phone?: string;
}

const Users = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<UserFormData>();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: UserFormData) => {
    try {
      let restaurantId = null;

      // If restaurant details are provided, create a restaurant first
      if (data.restaurant_name) {
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert([{
            name: data.restaurant_name,
            address: data.restaurant_address,
            email: data.restaurant_email,
            phone: data.restaurant_phone,
          }])
          .select()
          .single();

        if (restaurantError) throw restaurantError;
        restaurantId = restaurant.id;
      }

      // Create the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          restaurant_id: restaurantId,
        }]);

      if (profileError) throw profileError;

      toast({
        title: "User created successfully",
        description: "The new user has been added to the system.",
      });
      
      fetchUsers();
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating user",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleUpdateUser = async (id: string, data: UserFormData) => {
    try {
      const user = users.find(u => u.id === id);
      let restaurantId = user?.restaurant_id;

      // Update or create restaurant if details are provided
      if (data.restaurant_name) {
        if (restaurantId) {
          // Update existing restaurant
          const { error: restaurantError } = await supabase
            .from('restaurants')
            .update({
              name: data.restaurant_name,
              address: data.restaurant_address,
              email: data.restaurant_email,
              phone: data.restaurant_phone,
            })
            .eq('id', restaurantId);

          if (restaurantError) throw restaurantError;
        } else {
          // Create new restaurant
          const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert([{
              name: data.restaurant_name,
              address: data.restaurant_address,
              email: data.restaurant_email,
              phone: data.restaurant_phone,
            }])
            .select()
            .single();

          if (restaurantError) throw restaurantError;
          restaurantId = restaurant.id;
        }
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          restaurant_id: restaurantId,
        })
        .eq('id', id);

      if (profileError) throw profileError;

      toast({
        title: "User updated successfully",
        description: "The user's information has been updated.",
      });
      
      fetchUsers();
      setEditingUser(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating user",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "User deleted successfully",
        description: "The user has been removed from the system.",
      });
      
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting user",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditDialog = (user: Profile) => {
    setEditingUser(user);
    form.reset({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      restaurant_name: user.restaurant?.name || '',
      restaurant_address: user.restaurant?.address || '',
      restaurant_email: user.restaurant?.email || '',
      restaurant_phone: user.restaurant?.phone || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    form.reset({
      first_name: '',
      last_name: '',
      role: 'manager',
      restaurant_name: '',
      restaurant_address: '',
      restaurant_email: '',
      restaurant_phone: '',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Users Management
        </h1>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search users..."
            className="max-w-xs shadow-sm hover:shadow-md transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow 
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger className="cursor-pointer">
                        {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'N/A'}
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">User Details</h4>
                          <div className="text-sm">
                            <p><strong>ID:</strong> {user.id}</p>
                            <p><strong>First Name:</strong> {user.first_name || 'N/A'}</p>
                            <p><strong>Last Name:</strong> {user.last_name || 'N/A'}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                            {user.restaurant && (
                              <>
                                <p><strong>Restaurant:</strong> {user.restaurant.name}</p>
                                <p><strong>Address:</strong> {user.restaurant.address || 'N/A'}</p>
                                <p><strong>Email:</strong> {user.restaurant.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> {user.restaurant.phone || 'N/A'}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>{user.restaurant?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(user)}
                      className="hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingUser ? 
              (data) => handleUpdateUser(editingUser.id, data) : 
              handleCreateUser)} 
              className="space-y-4"
            >
              <Tabs defaultValue="user" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user">User Details</TabsTrigger>
                  <TabsTrigger value="restaurant">Restaurant Details</TabsTrigger>
                </TabsList>
                <TabsContent value="user" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="restaurant" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="restaurant_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="restaurant_address"
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
                    name="restaurant_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="restaurant_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
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
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
