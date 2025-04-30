import { collection, query, where, doc, updateDoc, serverTimestamp, getDocs, addDoc, Timestamp, onSnapshot, QuerySnapshot, DocumentData, Query } from 'firebase/firestore'; // Added Query, QuerySnapshot, DocumentData
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'; // Import useQuery
import { db } from '@/lib/firebase';
import type { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import React from 'react'; // Import React for useEffect

const EMPLOYEES_COLLECTION = 'employees';
const queryKeyAll = ['employees'];
const queryKeyPresent = ['employees', 'present'];

// Helper function to fetch employees initially (optional, as onSnapshot provides initial data)
// const fetchEmployees = async (q: Query<DocumentData>): Promise<Employee[]> => {
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
// };

export function useEmployees() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // --- Real-time Query for All Employees (using useQuery + useEffect/onSnapshot) ---
    const allEmployeesQuery = useQuery<Employee[]>({
        queryKey: queryKeyAll,
        // queryFn is not strictly needed here if useEffect handles the initial load and updates
        // If needed for SSR or initial fetch before listener attaches, use fetchEmployees
        queryFn: async () => {
             console.log("QueryFn executing for all employees..."); // Debug log
             const q = query(collection(db, EMPLOYEES_COLLECTION));
             const snapshot = await getDocs(q); // Use getDocs for initial fetch via queryFn
             return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        },
        staleTime: Infinity, // Data is managed by the real-time listener
        refetchOnWindowFocus: false, // Avoid refetching when listener is active
    });

    // --- Real-time Query for Present Employees (using useQuery + useEffect/onSnapshot) ---
    const presentEmployeesQuery = useQuery<Employee[]>({
        queryKey: queryKeyPresent,
        // queryFn for initial fetch
        queryFn: async () => {
            console.log("QueryFn executing for present employees..."); // Debug log
            const q = query(collection(db, EMPLOYEES_COLLECTION), where('status', '==', 'in'));
            const snapshot = await getDocs(q); // Use getDocs for initial fetch via queryFn
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    // --- Effect for Real-time Updates (using onSnapshot) ---
    React.useEffect(() => {
        console.log("Setting up Firestore listeners..."); // Debug log
        const qAll = query(collection(db, EMPLOYEES_COLLECTION));
        const unsubscribeAll = onSnapshot(qAll, (snapshot: QuerySnapshot<DocumentData>) => {
            console.log("Received update for all employees:", snapshot.docs.length); // Debug log
            const updatedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            queryClient.setQueryData(queryKeyAll, updatedData); // Update cache directly
        }, (error) => {
            console.error("Error listening to all employees:", error);
            toast({ variant: "destructive", title: "Listener Error", description: "Could not listen for all employee updates." });
        });

        const qPresent = query(collection(db, EMPLOYEES_COLLECTION), where('status', '==', 'in'));
        const unsubscribePresent = onSnapshot(qPresent, (snapshot: QuerySnapshot<DocumentData>) => {
             console.log("Received update for present employees:", snapshot.docs.length); // Debug log
            const updatedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            queryClient.setQueryData(queryKeyPresent, updatedData); // Update cache directly
        }, (error) => {
            console.error("Error listening to present employees:", error);
            toast({ variant: "destructive", title: "Listener Error", description: "Could not listen for present employee updates." });
        });

        // Cleanup listeners on unmount
        return () => {
            console.log("Cleaning up Firestore listeners..."); // Debug log
            unsubscribeAll();
            unsubscribePresent();
        };
    }, [queryClient, toast]); // Include toast in dependency array

    // --- Mutations (Keep as they are) ---
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
         // No need to invalidate manually as onSnapshot updates the cache via setQueryData
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
        mutationFn: async (variables: { name: string }) => {
          const newEmployeeData: Omit<Employee, 'id'> = {
            name: variables.name,
            status: 'out',
            lastCheckIn: null,
            lastCheckOut: null,
          };
          await addDoc(collection(db, EMPLOYEES_COLLECTION), newEmployeeData);
        },
        // No need to invalidate manually as onSnapshot updates the cache via setQueryData
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

    // --- Exported Functions ---
    const checkIn = (employeeId: string) => {
        updateEmployeeMutation.mutate({ employeeId, status: 'in' });
    };

    const checkOut = (employeeId: string) => {
        updateEmployeeMutation.mutate({ employeeId, status: 'out' });
    };

    const addEmployee = (name: string) => {
        addEmployeeMutation.mutate({ name });
    };

    // --- Return Values ---
    // Use data from useQuery, defaulting to empty array if undefined/null
    const allEmployeesData: Employee[] = allEmployeesQuery.data ?? [];
    const presentEmployeesData: Employee[] = presentEmployeesQuery.data ?? [];

    return {
        allEmployees: allEmployeesData,
        presentEmployees: presentEmployeesData,
        // isLoading flags now reflect the initial fetch status from useQuery
        isLoadingAll: allEmployeesQuery.isLoading,
        isLoadingPresent: presentEmployeesQuery.isLoading,
        isUpdating: updateEmployeeMutation.isPending,
        isAdding: addEmployeeMutation.isPending,
        checkIn,
        checkOut,
        addEmployee,
        // Refetch functions from useQuery can be used to manually trigger the queryFn again
        refetchAll: allEmployeesQuery.refetch,
        refetchPresent: presentEmployeesQuery.refetch,
    };
}