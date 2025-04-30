"use client"; // Add 'use client' directive

import { EmployeeList } from '@/components/employee-list';
import { AddEmployeeForm } from '@/components/add-employee-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"; // Import Input
import { PlusCircle, Search } from 'lucide-react'; // Import Search icon
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
  // Using state variables
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("present"); // State for active tab

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Office Tracker</h1>
        <p className="text-lg text-muted-foreground">Real-time employee presence monitoring.</p>
      </header>

      {/* Update Tabs component to manage active tab state */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="present">Currently Present</TabsTrigger>
            <TabsTrigger value="all">All Employees</TabsTrigger>
          </TabsList>

          {/* Search Input - Conditionally rendered for 'All Employees' tab */}
          {activeTab === 'all' && (
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full md:w-[250px]" // Adjust width as needed
              />
            </div>
          )}

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
               <Button variant="default" className="w-full md:w-auto">
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
          {/* Pass null or empty string for searchQuery when not applicable */}
          <EmployeeList filter="present" title="Employees Currently In Office" searchQuery="" />
        </TabsContent>
        <TabsContent value="all">
          {/* Pass the searchQuery state to the 'All Employees' list */}
          <EmployeeList filter="all" title="All Registered Employees" searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>

    </main>
  );
}
