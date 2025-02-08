// src/hooks/useWalletValidation.js

/**
 * useWalletValidation is a custom hook that provides validation functions for wallet-related user inputs.
 * It includes methods to validate passwords for security requirements and usernames for format constraints.
 * This hook ensures user inputs meet predefined criteria before proceeding with wallet-related actions.
 */


export function useWalletValidation() {
    const validatePassword = (password) => {
      if (password.length < 8) return 'Password must be at least 8 characters';
      if (!/\d/.test(password)) return 'Password must include a number';
      if (!/[!@#$%^&*]/.test(password)) return 'Password must include a special character';
      return '';
    };
  
    const validateUsername = (username) => {
      if (username.length < 3 || username.length > 20) {
        return 'Username must be between 3 and 20 characters';
      }
      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return 'Username can only contain letters and numbers';
      }
      return '';
    };
  
    return {
      validatePassword,
      validateUsername
    };
  }