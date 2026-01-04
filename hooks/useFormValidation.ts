import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';

export function useFormValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: unknown): data is T => {
      try {
        schema.parse(data);
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            const path = err.path.join('.');
            fieldErrors[path] = err.message;
          });
          setErrors(fieldErrors);
        }
        return false;
      }
    },
    [schema]
  );

  const validateField = useCallback(
    (field: string, value: unknown) => {
      try {
        const fieldSchema = (schema as any).shape?.[field];
        if (fieldSchema) {
          fieldSchema.parse(value);
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
          return true;
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors((prev) => ({
            ...prev,
            [field]: error.errors[0]?.message || 'Invalid value',
          }));
        }
        return false;
      }
      return true;
    },
    [schema]
  );

  const setFieldTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const getFieldError = useCallback(
    (field: string) => {
      return touched[field] ? errors[field] : undefined;
    },
    [errors, touched]
  );

  return {
    errors,
    touched,
    validate,
    validateField,
    setFieldTouched,
    clearErrors,
    getFieldError,
  };
}

