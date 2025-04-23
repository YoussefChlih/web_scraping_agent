import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages et composants
import Dashboard from './pages/Dashboard';
import Extraction from './pages/Extraction';
import Results from './pages/Results';
import History from './pages/History';
import Settings from './pages/Settings';
import API from './pages/API';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Tutorial from './pages/Tutorial';

// Style global
import './styles/globals.css';

// Fonction pour créer un thème avec support du mode sombre
const createAppTheme = (darkMode) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#2e7d32',
    },
    secondary: {
      main: '#1976d2',
    },
    background: {
      default: darkMode ? '#121212' : '#f5f5f5',
      paper: darkMode ? '#1e1e1e' : '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [recentTasks, setRecentTasks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const theme = createAppTheme(darkMode);
  
  // Charger les préférences et tâches récentes depuis le localStorage
  useEffect(() => {
    // Charger les tâches récentes
    const savedTasks = localStorage.getItem('recentTasks');
    if (savedTasks) {
      setRecentTasks(JSON.parse(savedTasks));
    }
    
    // Charger les préférences de thème
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);
  
  // Fonction pour ajouter une nouvelle tâche
  const addTask = (task) => {
    const updatedTasks = [task, ...recentTasks.filter(t => t.id !== task.id).slice(0, 9)]; // Limiter à 10 tâches
    setRecentTasks(updatedTasks);
    localStorage.setItem('recentTasks', JSON.stringify(updatedTasks));
  };
  
  // Fonction pour mettre à jour le statut d'une tâche
  const updateTaskStatus = (taskId, status) => {
    const updatedTasks = recentTasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    );
    setRecentTasks(updatedTasks);
    localStorage.setItem('recentTasks', JSON.stringify(updatedTasks));
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app">
          <Header 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            toggleDarkMode={toggleDarkMode} 
            darkMode={darkMode}
          />
          <div className="content-container">
            <Sidebar isOpen={isSidebarOpen} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route 
                  path="/dashboard" 
                  element={<Dashboard recentTasks={recentTasks} />} 
                />
                <Route 
                  path="/extraction" 
                  element={<Extraction addTask={addTask} />} 
                />
                <Route 
                  path="/results/:taskId" 
                  element={<Results updateTaskStatus={updateTaskStatus} />} 
                />
                <Route 
                  path="/results/recent" 
                  element={
                    recentTasks.length > 0 
                      ? <Navigate to={`/results/${recentTasks[0].id}`} replace /> 
                      : <Navigate to="/dashboard" replace />
                  } 
                />
                <Route 
                  path="/history" 
                  element={<History tasks={recentTasks} updateTasks={setRecentTasks} />} 
                />
                <Route path="/settings" element={<Settings />} />
                <Route path="/api" element={<API />} />
                <Route path="/tutorial" element={<Tutorial />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </ThemeProvider>
  );
}

export default App;
