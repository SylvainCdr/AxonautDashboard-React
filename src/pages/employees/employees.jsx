import styles from "./style.module.scss";
import { fetchEmployees } from "../../services/api/employees";
import React, { useEffect, useState } from "react";
import { GridLoader } from "react-spinners";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEmployeesData = async () => {
      try {
        setLoading(true);
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadEmployeesData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement des employés...</p>
      </div>
    );
  }

  return (
    <div className={styles.employeesContainer}>
      <h1>Employees</h1>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.firstname}</td>
              <td>{employee.lastname}</td>
              <td>{employee.email}</td>
              <td>
                {employee.cellphone_number} - {employee.phone_number}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
