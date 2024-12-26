import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Template from "./components/Template/Template";
import Home from "./pages/Home/Home";
import Companies from "./pages/companies/companies";
import ProjectDetails from "./components/projectDetails/projectDetails";
import Quotations from "./pages/quotations/quotations";
import Employees from "./pages/employees/employees";
import CompanyDetails from "./pages/companyDetails/companyDetails";
import QuotationAndProjectDetails from "./pages/quotationAndProjectDetails/quotationAndProjectDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Template />}>
          <Route path="/" element={<Home />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/companies/:companyId" element={<CompanyDetails />} />
          <Route path="/quotations/:quotationId/project/:projectId" element={<QuotationAndProjectDetails />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
