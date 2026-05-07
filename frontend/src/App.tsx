import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/common/Sidebar/Sidebar';
import Topbar from './components/common/Topbar/Topbar';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import IncomePage from './pages/IncomePage';
import BudgetPage from './pages/BudgetPage';
import ToastContainer from './components/common/Toast/Toast';
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
              <Route path="/" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
              <Route path="/transactions" element={<ErrorBoundary><TransactionsPage /></ErrorBoundary>} />
              <Route path="/categories" element={<ErrorBoundary><CategoriesPage /></ErrorBoundary>} />
              <Route path="/income" element={<ErrorBoundary><IncomePage /></ErrorBoundary>} />
              <Route path="/upload" element={<ErrorBoundary><UploadPage /></ErrorBoundary>} />
              <Route path="/budget" element={<ErrorBoundary><BudgetPage /></ErrorBoundary>} />
            </Routes>
          </main>
        </div>
      </div>
      <ToastContainer />
    </BrowserRouter>
  );
}
