const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value.trim());

export const requiredEmailValidator = {
  validator: (value: string): boolean => isValidEmail(value),
  message: 'Invalid email format',
};

export const optionalEmailValidator = {
  validator: (value: string): boolean => value === '' || isValidEmail(value),
  message: 'Invalid email format',
};
