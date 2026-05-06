import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/common/Sidebar/Sidebar';
import Topbar from './components/common/Topbar/Topbar';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Sidebar />
        <div className={styles.main}>
          <Topbar />
          <main className={styles.content}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/upload" element={<UploadPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
