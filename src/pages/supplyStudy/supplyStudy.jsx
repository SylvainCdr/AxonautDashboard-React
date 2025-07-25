import React, { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { useParams } from "react-router-dom";
import { db, auth } from "../../firebase/firebase";
import { getDoc, updateDoc, doc, setDoc } from "firebase/firestore";
import { getUserByUid } from "../../utils/getUserByUid";
import { DotLoader } from "react-spinners";
import {
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import GaugeChart from "react-gauge-chart";
import { toast } from "react-toastify";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";

export default function SupplyStudy() {
  const { duplicateQuotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  // on récupère le uid de l'utilisateur connecté
  const user = auth.currentUser;

  // const totalLineAmountSold = (line) => line.quantity * line.price;
  const totalLineAmountReal = (line) => line.final_quantity * line.actual_cost;

  // Charge les données du devis
  useEffect(() => {
    const fetchDuplicateQuotation = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "supplyStudy", duplicateQuotationId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setQuotation(snapshot.data());
        } else {
          setError("Aucun devis dupliqué trouvé pour cet ID.");
          setQuotation({ quotation_lines: [] }); // Éviter le null
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du devis :", err);
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };

    fetchDuplicateQuotation();
  }, [duplicateQuotationId]);

  useEffect(() => {
    if (quotation && quotation.established_by) {
      const fetchUserEmail = async () => {
        try {
          const user = await getUserByUid(quotation.established_by);
          setUserEmail(user?.email || "Inconnu");
        } catch (err) {
          console.error("Erreur lors de la récupération de l'email :", err);
        }
      };

      fetchUserEmail();
    }
  }, [quotation]);

  // Met à jour les champs modifiables
  const handleChange = (originalIndex, field, value) => {
    const updatedLines = [...quotation.quotation_lines];
    updatedLines[originalIndex][field] = value;
    setQuotation((prev) => ({
      ...prev,
      quotation_lines: updatedLines,
    }));
  };

  // Ajoute une nouvelle ligne en bas des chapters
  const addNewLineToChapter = (chapter) => {
    const newLine = {
      product_code: "",
      product_name: "",
      quantity: 0,
      final_quantity: 0,
      price: 0,
      unit_job_costing: 0,
      actual_cost: 0,
      new_line: true,
      chapter: chapter, // Associer la nouvelle ligne à ce chapitre
    };

    setQuotation((prev) => ({
      ...prev,
      quotation_lines: [...prev.quotation_lines, newLine],
    }));

    toast.success(`Nouvelle ligne ajoutée au chapitre "${chapter}" !`);
  };

  const addNewChapter = () => {
    const newChapter = prompt("Nom du nouveau chapitre :");

    if (newChapter) {
      const newLine = {
        product_code: "",
        product_name: "",
        quantity: 0,
        final_quantity: 0,
        price: 0,
        unit_job_costing: 0,
        actual_cost: 0,
        new_line: true,
        chapter: newChapter, // Associer la nouvelle ligne à ce chapitre
      };

      setQuotation((prev) => ({
        ...prev,
        quotation_lines: [...prev.quotation_lines, newLine],
      }));

      toast.success(`Nouveau chapitre "${newChapter}" ajouté !`);
    }
  };

  const removeNewLine = (originalIndex) => {
    setQuotation((prev) => ({
      ...prev,
      quotation_lines: prev.quotation_lines.filter(
        (_, i) => i !== originalIndex
      ),
    }));
    toast.success("Ligne supprimée !");
  };

  const saveChanges = async () => {
    try {
      const realCostTotal = quotation.quotation_lines.reduce(
        (acc, line) =>
          acc + (line.final_quantity || 0) * (line.actual_cost || 0),
        0
      );

      const realMarginValue = quotation.quotation_lines.reduce(
        (acc, line) =>
          acc +
          (line.pre_tax_amount || 0) -
          (line.final_quantity || 0) * (line.actual_cost || 0),
        0
      );

      const realMarginPercent =
        quotation.pre_tax_amount > 0
          ? (realMarginValue / quotation.pre_tax_amount) * 100
          : 0;

      const comments = quotation.comments || "";

      const updatedQuotation = {
        ...quotation,
        real_margin_percent: parseFloat(realMarginPercent.toFixed(2)),
        real_margin_value: parseFloat(realMarginValue.toFixed(2)),
        real_cost_total: parseFloat(realCostTotal.toFixed(2)),
        comments,
        established_by: user.uid,
        established_date: new Date().toISOString(),
      };

      const docRef = doc(db, "supplyStudy", duplicateQuotationId);

      // Utilisation de `setDoc` avec `merge: true` pour créer ou mettre à jour
      await setDoc(docRef, updatedQuotation, { merge: true });

      toast.success("Modifications enregistrées avec succès !");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde des modifications :", err);
      toast.error("Erreur lors de la sauvegarde des modifications.");
    }
  };

  // ajoute le champs etude terminée boolean dans la base de données
  // Fonction pour finaliser l'étude et persister les données du tfooter
  const finalizeApproStudy = async () => {
    try {
      // Mise à jour dans Firebase
      const docRef = doc(db, "supplyStudy", duplicateQuotationId);
      await updateDoc(docRef, {
        ...quotation,
        supply_study_finished: true,
      });

      toast.success("L'étude a été notifiée comme finalisée !");
    } catch (err) {
      console.error("Erreur lors de la finalisation de l'étude :", err);
      alert("Erreur lors de la finalisation de l'étude.");
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <DotLoader color="#C60F7B" loading={loading} size={60} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  // preparation des données pour la jauge avec les marges, on reprend les marges des t footer, si 100% alors on affiche : etude d'appro nécessaire

  const data = [
    { value: ((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(1) },
    {
      value:
        quotation.pre_tax_amount > 0
          ? (
              (quotation.quotation_lines.reduce(
                (acc, line) =>
                  acc +
                  (line.pre_tax_amount || 0) -
                  (line.final_quantity || 0) * (line.actual_cost || 0),
                0
              ) /
                quotation.pre_tax_amount) *
              100
            ).toFixed(1)
          : "0",
    },
  ];

  const gaugeStyle = {
    width: "300px",
  };

  // Préparation des données pour le graphique
  const chartData = [
    {
      name: "Total",
      "Prix vendu": quotation.quotation_lines
        .reduce((acc, line) => acc + (line.pre_tax_amount || 0), 0)
        .toFixed(2),
      "Coût de revient initial": quotation.quotation_lines
        .reduce(
          (acc, line) =>
            acc + (line.quantity || 0) * (line.unit_job_costing || 0),
          0
        )
        .toFixed(2),
      "Coût réel": quotation.quotation_lines
        .reduce(
          (acc, line) =>
            acc + (line.final_quantity || 0) * (line.actual_cost || 0),
          0
        )
        .toFixed(2),
      "Marge prévi": quotation.quotation_lines
        .reduce(
          (acc, line) =>
            acc +
            (line.pre_tax_amount || 0) -
            (line.quantity || 0) * (line.unit_job_costing || 0),
          0
        )
        .toFixed(2),
      "Marge réelle": quotation.pre_tax_amount
        ? quotation.quotation_lines
            .reduce(
              (acc, line) =>
                acc +
                (line.pre_tax_amount || 0) -
                (line.final_quantity || 0) * (line.actual_cost || 0),
              0
            )
            .toFixed(2)
        : 0,
    },
  ];

  // fin config graphique

  return (
    <div className={styles.duplicateQuotationContainer}>
      <h1>
        <i
          className="fa-solid fa-file-alt"
          style={{ color: "#ffff", marginRight: "15px" }}
        ></i>
        étude de projet / appro - {quotation.number}
      </h1>

      <div className={styles.section1}>
        <div className={styles.section1Left}>
          <img
            src="https://img.icons8.com/?size=250&id=112158&format=png&color=000000"
            alt=""
          />
        </div>
        <div className={styles.section1Center}>
          <p>
            <strong>Numéro :</strong> {quotation.number}
          </p>
          <p>
            <strong>Titre :</strong> {decodeHtmlEntities(quotation.title)}
          </p>
          <p>
            <strong>Date :</strong>{" "}
            {new Date(quotation.date).toLocaleDateString()}
          </p>
          <p>
            <strong>Montant Commande HT :</strong>{" "}
            {quotation.pre_tax_amount.toFixed(2)} €
          </p>

          <br />
          <p>
            <strong>Remise globale %:</strong>{" "}
            {(
              (quotation.global_discount_amount / quotation.pre_tax_amount) *
              100
            ).toFixed(1)}{" "}
            %
          </p>
          <p>
            <strong>Remise globale:</strong> {quotation.global_discount_amount}{" "}
            €
          </p>
          <br />

          <p>
            <strong>Marge Commande %:</strong>{" "}
            {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(1)} %
          </p>
          <p>
            <strong>Marge Commande:</strong> {quotation.margin.toFixed(2)} €{" "}
          </p>
        </div>
        <div className={styles.section1Right}>
          {/* // Jauges avec les marges,  si 100% alors on affiche : etude d'appro nécessaire */}

          {/* // affiché qui a fait l etude et la date de l etude  si les données sont présentes */}
          <h2>
            {" "}
            {quotation.supply_study_finished
              ? "étude terminée"
              : "étude a réaliser / en cours"}
          </h2>
          <p>
            {" "}
            {quotation.established_by && quotation.established_date
              ? `Réalisée par ${userEmail} le ${new Date(
                  quotation.established_date
                ).toLocaleDateString()}`
              : ""}
          </p>

          <div className={styles.gaugeChart}>
            {data.map(
              (entry, index) =>
                entry.value !== "100" && (
                  <div key={index} className={styles.gaugeContainer}>
                    <h4>
                      {index === 0 ? "Marge commerciale" : "Marge réelle"}
                    </h4>

                    <GaugeChart
                      id={`gauge-chart-${index}`}
                      arcsLength={[0.15, 0.13, 0.27, 0.45]}
                      arcWidth={0.3}
                      colors={[" #F07167", "#FFBC42", "#91F5AD", "#009fe3"]}
                      percent={entry.value / 100}
                      textColor="#000"
                      needleColor="#4909c069"
                      style={gaugeStyle}
                    />
                  </div>
                )
            )}
          </div>
          {data[1].value === "100" && (
            <p className={styles.waitingMessage}>
              ⚠️ En attente de l'étude d'appro
            </p>
          )}
        </div>
      </div>

      <div className={styles.section2}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Prix vendu" fill="#0088FE" />
            <Bar dataKey="Coût de revient initial" fill="#FF8042" />
            <Bar dataKey="Coût réel" fill="#00C49F" />
            <Bar dataKey="Marge prévi" fill="#FFBB28" />
            <Bar dataKey="Marge réelle" fill="#c783ff" />
          </BarChart>
        </ResponsiveContainer>

        {/* Vérification des champs renseignés */}
        {quotation.quotation_lines.some(
          (line) => !line.final_quantity || !line.actual_cost
        ) && (
          <p className={styles.warningMessage}>
            ⚠️ Attention : Certaines lignes ne contiennent pas de "Quantité
            finale" ou de "Coût réel". Les données du graphique pourraient ne
            pas être représentatives.
          </p>
        )}
      </div>

      <div className={styles.section3}>
        <h2>
          <i
            className="fa-solid fa-list"
            style={{ color: "#4520ff", marginRight: "10px" }}
          ></i>
          Lignes du devis
        </h2>
        {quotation.quotation_lines && quotation.quotation_lines.length > 0 ? (
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Désignation</th>
                  <th>Qté initiale</th>
                  <th>Qté finale</th>
                  <th>PV</th>
                  <th>Remise</th>
                  <th>PV Total</th>
                  <th>PA unit</th>
                  <th>PA Total</th>
                  <th>Marge co %</th>
                  <th>Coût réel unit</th>
                  <th>Total réel</th>
                  <th>Total marge réelle %</th>
                  <th>X</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(
                  quotation.quotation_lines.reduce((groups, line, index) => {
                    const chapter = line.chapter || "Autres";
                    if (!groups[chapter]) {
                      groups[chapter] = [];
                    }
                    groups[chapter].push({ ...line, originalIndex: index });
                    return groups;
                  }, {})
                ).map(([chapter, lines], chapterIndex) => {
                  // 🔹 Calcul des totaux et marges par chapitre
                  const totalHT = lines.reduce(
                    (acc, line) => acc + (line.pre_tax_amount || 0),
                    0
                  );
                  const totalPA = lines.reduce(
                    (acc, line) =>
                      acc + (line.quantity || 0) * (line.unit_job_costing || 0),
                    0
                  );
                  const totalRealCost = lines.reduce(
                    (acc, line) => acc + totalLineAmountReal(line),
                    0
                  );

                  const marginComm =
                    totalHT > 0 ? ((totalHT - totalPA) / totalHT) * 100 : 0;
                  const marginReal =
                    totalHT > 0
                      ? ((totalHT - totalRealCost) / totalHT) * 100
                      : 0;

                  return (
                    <React.Fragment key={chapterIndex}>
                      <tr className={styles.chapterRow}>
                        <td colSpan="13" className={styles.chapterHeader}>
                          <strong>{decodeHtmlEntities(chapter)}</strong>
                        </td>
                      </tr>

                      {lines.map((line, index) => {
                        const discountPercentage =
                          line.pre_tax_amount > 0
                            ? ((line.pre_tax_amount -
                                line.quantity * line.price) /
                                line.pre_tax_amount) *
                              100
                            : 0;

                        const commercialMargin =
                          line.pre_tax_amount > 0
                            ? ((line.pre_tax_amount -
                                line.quantity * line.unit_job_costing) /
                                line.pre_tax_amount) *
                              100
                            : 0;

                        const realMargin =
                          line.pre_tax_amount > 0
                            ? ((line.pre_tax_amount -
                                totalLineAmountReal(line)) /
                                line.pre_tax_amount) *
                              100
                            : 0;

                        return (
                          <tr
                            key={index}
                            className={`${
                              line.new_line ? styles.newLine : ""
                            } ${realMargin === 100 ? styles.fullMargin : ""}`}
                          >
                            <td>
                              <input
                                type="text"
                                value={line.product_code || ""}
                                onChange={(e) =>
                                  handleChange(
                                    line.originalIndex,
                                    "product_code",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={line.product_name || ""}
                                onChange={(e) =>
                                  handleChange(
                                    line.originalIndex,
                                    "product_name",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>{line.quantity > 0 ? line.quantity : "N/A"}</td>
                            <td>
                              <input
                                className={styles.numInput}
                                type="number"
                                value={line.final_quantity || ""}
                                onChange={(e) =>
                                  handleChange(
                                    line.originalIndex,
                                    "final_quantity",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </td>
                            <td>{line.price > 0 ? `${line.price} €` : "-"}</td>
                            <td>
                              {!isNaN(discountPercentage)
                                ? discountPercentage.toFixed(1)
                                : "0.0"}{" "}
                              %
                            </td>
                            <td>
                              {line.pre_tax_amount > 0
                                ? `${line.pre_tax_amount.toFixed(2)} €`
                                : "-"}
                            </td>
                            <td>
                              {line.unit_job_costing > 0
                                ? `${line.unit_job_costing.toFixed(2)} €`
                                : "-"}
                            </td>
                            <td>
                              {line.quantity > 0
                                ? (
                                    line.quantity * line.unit_job_costing
                                  ).toFixed(2)
                                : "-"}{" "}
                              €
                            </td>
                            <td>
                              {!isNaN(commercialMargin)
                                ? commercialMargin.toFixed(1)
                                : "0.0"}{" "}
                              %
                            </td>
                            <td>
                              <input
                                className={styles.numInput}
                                type="number"
                                value={line.actual_cost || ""}
                                onChange={(e) =>
                                  handleChange(
                                    line.originalIndex,
                                    "actual_cost",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </td>
                            <td>
                              {totalLineAmountReal(line) > 0
                                ? `${totalLineAmountReal(line).toFixed(2)} €`
                                : "-"}
                            </td>
                            <td
                              className={
                                realMargin > 50
                                  ? styles.green
                                  : realMargin > 30
                                  ? styles.blue
                                  : realMargin >= 15
                                  ? styles.orange
                                  : realMargin < 0
                                  ? styles.red
                                  : styles.red
                              }
                            >
                              {!isNaN(realMargin)
                                ? realMargin.toFixed(1)
                                : "0.0"}{" "}
                              %
                              <span>
                                {realMargin > 50 && "🔥"}
                                {realMargin > 30 && realMargin <= 50 && "✅"}
                                {realMargin >= 15 && realMargin <= 30 && "⚠️"}
                                {realMargin < 0 && "☠️"}
                                {realMargin >= 0 && realMargin < 15 && "⬇️"}
                              </span>
                            </td>
                            {/* Bouton de suppression */}
                            {line.new_line && (
                              <td>
                                <button
                                  className={styles.deleteButton}
                                  onClick={() =>
                                    removeNewLine(line.originalIndex)
                                  }
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}

                      <tr className={styles.chapterTotals}>
                        <td colSpan="8">
                          <strong>Total {decodeHtmlEntities(chapter)} :</strong>
                        </td>

                        <td>
                          <strong>{totalPA.toFixed(2)} €</strong>
                        </td>
                        <td>
                          <strong>{marginComm.toFixed(1)} %</strong>
                        </td>
                        <td></td>
                        <td>
                          <strong>{totalRealCost.toFixed(2)} €</strong>
                        </td>
                        <td
                          className={
                            marginReal > 50
                              ? styles.green
                              : marginReal > 30
                              ? styles.blue
                              : marginReal >= 15
                              ? styles.orange
                              : marginReal < 0
                              ? styles.red
                              : styles.red
                          }
                        >
                          <strong>{marginReal.toFixed(1)} %</strong>
                          <span>
                            {marginReal > 50 && "🔥"}
                            {marginReal > 30 && marginReal <= 50 && "✅"}
                            {marginReal >= 15 && marginReal <= 30 && "⚠️"}
                            {marginReal < 0 && "☠️"}
                            {marginReal >= 0 && marginReal < 15 && "⬇️"}
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td colSpan="13" className={styles.addLineRow}>
                          <button
                            onClick={() => addNewLineToChapter(chapter)}
                            className={styles.addButton}
                          >
                            <i className="fa-solid fa-plus"></i> Ajouter une
                            ligne
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                <tr>
                  <td colSpan="13" className={styles.addLineRow}>
                    <button
                      onClick={() => addNewChapter()}
                      className={styles.addChapterButton}
                    >
                      <i className="fa-solid fa-plus"></i> Ajouter un chapitre
                    </button>
                  </td>
                </tr>
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan="6">Total</td>
                  <td>
                    {/* Total prix vendu */}
                    {quotation.quotation_lines
                      .reduce(
                        (acc, line) => acc + (line.pre_tax_amount || 0),
                        0
                      )
                      .toFixed(2)}{" "}
                    €
                  </td>
                  <td></td>

                  <td>
                    {/* Total coût de revient initial */}
                    {quotation.quotation_lines
                      .reduce(
                        (acc, line) =>
                          acc +
                          (line.quantity || 0) * (line.unit_job_costing || 0),
                        0
                      )
                      .toFixed(2)}{" "}
                    €
                  </td>
                  <td>
                    {/* Total marge commerciale en %*/}
                    {quotation.pre_tax_amount > 0
                      ? (
                          (quotation.quotation_lines.reduce(
                            (acc, line) =>
                              acc +
                              (line.pre_tax_amount || 0) -
                              (line.quantity || 0) *
                                (line.unit_job_costing || 0),
                            0
                          ) /
                            quotation.pre_tax_amount) *
                          100
                        ).toFixed(1)
                      : "0"}{" "}
                    %
                  </td>

                  <td></td>

                  {/* total des coûts */}
                  <td>
                    {quotation.quotation_lines
                      .reduce(
                        (acc, line) =>
                          acc +
                          (line.final_quantity || 0) * (line.actual_cost || 0),
                        0
                      )
                      .toFixed(2)}{" "}
                    €
                  </td>
                  <td>
                    {/* Marge réelle totale */}
                    {quotation.pre_tax_amount > 0
                      ? (
                          (quotation.quotation_lines.reduce(
                            (acc, line) =>
                              acc +
                              (line.pre_tax_amount || 0) -
                              (line.final_quantity || 0) *
                                (line.actual_cost || 0),
                            0
                          ) /
                            quotation.pre_tax_amount) *
                          100
                        ).toFixed(1)
                      : "0"}{" "}
                    %
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p>Aucune ligne de devis disponible.</p>
        )}
      </div>

      <div className={styles.comments}>
        <h2>Commentair(e)s :</h2>
        <textarea
          value={quotation.comments}
          onChange={(e) =>
            setQuotation((prev) => ({
              ...prev,
              comments: e.target.value,
            }))
          }
        />
      </div>

      <div className={styles.buttons}>
        <button onClick={saveChanges} className={styles.saveButton}>
          Enregistrer les modifications
        </button>

        {/* // bouton pour notifier que l etude est finalisée */}
        <button onClick={finalizeApproStudy} className={styles.saveButton}>
          Notifier comme étude terminée
        </button>
      </div>
    </div>
  );
}
