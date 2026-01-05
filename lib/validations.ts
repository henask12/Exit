import { z } from 'zod';

export const loginSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  stationId: z.number().min(1, 'Station is required'),
  roleId: z.number().min(1, 'Role is required'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  stationId: z.number().min(1, 'Station is required'),
  roleId: z.number().min(1, 'Role is required'),
  isActive: z.boolean(),
});

export const createStationSchema = z.object({
  code: z.string().length(3, 'Code must be 3 characters').toUpperCase(),
  name: z.string().min(1, 'Name is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
});

export const updateStationSchema = z.object({
  code: z.string().length(3, 'Code must be 3 characters').toUpperCase(),
  name: z.string().min(1, 'Name is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  isAdmin: z.boolean(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  isAdmin: z.boolean(),
});

export const assignPermissionsSchema = z.array(z.number());

