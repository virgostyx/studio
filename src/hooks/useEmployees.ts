import { useFirestoreQueryData } from '@tanstack-query-firebase/react'; // Corrected import based on likely v1 structure
// Removed: import { useFirestoreMutation } from '@tanstack-query-firebase/react';
import { collection, query, where, doc, updateDoc, serverTimestamp, getDocs, writeBatch, addDoc, Timestamp } from 'firebase/firestore';
import { useQueryClient, useMutation } from '@tanstack/react-query'; // Import useMutation
import { db } from '@/lib/firebase';
import type { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
// Removed: import type firebase from 'firebase/compat/app'; // Import firebase namespace for Timestamp type hint if needed, otherwise remove if Timestamp comes directly from 'firebase/firestore'

const EMPLOYEES_COLLECTION = 'employees';

// Key for TanStack Query caching
const queryKeyAll = ['employees'];
const queryKeyPresent = ['employees', 'present'];

// Helper to seed initial data if collection is empty - commented out as seeding might not be desired on every hook usage
// const seedInitialEmployees = async () => {
//   const employeesCollectionRef = collection(db, EMPLOYEES_COLLECTION);
//   const snapshot = await getDocs(query(employeesCollectionRef));

//   if (snapshot.empty) {
//     console.log('No employees found, seeding initial data...');
//     const batch = writeBatch(db);
//     const initialEmployees = [
//       { name: 'Alice Smith', status: 'out', lastCheckIn: null, lastCheckOut: null },
//       { name: 'Bob Johnson', status: 'out', lastCheckIn: null, lastCheckOut: null },
//       { name: 'Charlie Brown', status: 'out', lastCheckIn: null, lastCheckOut: null },
//       { name: 'Diana Prince', status: 'out', lastCheckIn: null, lastCheckOut: null },
//     ];

//     initialEmployees.forEach(emp => {
//       const docRef = doc(employeesCollectionRef); // Auto-generate ID
//       batch.set(docRef, emp);
//     });

//     await batch.commit();
//     console.log('Initial employee data seeded.');
//   }
// };


export function useEmployees() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Seed data on initial load (consider doing this server-side or in a setup script for production)
  // React.useEffect(() => {
  //   seedInitialEmployees();
  // }, []);

  // Query for all employees using useFirestoreQueryData
  // Note: The types might need adjustment based on the actual v1 implementation if `useFirestoreQueryData` expects different generics.
  const allEmployeesQuery = useFirestoreQueryData<Employee>(
    queryKeyAll,
    query(collection(db, EMPLOYEES_COLLECTION)),
    {
      subscribe: true, // Keep listening for real-time updates
      idField: 'id', // Automatically map document ID to 'id' field
    }
  );

  // Query for employees currently 'in' the office using useFirestoreQueryData
  const presentEmployeesQuery = useFirestoreQueryData<Employee>(
    queryKeyPresent,
    query(collection(db, EMPLOYEES_COLLECTION), where('status', '==', 'in')),
    {
      subscribe: true, // Keep listening for real-time updates
      idField: 'id', // Automatically map document ID to 'id' field
    }
  );

 // Mutation hook for updating employee status using useMutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (variables: { employeeId: string; status: 'in' | 'out' }) => {
      const docRef = doc(db, EMPLOYEES_COLLECTION, variables.employeeId);
      // Type assertion for updateData to satisfy Firestore's update requirements
      const updateData: { [key: string]: any } = { status: variables.status };
      if (variables.status === 'in') {
        updateData.lastCheckIn = serverTimestamp();
      } else {
        updateData.lastCheckOut = serverTimestamp();
      }
      await updateDoc(docRef, updateData);
    },
     onSuccess: (_, variables) => {
       // Invalidate both queries to refetch/update the cache
       queryClient.invalidateQueries({ queryKey: queryKeyAll });
       queryClient.invalidateQueries({ queryKey: queryKeyPresent });
       toast({
         title: "Status Updated",
         description: `Employee marked as ${variables.status}.`,
       });
     },
     onError: (error: Error, variables) => { // Add type for error
       console.error("Error updating employee status:", error);
       toast({
         variant: "destructive",
         title: "Update Failed",
         description: `Could not mark employee as ${variables.status}. Please try again.`,
       });
     },
  });


  // Mutation hook for adding a new employee using useMutation
  const addEmployeeMutation = useMutation({
     mutationFn: async (variables: { name: string }) => {
      const newEmployeeData: Omit<Employee, 'id'> = { // Define type for new employee data
        name: variables.name,
        status: 'out', // Default status
        lastCheckIn: null, // Initialize timestamps
        lastCheckOut: null,
      };
      // Use addDoc from 'firebase/firestore'
      await addDoc(collection(db, EMPLOYEES_COLLECTION), newEmployeeData);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeyAll });
        toast({
          title: "Employee Added",
          description: "New employee successfully added.",
        });
      },
      onError: (error: Error) => { // Add type for error
        console.error("Error adding employee:", error);
        toast({
          variant: "destructive",
          title: "Add Failed",
          description: "Could not add the new employee. Please try again.",
        });
      },
  });


  const checkIn = (employeeId: string) => {
    updateEmployeeMutation.mutate({ employeeId, status: 'in' });
  };

  const checkOut = (employeeId: string) => {
    updateEmployeeMutation.mutate({ employeeId, status: 'out' });
  };

   const addEmployee = (name: string) => {
    addEmployeeMutation.mutate({ name });
  };

  // Ensure the data arrays are correctly typed, defaulting to empty array
  const allEmployeesData: Employee[] = Array.isArray(allEmployeesQuery.data) ? allEmployeesQuery.data : [];
  const presentEmployeesData: Employee[] = Array.isArray(presentEmployeesQuery.data) ? presentEmployeesQuery.data : [];


  return {
    allEmployees: allEmployeesData,
    presentEmployees: presentEmployeesData,
    isLoadingAll: allEmployeesQuery.isLoading,
    isLoadingPresent: presentEmployeesQuery.isLoading,
    isUpdating: updateEmployeeMutation.isPending,
    isAdding: addEmployeeMutation.isPending,
    checkIn,
    checkOut,
    addEmployee,
    refetchAll: allEmployeesQuery.refetch,
    refetchPresent: presentEmployeesQuery.refetch,
  };
}
