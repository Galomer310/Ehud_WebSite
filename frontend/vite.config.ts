// Import the defineConfig function from Vite and the React plugin
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Export the Vite configuration
export default defineConfig({
  plugins: [react()]  // Use the React plugin to support JSX and React-specific features
});
