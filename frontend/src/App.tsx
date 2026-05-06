import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';


export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/upload">Upload</NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
