
'use server';

import type { Employee } from '@/types/employee';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dataFilePath = path.join(process.cwd(), 'data', 'employees.json');

// Helper function to read employees from the file
async function readEmployeesFromFile(): Promise<Employee[]> {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data) as Employee[];
  } catch (error: any) {
    // If file doesn't exist or is empty, return an empty array
    if (error.code === 'ENOENT') {
      await writeEmployeesToFile([]); // Create the file if it doesn't exist
      return [];
    }
    console.error('Error reading employees file:', error);
    throw new Error('Could not read employee data.');
  }
}

// Helper function to write employees to the file
async function writeEmployeesToFile(employees: Employee[]): Promise<void> {
  try {
    const data = JSON.stringify(employees, null, 2); // Pretty print JSON
    await fs.writeFile(dataFilePath, data, 'utf-8');
  } catch (error) {
    console.error('Error writing employees file:', error);
    throw new Error('Could not save employee data.');
  }
}

// Action to get all employees
export async function getEmployeesAction(): Promise<Employee[]> {
    // Re-read from file every time to ensure freshness (simple approach for file-based)
    return await readEmployeesFromFile();
}

// Action to add a new employee
export async function addEmployeeAction(name: string, department: string): Promise<Employee> {
    if (!name || !department) {
        throw new Error('Name and department are required.');
    }

    const employees = await readEmployeesFromFile();
    const newEmployee: Employee = {
      id: uuidv4(),
      name,
      department,
      status: 'out',
      lastCheckIn: null,
      lastCheckOut: null,
    };
    employees.push(newEmployee);
    await writeEmployeesToFile(employees);
    return newEmployee;
}

// Action to update employee status (check-in/check-out)
export async function updateEmployeeStatusAction(employeeId: string, status: 'in' | 'out'): Promise<Employee> {
    if (!employeeId || !status) {
        throw new Error('Employee ID and status are required.');
    }
    if (status !== 'in' && status !== 'out') {
        throw new Error('Invalid status provided.');
    }

    const employees = await readEmployeesFromFile();
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);

    if (employeeIndex === -1) {
      throw new Error('Employee not found.');
    }

    const updatedEmployee = { ...employees[employeeIndex], status };
    const now = new Date().toISOString();

    if (status === 'in') {
      updatedEmployee.lastCheckIn = now;
    } else {
      updatedEmployee.lastCheckOut = now;
    }

    employees[employeeIndex] = updatedEmployee;
    await writeEmployeesToFile(employees);
    return updatedEmployee;
}

// Action to delete an employee
export async function deleteEmployeeAction(employeeId: string): Promise<{ success: boolean }> {
    if (!employeeId) {
        throw new Error('Employee ID is required.');
    }

    let employees = await readEmployeesFromFile();
    const initialLength = employees.length;
    employees = employees.filter(emp => emp.id !== employeeId);

    if (employees.length === initialLength) {
      // No employee was removed, maybe ID didn't exist
      console.warn(`Attempted to delete non-existent employee ID: ${employeeId}`);
      // Consider throwing an error or returning a specific status
      // For simplicity, we'll return success=false
      return { success: false };
    }

    await writeEmployeesToFile(employees);
    return { success: true };
}
