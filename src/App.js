import { BrowserRouter, Routes, Route } from "react-router-dom";
import Template from "./components/Template/Template";
import Home from "./pages/Home/Home";
import Login from "./pages/login/login";
import Companies from "./pages/companies/companies";
import ProjectDetails from "./components/projectDetails/projectDetails";
import Quotations from "./pages/quotations/quotations";
import Employees from "./pages/employees/employees";
import CompanyDetails from "./pages/companyDetails/companyDetails";
import QuotationAndProjectDetails from "./pages/quotationAndProjectDetails/quotationAndProjectDetails";
import Billing from "./pages/billing/billing";
import SupplyStudy from "./pages/supplyStudy/supplyStudy";

import BillingPlan from "./pages/billingPlan/billingPlan";
import Opportunities from "./pages/opportunities/opportunities";

import ProtectedRoute from "./utils/protectedRoute";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique */}
        <Route path="/" element={<Login />} />

        {/* Routes protégées */}
        <Route
          element={
            <ProtectedRoute>
              <Template />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/companies/:companyId" element={<CompanyDetails />} />
          <Route
            path="/quotations/:quotationId/project/:projectId"
            element={<QuotationAndProjectDetails />}
          />
          <Route
            path="/supply-study/:duplicateQuotationId"
            element={<SupplyStudy />}
          />
          <Route path="/billing" element={<Billing />} />
          <Route
            path="/quotation/:quotationId/billing-plan"
            element={<BillingPlan />}
          />
          <Route path="/opportunities" element={<Opportunities />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
