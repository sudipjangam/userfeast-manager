
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';

interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

export const UserSearchBar = ({ searchTerm, onSearchChange, onCreateClick }: UserSearchBarProps) => {
  return (
    <div className="flex gap-4">
      <Input
        type="search"
        placeholder="Search users..."
        className="max-w-xs shadow-sm hover:shadow-md transition-shadow"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Button
        onClick={onCreateClick}
        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>
    </div>
  );
};
