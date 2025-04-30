"use client";

import React from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogIn, LogOut, User, Clock, Users } from 'lucide-react'; // Import Users icon
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { Timestamp } from 'firebase/firestore'; // Import Timestamp directly

interface EmployeeListProps {
  filter: 'all' | 'present';
  title: string;
  searchQuery?: string; // Optional search query prop
}

export function EmployeeList({ filter, title, searchQuery = "" }: EmployeeListProps) {
  const {
    allEmployees,
    presentEmployees,
    isLoadingAll,
    isLoadingPresent,
    checkIn,
    checkOut,
    isUpdating,
  } = useEmployees();

  const isLoading = filter === 'all' ? isLoadingAll : isLoadingPresent;
  const baseEmployees = filter === 'all' ? allEmployees : presentEmployees;

  // Filter employees based on search query if applicable
  const filteredEmployees = filter === 'all' && searchQuery
    ? baseEmployees.filter(employee =>
        employee.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : baseEmployees;

  // Sort employees alphabetically by name
  const sortedEmployees = [...filteredEmployees].sort((a, b) => a.name.localeCompare(b.name));

  const renderTimestamp = (timestamp: Timestamp | null) => { // Use Timestamp type directly
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting timestamp:", timestamp, error);
      // Check if timestamp is a Firestore Timestamp object before calling toDate()
      if (timestamp && typeof timestamp.toDate === 'function') {
         try {
            const date = timestamp.toDate();
            return formatDistanceToNow(date, { addSuffix: true });
         } catch(innerError) {
             console.error("Error converting Firestore Timestamp:", innerError);
             return 'Invalid Date';
         }
      }
      return 'Invalid Date Input'; // Handle cases where input is not a valid Timestamp
    }
  };

  const renderTableContent = () => {
     if (isLoading) {
        return (
          <div className="space-y-2 p-4"> {/* Added padding for loading state */}
            {[...Array(5)].map((_, i) => (
               <div key={i} className="flex items-center justify-between p-2">
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                 </div>
                 <Skeleton className="h-8 w-20" />
               </div>
            ))}
          </div>
        );
     }

     if (sortedEmployees.length === 0) {
        const message = filter === 'present'
            ? 'No employees currently in the office.'
            : searchQuery
            ? `No employees found matching "${searchQuery}".`
            : 'No employees listed.';
        return <p className="text-muted-foreground text-center py-4">{message}</p>;
     }

     return (
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {filter === 'all' && <TableHead>Status</TableHead>}
                {filter === 'all' && <TableHead><Clock className="inline-block mr-1 h-4 w-4"/>Last Check-In</TableHead>}
                {filter === 'all' && <TableHead><Clock className="inline-block mr-1 h-4 w-4"/>Last Check-Out</TableHead>}
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  {filter === 'all' && (
                     <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${employee.status === 'in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {employee.status === 'in' ? 'In Office' : 'Out of Office'}
                        </span>
                     </TableCell>
                  )}
                   {filter === 'all' && <TableCell>{renderTimestamp(employee.lastCheckIn)}</TableCell>}
                   {filter === 'all' && <TableCell>{renderTimestamp(employee.lastCheckOut)}</TableCell>}
                  <TableCell className="text-right">
                    {employee.status === 'out' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkIn(employee.id)}
                        disabled={isUpdating}
                        aria-label={`Check in ${employee.name}`}
                        className="border-primary text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <LogIn className="mr-2 h-4 w-4" /> Check In
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkOut(employee.id)}
                        disabled={isUpdating}
                        aria-label={`Check out ${employee.name}`}
                        className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Check Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
     )
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {filter === 'present' ? <User className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-secondary" />}
          {title} ({isLoading ? '...' : sortedEmployees.length})
        </CardTitle>
      </CardHeader>
      {/* Removed default padding from CardContent to allow Table/Skeleton to control spacing */}
      <CardContent className="p-0">
         {renderTableContent()}
      </CardContent>
    </Card>
  );
}

// Keep the Users icon component as it is
// const Users = (props: React.SVGProps<SVGSVGElement>) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width="24"
//     height="24"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     {...props}
//   >
//     <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
//     <circle cx="9" cy="7" r="4" />
//     <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
//     <path d="M16 3.13a4 4 0 0 1 0 7.75" />
//   </svg>
// );
