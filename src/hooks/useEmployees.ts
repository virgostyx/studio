
import { collection, query, where, doc, updateDoc, serverTimestamp, getDocs, addDoc, deleteDoc, Timestamp, onSnapshot, QuerySnapshot, DocumentData, Query } from 'firebase/firestore'; // Added deleteDoc
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import type { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const EMPLOYEES_COLLECTION = 'employees';
const queryKeyAll = ['employees'];
const queryKeyPresent = ['employees', 'present'];


export function useEmployees() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // --- Real-time Query for All Employees ---
    const allEmployeesQuery = useQuery<Employee[]>({
        queryKey: queryKeyAll,
        queryFn: async () => {
             const q = query(collection(db, EMPLOYEES_COLLECTION));
             const snapshot = await getDocs(q);
             // Ensure department defaults to empty string if missing
             return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), department: doc.data().department || '' } as Employee));
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    // --- Real-time Query for Present Employees ---
    const presentEmployeesQuery = useQuery<Employee[]>({
        queryKey: queryKeyPresent,
        queryFn: async () => {
            const q = query(collection(db, EMPLOYEES_COLLECTION), where('status', '==', 'in'));
            const snapshot = await getDocs(q);
             // Ensure department defaults to empty string if missing
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), department: doc.data().department || '' } as Employee));
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    // --- Effect for Real-time Updates ---
    React.useEffect(() => {
        const qAll = query(collection(db, EMPLOYEES_COLLECTION));
        const unsubscribeAll = onSnapshot(qAll, (snapshot: QuerySnapshot<DocumentData>) => {
             // Ensure department defaults to empty string if missing
            const updatedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), department: doc.data().department || '' } as Employee));
            queryClient.setQueryData(queryKeyAll, updatedData);
        }, (error) => {
            console.error("Error listening to all employees:", error);
            toast({ variant: "destructive", title: "Listener Error", description: "Could not listen for all employee updates." });
        });

        const qPresent = query(collection(db, EMPLOYEES_COLLECTION), where('status', '==', 'in'));
        const unsubscribePresent = onSnapshot(qPresent, (snapshot: QuerySnapshot<DocumentData>) => {
             // Ensure department defaults to empty string if missing
            const updatedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), department: doc.data().department || '' } as Employee));
            queryClient.setQueryData(queryKeyPresent, updatedData);
        }, (error) => {
            console.error("Error listening to present employees:", error);
            toast({ variant: "destructive", title: "Listener Error", description: "Could not listen for present employee updates." });
        });

        return () => {
            unsubscribeAll();
            unsubscribePresent();
        };
    }, [queryClient, toast]);

    // --- Mutations ---
    const updateEmployeeMutation = useMutation({
        mutationFn: async (variables: { employeeId: string; status: 'in' | 'out' }) => {
          const docRef = doc(db, EMPLOYEES_COLLECTION, variables.employeeId);
          const updateData: { [key: string]: any } = { status: variables.status };
          if (variables.status === 'in') {
            updateData.lastCheckIn = serverTimestamp();
          } else {
            updateData.lastCheckOut = serverTimestamp();
          }
          await updateDoc(docRef, updateData);
        },
         onSuccess: (_, variables) => {
            toast({
              title: "Status Updated",
              description: `Employee marked as ${variables.status}.`,
            });
          },
         onError: (error: Error, variables) => {
           console.error("Error updating employee status:", error);
           toast({
             variant: "destructive",
             title: "Update Failed",
             description: `Could not mark employee as ${variables.status}. Please try again.`,
           });
         },
      });

    const addEmployeeMutation = useMutation({
        // Update mutation function to accept department
        mutationFn: async (variables: { name: string; department: string }) => {
          const newEmployeeData: Omit<Employee, 'id'> = {
            name: variables.name,
            department: variables.department, // Add department
            status: 'out',
            lastCheckIn: null,
            lastCheckOut: null,
          };
          await addDoc(collection(db, EMPLOYEES_COLLECTION), newEmployeeData);
        },
        onSuccess: () => {
            toast({
              title: "Employee Added",
              description: "New employee successfully added.",
            });
          },
        onError: (error: Error) => {
            console.error("Error adding employee:", error);
            toast({
              variant: "destructive",
              title: "Add Failed",
              description: "Could not add the new employee. Please try again.",
            });
          },
      });

    // --- Delete Employee Mutation ---
    const deleteEmployeeMutation = useMutation({
        mutationFn: async (employeeId: string) => {
            const docRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
            await deleteDoc(docRef);
        },
        onSuccess: () => {
            toast({
                title: "Employee Deleted",
                description: "The employee has been successfully removed.",
            });
        },
        onError: (error: Error) => {
            console.error("Error deleting employee:", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: "Could not delete the employee. Please try again.",
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

    // Update addEmployee to accept department
    const addEmployee = (name: string, department: string) => {
        addEmployeeMutation.mutate({ name, department });
    };

    const deleteEmployee = (employeeId: string) => {
        deleteEmployeeMutation.mutate(employeeId);
    };

    // --- Return Values ---
    const allEmployeesData: Employee[] = allEmployeesQuery.data ?? [];
    const presentEmployeesData: Employee[] = presentEmployeesQuery.data ?? [];

    // Extract unique departments
    const departments = React.useMemo(() => {
        const deptSet = new Set(allEmployeesData.map(emp => emp.department).filter(Boolean)); // Filter out empty strings
        return Array.from(deptSet).sort();
    }, [allEmployeesData]);


    return {
        allEmployees: allEmployeesData,
        presentEmployees: presentEmployeesData,
        departments, // Expose departments
        isLoadingAll: allEmployeesQuery.isLoading,
        isLoadingPresent: presentEmployeesQuery.isLoading,
        isUpdating: updateEmployeeMutation.isPending,
        isAdding: addEmployeeMutation.isPending,
        isDeleting: deleteEmployeeMutation.isPending,
        checkIn,
        checkOut,
        addEmployee,
        deleteEmployee,
        refetchAll: allEmployeesQuery.refetch,
        refetchPresent: presentEmployeesQuery.refetch,
    };
}
