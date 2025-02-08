
import { Profile, Restaurant } from "../types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface UserTableProps {
  users: Profile[];
  loading: boolean;
  onEdit: (user: Profile) => void;
  onDelete: (id: string) => void;
}

export const UserTable = ({ users, loading, onEdit, onDelete }: UserTableProps) => {
  return (
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
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No users found
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
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
                  onClick={() => onEdit(user)}
                  className="hover:bg-blue-50"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(user.id)}
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
  );
};
