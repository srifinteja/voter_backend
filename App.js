// src/App.js
import React from 'react';
import EmployeeImages from './EmployeeImages';

const App = () => {
  // Replace with the actual employee ID you want to view
  const employeeId = 'employeeid'; // Change this as needed

  return (
    <div>
      <h1>Employee Image Viewer</h1>
      <EmployeeImages employeeId={employeeId} />
    </div>
  );
};

export default App;
