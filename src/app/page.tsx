

"use client"; // Add 'use client' directive

import { EmployeeList } from '@/components/employee-list';
import { AddEmployeeForm } from '@/components/add-employee-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Removed CardDescription
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"; // Import Input
import { PlusCircle, Search, Filter } from 'lucide-react'; // Import Search and Filter icons
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" // Import Select components
import { useEmployees } from '@/hooks/useEmployees'; // Import useEmployees

export default function Home() {
  // Using state variables
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("present"); // State for active tab
  const [selectedDepartment, setSelectedDepartment] = React.useState(""); // State for department filter

  // Get departments from the hook
  const { departments } = useEmployees();

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value === "all" ? "" : value); // Set to empty string if 'all' is selected
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Office Tracker</h1>
        <p className="text-lg text-muted-foreground">Real-time employee presence monitoring.</p>
      </header>

      {/* Update Tabs component to manage active tab state */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 flex-wrap">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="present" className="flex-1 md:flex-none">Currently Present</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 md:flex-none">All Employees</TabsTrigger>
          </TabsList>

          {/* Search and Filter Controls - Now always visible */}
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto flex-grow">
            <div className="relative w-full md:flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            {/* Department Filter Dropdown */}
            <div className="relative w-full md:w-[200px]">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Select value={selectedDepartment || "all"} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="pl-8 w-full">
                      <SelectValue placeholder="Filter by Department" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
            </div>
          </div>

          {/* Conditionally render Add Employee button only for 'all' tab */}
          {activeTab === 'all' && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                 <Button variant="default" className="w-full md:w-auto mt-2 md:mt-0">
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
                 </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Enter the name and department of the new employee.
                  </DialogDescription>
                </DialogHeader>
                {/* Pass department prop to AddEmployeeForm */}
                <AddEmployeeForm onFormSubmit={() => setIsAddDialogOpen(false)} /> {/* Close dialog on submit */}
              </DialogContent>
            </Dialog>
          )}
        </div>
        <TabsContent value="present">
          {/* Pass the searchQuery and selectedDepartment state to the 'present' list */}
          <EmployeeList
            filter="present"
            title="Employees Currently In Office"
            searchQuery={searchQuery}
            departmentFilter={selectedDepartment}
          />
        </TabsContent>
        <TabsContent value="all">
          {/* Pass the searchQuery and selectedDepartment state to the 'All Employees' list */}
          <EmployeeList
            filter="all"
            title="All Registered Employees"
            searchQuery={searchQuery}
            departmentFilter={selectedDepartment}
          />
        </TabsContent>
      </Tabs>

    </main>
  );
}

