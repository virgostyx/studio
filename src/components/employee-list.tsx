"use client";

import React from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogIn, LogOut, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeListProps {
  filter: 'all' | 'present';
  title: string;
}

export function EmployeeList({ filter, title }: EmployeeListProps) {
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
  const employees = filter === 'all' ? allEmployees : presentEmployees;

  // Sort employees alphabetically by name
  const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name));

  const renderTimestamp = (timestamp: firebase.firestore.Timestamp | null) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting timestamp:", timestamp, error);
      return 'Invalid Date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {filter === 'present' ? <User className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-secondary" />}
          {title} ({isLoading ? '...' : sortedEmployees.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
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
        ) : sortedEmployees.length === 0 ? (
           <p className="text-muted-foreground text-center py-4">No employees currently {filter === 'present' ? 'in the office' : 'listed'}.</p>
        ) :(
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
                        <span className={`px-2 py-1 rounded-full text-xs ${employee.status === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
        )}
      </CardContent>
    </Card>
  );
}

// Add a simple Users icon component if not available in lucide-react
const Users = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
