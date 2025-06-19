// app/layout.tsx
import './globals.css'; // Corrected path if globals.css is in the same 'app' directory
import { AuthProvider } from '../context/AuthContext'; // This path remains relative to 'context' folder outside 'app'
import type { Metadata } from 'next'; // Import Metadata type

// Define your metadata for the entire application
export const metadata: Metadata = {
  title: 'Ascend Daily', // This will set the browser tab title
  description: 'Your personalized study performance and daily notes tracker.', // Optional: Add a meta description
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}