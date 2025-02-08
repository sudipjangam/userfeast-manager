
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserSearchBar } from './components/UserSearchBar';
import { UserTable } from './components/UserTable';
import { UserForm } from './components/UserForm';
import type { Profile, UserFormData } from './types';

const Users = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

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

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Then create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          restaurant_id: restaurantId,
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "User created successfully",
        description: "The new user has been added to the system.",
      });
      
      fetchUsers();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error creating user",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleUpdateUser = async (data: UserFormData) => {
    try {
      const user = editingUser;
      if (!user) return;
      
      let restaurantId = user.restaurant_id;

      if (data.restaurant_name) {
        if (restaurantId) {
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

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          restaurant_id: restaurantId,
        })
        .eq('id', user.id);

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
      // Delete the auth user (this will cascade to the profile)
      const { error } = await supabase.auth.admin.deleteUser(id);

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
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Users Management
        </h1>
        <UserSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateClick={openCreateDialog}
        />
      </div>

      <div className="rounded-lg border bg-white shadow-lg overflow-hidden">
        <UserTable
          users={filteredUsers}
          loading={loading}
          onEdit={openEditDialog}
          onDelete={handleDeleteUser}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
            onCancel={() => setIsDialogOpen(false)}
            editingUser={editingUser}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
