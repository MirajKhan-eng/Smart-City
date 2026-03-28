import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roleRequired }) => {
  const savedUser = localStorage.getItem('user');
  
  if (!savedUser) {
    console.log("Guard: No user found, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(savedUser);
  console.log(`Guard: User is ${user.role}, Page requires ${roleRequired}`);

  // We check if the role matches. 
  // IMPORTANT: Ensure your DB uses 'user' and 'admin' lowercase.
  if (roleRequired && user.role !== roleRequired) {
    console.log("Guard: Role mismatch! Redirecting to landing.");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;