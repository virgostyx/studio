
"use client";

import React, { useState } from 'react'; // Import useState
import { useEmployees } from '@/hooks/useEmployees';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogIn, LogOut, User, Users, Trash2, Building } from 'lucide-react'; // Import Building icon, remove Clock
import { Skeleton } from '@/components/ui/skeleton';
import type { Employee } from '@/types/employee'; // Import Employee type
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface EmployeeListProps {
  filter: 'all' | 'present';
  title: string;
  searchQuery?: string;
  departmentFilter?: string; // Added department filter prop
}

export function EmployeeList({ filter, title, searchQuery = "", departmentFilter = "" }: EmployeeListProps) {
  const {
    allEmployees,
    presentEmployees,
    isLoadingAll,
    isLoadingPresent,
    checkIn,
    checkOut,
    deleteEmployee, // Get delete function
    isUpdating,
    isDeleting, // Get deleting state
  } = useEmployees();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const isLoading = filter === 'all' ? isLoadingAll : isLoadingPresent;
  const baseEmployees = filter === 'all' ? allEmployees : presentEmployees;

  // Apply filtering
  const filteredEmployees = baseEmployees.filter(employee => {
    const nameMatch = !searchQuery || employee.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Only apply department filter if it's the 'all' list and a filter is selected
    const departmentMatch = filter !== 'all' || !departmentFilter || employee.department === departmentFilter;
    return nameMatch && departmentMatch;
  });


  const sortedEmployees = [...filteredEmployees].sort((a, b) => a.name.localeCompare(b.name));

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  const renderTableContent = () => {
     if (isLoading) {
        return (
          <div className="space-y-2 p-4">
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
        let message = 'No employees listed.';
        if(filter === 'present') {
            message = 'No employees currently in the office.';
        } else if (searchQuery || departmentFilter) {
            message = `No employees found matching the criteria.`;
        }

        return <p className="text-muted-foreground text-center py-4">{message}</p>;
     }

     return (
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {filter === 'all' && <TableHead>Status</TableHead>}
                {/* Replace Time columns with Department */}
                {filter === 'all' && <TableHead><Building className="inline-block mr-1 h-4 w-4"/>Department</TableHead>}
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                     {filter === 'all' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClick(employee)}
                        disabled={isDeleting && employeeToDelete?.id === employee.id} // Disable if this is being deleted
                        aria-label={`Delete ${employee.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                     )}
                     {employee.name}
                  </TableCell>
                  {filter === 'all' && (
                     <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${employee.status === 'in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {employee.status === 'in' ? 'In Office' : 'Out of Office'}
                        </span>
                     </TableCell>
                  )}
                  {/* Display Department */}
                   {filter === 'all' && <TableCell>{employee.department || '-'}</TableCell>}
                  <TableCell className="text-right">
                    {employee.status === 'out' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkIn(employee.id)}
                        disabled={isUpdating || (isDeleting && employeeToDelete?.id === employee.id)}
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
                        disabled={isUpdating || (isDeleting && employeeToDelete?.id === employee.id)}
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {filter === 'present' ? <User className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-secondary" />}
            {title} ({isLoading ? '...' : sortedEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           {renderTableContent()}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <strong>{employeeToDelete?.name}</strong> from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
