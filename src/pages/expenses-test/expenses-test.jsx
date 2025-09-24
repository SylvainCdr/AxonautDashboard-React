import { fetchAllExpenses } from "../../services/api/expenses";
import { useEffect, useState } from "react";

export default function ExpensesTest() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const getExpenses = async () => {
      try {
        const data = await fetchAllExpenses();
        setExpenses(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des dépenses :", error);
      }
    };

    getExpenses();
  }, []);

  return (
    <div>
      <h1>Expenses Test Page</h1>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>{expense.description}</li>
        ))}
      </ul>
    </div>
  );
}
