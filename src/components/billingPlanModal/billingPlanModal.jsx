// // src/components/BillingPlanModal.js
// import { useEffect, useState } from "react";
// import styles from "./style.module.scss";
// import { fetchQuotationById } from "../../services/api/quotations";
// import { useParams } from "react-router-dom";

// export default function BillingPlanModal({ onClose, onSave }) {
//   const { quotationId } = useParams();
//   const [quotation, setQuotation] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [steps, setSteps] = useState([
//     { amount: "", date: "", stepsComment: "" },
//   ]);
  
//   const [mainComment, setMainComment] = useState("");
//     const addMainComment = (e) => {
//     setMainComment(e.target.value);
//     };

//   const addStep = () =>
//     setSteps([...steps, { amount: "", date: "", stepsComment: "" }]);

//   const updateStep = (index, field, value) => {
//     const updatedSteps = [...steps];

//     updatedSteps[index][field] = value;
//     setSteps(updatedSteps);
//   };

//  const handleSubmit = (e) => {
//   e.preventDefault();
//   const valid = steps.every((step) => step.amount && step.date);
//   if (!valid) return alert("Veuillez remplir tous les champs.");
//   onSave(steps, mainComment); // <-- ajouter mainComment ici
// };


//   const loadQuotationData = async () => {
//     try {
//       setLoading(true);
//       const data = await fetchQuotationById(quotationId);
//       setQuotation(data);
//     } catch (err) {
//       console.error(err);
//       setError("Impossible de charger les données du devis.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadQuotationData();
//   }, [quotationId]);

//   return (
//     <div className={styles.overlay}>
//       <div className={styles.modal}>
//         <h2>Créer un plan de facturation</h2>

//         <p>infos :</p>

//         {quotation && (
//           <>
//             <p>Montant total HT du devis : {quotation.pre_tax_amount} €</p>
//             <p>Montant total TTC du devis : {quotation.total_amount} €</p>
//             <p>Montant total de la TVA : {quotation.tax_amount} €</p>
//           </>
//         )}

//         <form onSubmit={handleSubmit}>
//           <label>
//             Commentaire principal
//             <input
//               type="text"
//               id="mainComment"
             
//               onChange={(e) => updateStep(0, "mainComment", e.target.value)}
//             />
//           </label>
//           {steps.map((step, index) => (
//             <div key={index} className={styles.step}>
//               <label>
//                 Montant (€)
//                 <input
//                   type="number"
//                   value={step.amount}
//                   onChange={(e) => updateStep(index, "amount", e.target.value)}
//                   required
//                 />
//               </label>
//               <label>
//                 Date
//                 <input
//                   type="date"
//                   value={step.date}
//                   onChange={(e) => updateStep(index, "date", e.target.value)}
//                   required
//                 />
//               </label>

//               {/* comments: "", */}
//               <label>
//                 Commentaire(s)
//                 <input
//                   type="text"
//                   value={step.stepsComment}
//                   onChange={(e) =>
//                     updateStep(index, "stepsComment", e.target.value)
//                   }
//                 />
//               </label>
//             </div>
//           ))}

//           <button type="button" onClick={addStep}>
//             Ajouter un palier
//           </button>
//           <div className={styles.actions}>
//             <button type="submit">Enregistrer</button>
//             <button type="button" onClick={onClose}>
//               Annuler
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
