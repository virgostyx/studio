
'use client'; // Keep this for hook usage in client components

import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import type { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import {
    getEmployeesAction,
    addEmployeeAction,
    updateEmployeeStatusAction,
    deleteEmployeeAction
} from '@/actions/employeeActions'; // Import server actions

const queryKeyAll = ['employees']; // Single query key for all employees

export function useEmployees() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // --- Query for All Employees using Server Action ---
    const allEmployeesQuery = useQuery<Employee[]>({
        queryKey: queryKeyAll,
        queryFn: async () => {
            // Fetch data using the server action
            try {
                 return await getEmployeesAction();
            } catch (error: any) {
                console.error("Error fetching employees:", error);
                toast({ variant: "destructive", title: "Fetch Error", description: error.message || "Could not fetch employee data." });
                return []; // Return empty array on error
            }
        },
        // Configure staleTime and refetch as needed for file-based approach
        // For simplicity, let's refetch more often or rely on invalidation
        staleTime: 1000 * 10, // e.g., 10 seconds stale time
        refetchOnWindowFocus: true,
    });

    // --- Mutations using Server Actions ---

    const updateEmployeeMutation = useMutation({
        mutationFn: async (variables: { employeeId: string; status: 'in' | 'out' }) => {
            return await updateEmployeeStatusAction(variables.employeeId, variables.status);
        },
        onSuccess: (updatedEmployee) => {
            // Invalidate the query to refetch data
            queryClient.invalidateQueries({ queryKey: queryKeyAll });
            toast({
                title: "Status Updated",
                description: `${updatedEmployee.name} marked as ${updatedEmployee.status}.`,
            });
        },
        onError: (error: Error, variables) => {
            console.error("Error updating employee status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || `Could not mark employee as ${variables.status}. Please try again.`,
            });
        },
    });

    const addEmployeeMutation = useMutation({
        mutationFn: async (variables: { name: string; department: string }) => {
            return await addEmployeeAction(variables.name, variables.department);
        },
        onSuccess: (newEmployee) => {
            queryClient.invalidateQueries({ queryKey: queryKeyAll });
            toast({
                title: "Employee Added",
                description: `${newEmployee.name} successfully added.`,
            });
        },
        onError: (error: Error) => {
            console.error("Error adding employee:", error);
            toast({
                variant: "destructive",
                title: "Add Failed",
                description: error.message || "Could not add the new employee. Please try again.",
            });
        },
    });

    const deleteEmployeeMutation = useMutation({
        mutationFn: async (employeeId: string) => {
            return await deleteEmployeeAction(employeeId);
        },
        onSuccess: (result, employeeId) => {
             if (result.success) {
                queryClient.invalidateQueries({ queryKey: queryKeyAll });
                toast({
                    title: "Employee Deleted",
                    description: "The employee has been successfully removed.",
                });
            } else {
                // Optional: Show a different toast if deletion wasn't successful (e.g., employee not found)
                 toast({
                    variant: "destructive",
                    title: "Delete Failed",
                    description: "Employee not found or could not be deleted.",
                });
            }
        },
        onError: (error: Error) => {
            console.error("Error deleting employee:", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: error.message || "Could not delete the employee. Please try again.",
            });
        },
    });

    // --- Exported Functions ---
    const checkIn = (employeeId: string) => {
        updateEmployeeMutation.mutate({ employeeId, status: 'in' });
    };

    const checkOut = (employeeId: string) => {
        updateEmployeeMutation.mutate({ employeeId, status: 'out' });
    };

    const addEmployee = (name: string, department: string) => {
        addEmployeeMutation.mutate({ name, department });
    };

    const deleteEmployee = (employeeId: string) => {
        deleteEmployeeMutation.mutate(employeeId);
    };

    // --- Derived Data ---
    const allEmployeesData: Employee[] = allEmployeesQuery.data ?? [];

    const presentEmployees = React.useMemo(() => {
        return allEmployeesData.filter(emp => emp.status === 'in');
    }, [allEmployeesData]);

    const departments = React.useMemo(() => {
        const deptSet = new Set(allEmployeesData.map(emp => emp.department).filter(Boolean));
        return Array.from(deptSet).sort();
    }, [allEmployeesData]);

    return {
        allEmployees: allEmployeesData,
        presentEmployees: presentEmployees, // Derived from all employees
        departments,
        isLoadingAll: allEmployeesQuery.isLoading,
        isLoadingPresent: allEmployeesQuery.isLoading, // Same loading state as all employees
        isUpdating: updateEmployeeMutation.isPending,
        isAdding: addEmployeeMutation.isPending,
        isDeleting: deleteEmployeeMutation.isPending,
        checkIn,
        checkOut,
        addEmployee,
        deleteEmployee,
        refetchAll: allEmployeesQuery.refetch, // Refetch function remains
        refetchPresent: allEmployeesQuery.refetch, // Refetching all also updates present
    };
}
