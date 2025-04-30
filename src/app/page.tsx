import { EmployeeList } from '@/components/employee-list';
import { AddEmployeeForm } from '@/components/add-employee-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import React from 'react'; // Import React

export default function Home() {
  // Using a state variable to control dialog visibility
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Office Tracker</h1>
        <p className="text-lg text-muted-foreground">Real-time employee presence monitoring.</p>
      </header>

      <Tabs defaultValue="present" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="present">Currently Present</TabsTrigger>
            <TabsTrigger value="all">All Employees</TabsTrigger>
          </TabsList>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
               <Button variant="default">
                 <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
               </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Enter the name of the new employee to add them to the system.
                </DialogDescription>
              </DialogHeader>
              <AddEmployeeForm onFormSubmit={() => setIsAddDialogOpen(false)} /> {/* Close dialog on submit */}
            </DialogContent>
          </Dialog>

        </div>
        <TabsContent value="present">
          <EmployeeList filter="present" title="Employees Currently In Office" />
        </TabsContent>
        <TabsContent value="all">
          <EmployeeList filter="all" title="All Registered Employees" />
        </TabsContent>
      </Tabs>

    </main>
  );
}
