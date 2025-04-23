import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button,
  Card, CardContent, CardActions, Divider, List,
  ListItem, ListItemText, ListItemIcon, CircularProgress,
  LinearProgress, Chip, Avatar, IconButton
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  InsertChart as ChartIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  QueryStats as StatsIcon,
  ArrowForward as ArrowForwardIcon,
  Help as HelpIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Composant pour afficher les statistiques
const StatCard = ({ title, value, icon, color }) => (
  <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #eee' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="textSecondary" fontWeight="medium" fontSize="1rem">
          {title}
        </Typography>
        <Avatar sx={{ backgroundColor: `${color}.light`, color: `${color}.main` }}>
          {icon}
        </Avatar>
      </Box>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

// Composant pour afficher une tâche récente
const TaskItem = ({ task, onView, onDelete }) => {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <CircularProgress size={20} />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'completed':
        return 'Terminé';
      case 'failed':
        return 'Échec';
      case 'running':
        return 'En cours';
      default:
        return 'En attente';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <ListItem 
      divider 
      sx={{ 
        borderLeft: `4px solid ${
          task.status === 'completed' ? 'success.main' : 
          task.status === 'failed' ? 'error.main' : 
          task.status === 'running' ? 'primary.main' : 'warning.main'
        }`,
        pl: 2,
        pr: 1,
        py: 1,
        '&:hover': { backgroundColor: 'action.hover' }
      }}
    >
      <ListItemIcon>
        {getStatusIcon()}
      </ListItemIcon>
      <ListItemText 
        primary={<Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>{task.url}</Typography>}
        secondary={formatDate(task.timestamp)}
      />
      <Chip 
        size="small" 
        label={getStatusText()}
        color={
          task.status === 'completed' ? 'success' : 
          task.status === 'failed' ? 'error' : 
          task.status === 'running' ? 'primary' : 'warning'
        }
        sx={{ ml: 1, mr: 2 }}
      />
      <Box>
        <IconButton size="small" onClick={() => onView(task.id)} disabled={task.status === 'running'}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(task.id)} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </ListItem>
  );
};

const Dashboard = ({ recentTasks = [] }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    running: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const calculateStats = () => {
      if (recentTasks && recentTasks.length > 0) {
        setStats({
          total: recentTasks.length,
          completed: recentTasks.filter(t => t.status === 'completed').length,
          running: recentTasks.filter(t => t.status === 'running').length,
          failed: recentTasks.filter(t => t.status === 'failed').length,
        });
      }
      setLoading(false);
    };

    calculateStats();
  }, [recentTasks]);

  // Handlers
  const handleViewTask = (taskId) => {
    navigate(`/results/${taskId}`);
  };

  const handleDeleteTask = (taskId) => {
    // Logique pour supprimer la tâche (à implémenter avec le backend)
    console.log(`Supprimer tâche: ${taskId}`);
  };

  const handleNewExtraction = () => {
    navigate('/extraction');
  };

  // Stats pour le dashboard
  const statsCards = [
    { title: 'Extractions totales', value: stats.total, icon: <StatsIcon />, color: 'primary' },
    { title: 'Extractions réussies', value: stats.completed, icon: <SuccessIcon />, color: 'success' },
    { title: 'Extractions en cours', value: stats.running, icon: <PendingIcon />, color: 'info' },
    { title: 'Extractions échouées', value: stats.failed, icon: <ErrorIcon />, color: 'error' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Section en-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Tableau de bord
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Actualiser
        </Button>
      </Box>

      {/* Section statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Section tâches récentes */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="medium">
                Extractions récentes
              </Typography>
              <Button 
                variant="text" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/history')}
              >
                Voir tout
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : recentTasks.length > 0 ? (
              <List disablePadding>
                {recentTasks.slice(0, 5).map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onView={handleViewTask} 
                    onDelete={handleDeleteTask} 
                  />
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Aucune extraction récente
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleNewExtraction}
                  sx={{ mt: 2 }}
                >
                  Nouvelle extraction
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid #eee' }}>
            <Typography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
              Actions rapides
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                size="large"
                onClick={handleNewExtraction}
              >
                Nouvelle extraction
              </Button>
              
              <Button 
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<ChartIcon />}
                onClick={() => navigate('/results/recent')}
              >
                Voir les résultats
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<CodeIcon />}
                color="secondary"
                onClick={() => navigate('/api')}
              >
                API & Intégrations
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<HelpIcon />}
                color="info"
                onClick={() => navigate('/tutorial')}
              >
                Tutoriel
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
