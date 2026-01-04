import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').max(20, 'Employee ID is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  stationId: z.number().min(1, 'Please select a station'),
  roleId: z.number().min(1, 'Please select a role'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  stationId: z.number().min(1, 'Please select a station'),
  roleId: z.number().min(1, 'Please select a role'),
  isActive: z.boolean(),
});

// Station validation schemas
export const createStationSchema = z.object({
  code: z.string().length(3, 'Station code must be exactly 3 characters').toUpperCase(),
  name: z.string().min(1, 'Station name is required').max(100, 'Station name is too long'),
  city: z.string().min(1, 'City is required').max(50, 'City name is too long'),
  country: z.string().min(1, 'Country is required').max(50, 'Country name is too long'),
});

export const updateStationSchema = createStationSchema;

// Role validation schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name is too long'),
  description: z.string().min(1, 'Description is required').max(200, 'Description is too long'),
  isAdmin: z.boolean(),
});

export const updateRoleSchema = createRoleSchema;

// Login validation schema
export const loginSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateStationInput = z.infer<typeof createStationSchema>;
export type UpdateStationInput = z.infer<typeof updateStationSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

