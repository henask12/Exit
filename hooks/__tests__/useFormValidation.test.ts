import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation } from '../useFormValidation';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older'),
});

describe('useFormValidation', () => {
  it('should initialize with no errors', () => {
    const { result } = renderHook(() => useFormValidation(testSchema));
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('should validate correct data', () => {
    const { result } = renderHook(() => useFormValidation(testSchema));
    
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };

    let isValid = false;
    act(() => {
      isValid = result.current.validate(validData);
    });

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('should set errors for invalid data', () => {
    const { result } = renderHook(() => useFormValidation(testSchema));
    
    const invalidData = {
      name: '',
      email: 'invalid-email',
      age: 15,
    };

    let isValid = false;
    act(() => {
      isValid = result.current.validate(invalidData);
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.name).toBeDefined();
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.age).toBeDefined();
  });

  it('should validate individual fields', () => {
    const { result } = renderHook(() => useFormValidation(testSchema));
    
    act(() => {
      result.current.validateField('email', 'invalid-email');
    });

    expect(result.current.errors.email).toBeDefined();
    
    act(() => {
      result.current.validateField('email', 'valid@email.com');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('should track touched fields', () => {
    const { result } = renderHook(() => useFormValidation(testSchema));
    
    act(() => {
      result.current.setFieldTouched('email');
    });

    expect(result.current.touched.email).toBe(true);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useFormValidation(testSchema));
    
    act(() => {
      result.current.validate({ name: '', email: '', age: 0 });
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });
});

