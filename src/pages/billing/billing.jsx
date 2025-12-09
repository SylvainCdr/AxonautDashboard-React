import styles from "./style.module.scss";
import { useState, useEffect, useRef, useCallback } from "react";
import { db, auth } from "../../firebase/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { format, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import BillingSummaryChart from "../../components/billingSummaryChart/billingSummaryChart";
import YearlyBillingBarChart from "../../components/yearlyBillingBarChart/yearlyBillingBarChart";
import BillingPlanExtractModal from "../../components/billingPlanExtractModal/billingPlanExtractModal.jsx";

export default function Billing() {
  const [monthlyBilling, setMonthlyBilling] = useState({});
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const currentDate = new Date();
  const [openYears, setOpenYears] = useState(() => {
    const currentYear = currentDate.getFullYear();
    return { [currentYear]: true };
  });

  const monthRefs = useRef({});
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const toggleModal = () => setShowModal(!showModal);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchPlansGroupedByMonth = async () => {
      try {
        const snapshot = await getDocs(collection(db, "billingPlans"));
        const monthlyData = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const { projectTitle, quotationId, steps, generatedBy } = data;

          steps.forEach((step, index) => {
            const stepDate = new Date(step.date);
            const monthKey = format(stepDate, "MMMM yyyy", { locale: fr });

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                total: 0,
                items: [],
                dateSample: stepDate,
              };
            }

            const invoiced = step.invoiced || false;
            const amount =
              parseFloat(step.amount || 0) + parseFloat(step.revision || 0);

            monthlyData[monthKey].items.push({
              quotationId,
              title: decodeHtmlEntities(projectTitle),
              date: stepDate,
              reliability: step.reliability,
              stepsComment: step.stepsComment,
              amount: parseFloat(step.amount || 0),
              revision: parseFloat(step.revision || 0),
              invoiced,
              generatedBy: generatedBy || "Inconnu",
              docId: docSnap.id,
              stepIndex: index,
              totalSteps: steps.length,
            });

            if (!invoiced) monthlyData[monthKey].total += amount;
          });
        });

        setMonthlyBilling(monthlyData);

        let currentMonthKey = null;
        for (const [key, value] of Object.entries(monthlyData)) {
          if (isSameMonth(value.dateSample, currentDate)) {
            currentMonthKey = key;
            break;
          }
        }

        if (currentMonthKey) {
          setSelectedMonthKey(currentMonthKey);
          if (monthRefs.current[currentMonthKey]) {
            monthRefs.current[currentMonthKey].scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        } else {
          const keys = Object.entries(monthlyData).sort(
            ([, a], [, b]) => b.dateSample - a.dateSample
          );
          if (keys.length > 0) setSelectedMonthKey(keys[0][0]);
        }
      } catch (err) {
        console.error("Erreur chargement plans mensuels :", err);
      }
    };

    fetchPlansGroupedByMonth();
  }, []);

  const handleToggleInvoiced = (docId, stepIndex, currentValue) => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <p style={{ marginBottom: "10px", marginTop: "20px" }}>
            Confirmer la modification de l'état de facturation ?{" "}
          </p>
          <button
            onClick={async () => {
              try {
                const planRef = doc(db, "billingPlans", docId);
                const planSnap = await getDocs(collection(db, "billingPlans"));
                const planDoc = planSnap.docs.find((d) => d.id === docId);
                const planData = planDoc.data();

                planData.steps[stepIndex].invoiced = !currentValue;
                await updateDoc(planRef, { steps: planData.steps });

                const updated = { ...monthlyBilling };
                Object.keys(updated).forEach((monthKey) => {
                  updated[monthKey].items = updated[monthKey].items.map(
                    (item) => {
                      if (
                        item.docId === docId &&
                        item.stepIndex === stepIndex
                      ) {
                        item.invoiced = !currentValue;
                      }
                      return item;
                    }
                  );

                  updated[monthKey].total = updated[monthKey].items.reduce(
                    (sum, item) =>
                      !item.invoiced ? sum + item.amount + item.revision : sum,
                    0
                  );
                });

                setMonthlyBilling(updated);
                toast.success("Mise à jour réussie !");
                closeToast();
              } catch (error) {
                console.error("Erreur lors de la mise à jour :", error);
                toast.error("Erreur lors de la mise à jour");
              }
            }}
            style={{ marginBottom: "10px" }}
          >
            ✅ Confirmer
          </button>
          <button onClick={closeToast}>❌ Annuler</button>
        </div>
      ),
      { autoClose: false }
    );
  };

  const sortedMonths = Object.entries(monthlyBilling).sort(
    ([, a], [, b]) => b.dateSample - a.dateSample
  );

  function formatEuro(amount) {
    return amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function isDatePastOrToday(date) {
    const today = new Date();
    return (
      date.getFullYear() < today.getFullYear() ||
      (date.getFullYear() === today.getFullYear() &&
        (date.getMonth() < today.getMonth() ||
          (date.getMonth() === today.getMonth() &&
            date.getDate() <= today.getDate())))
    );
  }

  const yearlyTotals = {};
  Object.values(monthlyBilling).forEach((month) => {
    const year = month.dateSample.getFullYear();
    if (!yearlyTotals[year])
      yearlyTotals[year] = { toBeInvoiced: 0, alreadyInvoiced: 0 };
    month.items.forEach((item) => {
      const amount = item.amount + item.revision;
      if (item.invoiced) yearlyTotals[year].alreadyInvoiced += amount;
      else yearlyTotals[year].toBeInvoiced += amount;
    });
  });

  const selectedYear =
    selectedMonthKey &&
    monthlyBilling[selectedMonthKey]?.dateSample?.getFullYear();

  const monthsByYear = {};
  sortedMonths.forEach(([monthKey, data]) => {
    const year = data.dateSample.getFullYear();
    if (!monthsByYear[year]) monthsByYear[year] = [];
    monthsByYear[year].push([monthKey, data]);
  });

  const toggleYear = (year) =>
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));

  const getTotalReliableToBeInvoiced = () => {
    if (!selectedMonthKey) return 0;
    const monthData = monthlyBilling[selectedMonthKey];
    if (!monthData) return 0;
    return monthData.items.reduce((sum, item) => {
      const amount = item.amount + item.revision;
      return !item.invoiced && parseInt(item.reliability) === 100
        ? sum + amount
        : sum;
    }, 0);
  };

  const getTotalReliable75ToBeInvoiced = () => {
    if (!selectedMonthKey) return 0;
    const monthData = monthlyBilling[selectedMonthKey];
    if (!monthData) return 0;
    return monthData.items.reduce((sum, item) => {
      const amount = item.amount + item.revision;
      return !item.invoiced && parseInt(item.reliability) === 75
        ? sum + amount
        : sum;
    }, 0);
  };

  const totalReliableToBeInvoiced = getTotalReliableToBeInvoiced();
  const totalReliable75ToBeInvoiced = getTotalReliable75ToBeInvoiced();

  // Fonction pour filtrer les éléments selon le terme de recherche
  const filterItemsBySearch = (items) => {
    if (!searchTerm.trim()) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.generatedBy.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Fonction pour gérer le clic sur un en-tête de colonne
  const handleSort = useCallback(
    (key) => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  // Fonction pour trier les données
  const sortData = useCallback(
    (data) => {
      if (!sortConfig.key) return data;

      return [...data].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Gestion spéciale pour les différents types de données
        if (sortConfig.key === "date") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (sortConfig.key === "amount") {
          aValue = a.amount + a.revision;
          bValue = b.amount + b.revision;
        } else if (sortConfig.key === "reliability") {
          aValue = parseInt(aValue) || 0;
          bValue = parseInt(bValue) || 0;
        } else if (sortConfig.key === "generatedBy") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        } else if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    },
    [sortConfig]
  );

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return " ↕️";
    }
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  // Fonction pour appliquer le tri et le filtrage
  const processItems = useCallback(
    (items) => {
      const filteredItems = filterItemsBySearch(items);
      return sortData(filteredItems);
    },
    [searchTerm, sortConfig, filterItemsBySearch, sortData]
  );
  return (
    <div className={styles.billingContainer}>
      {showModal && (
        <BillingPlanExtractModal
          onClose={toggleModal}
          billingData={monthlyBilling}
        />
      )}

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>
            📊 Plan de Facturation
            {selectedMonthKey && (
              <span className={styles.selectedMonth}>{selectedMonthKey}</span>
            )}
          </h1>
          <button onClick={toggleModal} className={styles.extractButton}>
            📋 Extraction
          </button>
        </div>
      </div>
      <div className={styles.twoColumns}>
        <aside className={styles.monthSidebar}>
          <div className={styles.sidebarHeader}>
            <h3>📅 Navigation mensuelle</h3>
          </div>
          {Object.entries(monthsByYear)
            .sort((a, b) => b[0] - a[0])
            .map(([year, months]) => {
              const isOpen = openYears[year];
              return (
                <div key={year} className={styles.yearSection}>
                  <div
                    onClick={() => toggleYear(year)}
                    className={styles.yearHeader}
                  >
                    <span className={styles.yearToggle}>
                      {isOpen ? "📂" : "📁"}
                    </span>
                    <span className={styles.yearText}>{year}</span>
                  </div>
                  {isOpen &&
                    months.map(([month, data]) => {
                      const isCurrentMonth = isSameMonth(
                        data.dateSample,
                        currentDate
                      );
                      const isSelected = selectedMonthKey === month;
                      return (
                        <div
                          key={month}
                          ref={(el) => el && (monthRefs.current[month] = el)}
                          className={`${styles.monthItem} ${
                            isCurrentMonth ? styles.currentMonth : ""
                          } ${isSelected ? styles.selectedMonthItem : ""}`}
                          onClick={() => setSelectedMonthKey(month)}
                        >
                          <div className={styles.monthHeader}>
                            <span className={styles.monthIcon}>📊</span>
                            <strong className={styles.monthName}>
                              {month.charAt(0).toUpperCase() + month.slice(1)}
                            </strong>
                            {isCurrentMonth && (
                              <span className={styles.currentBadge}>
                                Actuel
                              </span>
                            )}
                          </div>
                          <div className={styles.monthAmount}>
                            {formatEuro(data.total)} €
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
        </aside>

        <main className={styles.monthDetails}>
          <div className={styles.charts}>
            <div className={styles.chart1}>
              <div className={styles.chartContainer}>
                {selectedMonthKey && (
                  <BillingSummaryChart
                    dataForMonth={monthlyBilling[selectedMonthKey]}
                    monthName={selectedMonthKey}
                  />
                )}
              </div>

              <div className={styles.summarySection}>
                <div className={styles.reliabilityCompact}>
                  <div className={styles.reliabilityItem}>
                    <span className={styles.reliabilityIcon}>💎</span>
                    <div className={styles.reliabilityContent}>
                      <span className={styles.reliabilityLabel}>
                        Fiabilité 100%
                      </span>
                      <span className={styles.reliabilityAmount}>
                        {formatEuro(totalReliableToBeInvoiced)} €
                      </span>
                    </div>
                  </div>
                  <div className={styles.reliabilityItem}>
                    <span className={styles.reliabilityIcon}>⚡</span>
                    <div className={styles.reliabilityContent}>
                      <span className={styles.reliabilityLabel}>
                        Fiabilité 75%
                      </span>
                      <span className={styles.reliabilityAmount}>
                        {formatEuro(totalReliable75ToBeInvoiced)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.chart2}>
              <YearlyBillingBarChart monthlyBilling={monthlyBilling} />
              {selectedYear && yearlyTotals[selectedYear] && (
                <div className={styles.yearlyTotalsCompact}>
                  <h3>📊 {selectedYear}</h3>
                  <div className={styles.compactStats}>
                    <div className={styles.statLine + " " + styles.invoiced}>
                      <span className={styles.statLabel}>Facturé</span>
                      <span className={styles.statValue}>
                        {formatEuro(yearlyTotals[selectedYear].alreadyInvoiced)}{" "}
                        €
                      </span>
                    </div>
                    <div className={styles.statLine + " " + styles.pending}>
                      <span className={styles.statLabel}>À facturer</span>
                      <span className={styles.statValue}>
                        {formatEuro(yearlyTotals[selectedYear].toBeInvoiced)} €
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedMonthKey && monthlyBilling[selectedMonthKey] ? (
            (() => {
              const allItems = monthlyBilling[selectedMonthKey].items;
              const toBeInvoiced = allItems.filter((item) => !item.invoiced);
              const alreadyInvoiced = allItems.filter((item) => item.invoiced);

              const sortedToBeInvoiced = [...toBeInvoiced].sort((a, b) => {
                if (a.generatedBy === currentUser.email) return -1;
                if (b.generatedBy === currentUser.email) return 1;
                return 0;
              });

              const sortedAlreadyInvoiced = [...alreadyInvoiced].sort(
                (a, b) => {
                  if (a.generatedBy === currentUser.email) return -1;
                  if (b.generatedBy === currentUser.email) return 1;
                  return 0;
                }
              );

              return (
                <>
                  <div className={styles.detailsHeader}>
                    <h3>🔍 Détails de facturation</h3>

                    {/* Champ de recherche amélioré */}
                    <div className={styles.searchContainer}>
                      <div className={styles.searchInputWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                          type="text"
                          placeholder="Rechercher par nom d'affaire ou établi par..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={styles.searchInput}
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className={styles.clearButton}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tableau Reste à facturer */}
                  <div className={styles.sectionHeader}>
                    <h4 className={styles.toBillHeader}>
                      ⏳ Reste à facturer
                      <span className={styles.itemCount}>
                        ({processItems(sortedToBeInvoiced).length})
                      </span>
                    </h4>
                  </div>
                  <table className={styles.billingTable}>
                    <thead>
                      <tr>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("title")}
                        >
                          Affaire{getSortIcon("title")}
                        </th>
                        <th>Étape</th>
                        <th>Commentaire</th>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("generatedBy")}
                        >
                          Etabli par{getSortIcon("generatedBy")}
                        </th>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("date")}
                        >
                          Date{getSortIcon("date")}
                        </th>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("amount")}
                        >
                          Montant(€){getSortIcon("amount")}
                        </th>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("reliability")}
                        >
                          Fiabilité{getSortIcon("reliability")}
                        </th>
                        <th>Facturé?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processItems(sortedToBeInvoiced).map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <Link
                              to={`/quotation/${item.quotationId}/billing-plan`}
                            >
                              {item.title.slice(0, 150) +
                                (item.title.length > 150 ? "..." : "")}
                            </Link>
                          </td>
                          <td>
                            {item.stepIndex + 1}/{item.totalSteps}
                          </td>
                          <td>{item.stepsComment}</td>
                          <td>{item.generatedBy.split(".")[0]}</td>
                          <td
                            className={
                              isDatePastOrToday(item.date)
                                ? styles.pastDate
                                : ""
                            }
                          >
                            {new Date(item.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td>{formatEuro(item.amount + item.revision)}</td>
                          <td>
                            {item.reliability
                              ? item.reliability + "%"
                              : "Non défini"}
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={item.invoiced}
                              onChange={() =>
                                handleToggleInvoiced(
                                  item.docId,
                                  item.stepIndex,
                                  item.invoiced
                                )
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Tableau Déjà facturé */}
                  <div className={styles.sectionHeader}>
                    <h4 className={styles.billedHeader}>
                      ✅ Déjà facturé
                      <span className={styles.itemCount}>
                        ({processItems(sortedAlreadyInvoiced).length})
                      </span>
                    </h4>
                  </div>
                  <table className={styles.billingTable}>
                    <thead>
                      <tr>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("title")}
                        >
                          Affaire{getSortIcon("title")}
                        </th>
                        <th>Étape</th>
                        <th>Commentaire</th>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("generatedBy")}
                        >
                          Etabli par{getSortIcon("generatedBy")}
                        </th>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("date")}
                        >
                          Date{getSortIcon("date")}
                        </th>
                        <th
                          className={styles.sortableHeader}
                          onClick={() => handleSort("amount")}
                        >
                          Montant (€){getSortIcon("amount")}
                        </th>
                        <th>Facturé ?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processItems(sortedAlreadyInvoiced).map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <Link
                              to={`/quotation/${item.quotationId}/billing-plan`}
                            >
                              {item.title.slice(0, 150) +
                                (item.title.length > 150 ? "..." : "")}
                            </Link>
                          </td>
                          <td>
                            {item.stepIndex + 1}/{item.totalSteps}
                          </td>
                          <td>{item.stepsComment}</td>
                          <td>{item.generatedBy.split(".")[0]}</td>
                          <td>
                            {new Date(item.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td>{formatEuro(item.amount + item.revision)}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={item.invoiced}
                              onChange={() =>
                                handleToggleInvoiced(
                                  item.docId,
                                  item.stepIndex,
                                  item.invoiced
                                )
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              );
            })()
          ) : (
            <p>Sélectionne un mois pour voir les détails.</p>
          )}
        </main>
      </div>
    </div>
  );
}
