"use client";

import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';

// Add department to the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  department: z.string().min(2, { // Add department field validation
      message: "Department must be at least 2 characters.",
  })
});

export function AddEmployeeForm({ onFormSubmit }: { onFormSubmit?: () => void }) {
  const { addEmployee, isAdding } = useEmployees();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      department: "", // Add default value for department
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Pass both name and department to addEmployee
    addEmployee(values.name, values.department);
    form.reset(); // Reset form after submission
    if (onFormSubmit) {
        onFormSubmit(); // Call callback if provided
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter employee name" {...field} disabled={isAdding} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Add Department FormField */}
         <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Enter department name" {...field} disabled={isAdding} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <Button type="submit" disabled={isAdding} className="w-full">
          {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Add Employee
        </Button>
      </form>
    </Form>
  );
}
