import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Template from "./components/Template/Template";
import Home from "./pages/Home/Home";
import Companies from "./pages/companies/companies";
import Projects from "./pages/projects/projects";
import ProjectDetails from "./pages/projectDetails/projectDetails";
import Quotations from "./pages/quotations/quotations";
import QuotationDetails from "./pages/quotationDetails/quotationDetails";
import Employees from "./pages/employees/employees";
import CompanyDetails from "./pages/companyDetails/companyDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Template />}>
          <Route path="/" element={<Home />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/quotations/:quotationId" element={<QuotationDetails />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/companies/:companyId" element={<CompanyDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
