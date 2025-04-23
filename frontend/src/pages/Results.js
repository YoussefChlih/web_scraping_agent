import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  List, ListItem, ListItemText, Grid, CircularProgress, Alert,
  Card, CardContent, Divider, IconButton, Chip, Tooltip,
  MenuItem, Select, FormControl, InputLabel, TextField
} from '@mui/material';
import {
  Download as DownloadIcon,
  FileCopy as CopyIcon,
  MoreVert as MoreIcon,
  Share as ShareIcon,
  Code as CodeIcon,
  DeleteOutline as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  VisibilityOff as HideIcon,
  TableChart as TableChartIcon,
  ViewList as ViewListIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

// API Base URL
const API_BASE_URL = 'http://localhost:8000/api';

// TabPanel pour les onglets
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Composant pour afficher les résultats de l'extraction
const Results = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedFields, setSelectedFields] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);

  // Récupérer les données de la tâche
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}`);
        setTaskData(response.data);
        
        // Extraire les champs disponibles pour filtrage
        if (response.data.result) {
          const fields = [];
          Object.entries(response.data.result).forEach(([key, value]) => {
            fields.push(key);
            if (selectedFields.length === 0) {
              setSelectedFields([key]); // Sélectionner le premier champ par défaut
            }
          });
          setAvailableFields(fields);
        }
      } catch (err) {
        setError('Impossible de charger les résultats. Veuillez réessayer.');
        console.error('Erreur lors du chargement des résultats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskData();
    }
  }, [taskId]);

  // Changer d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Télécharger les résultats
  const handleDownload = (format) => {
    if (taskData.output_file) {
      window.open(`${API_BASE_URL}/download/${taskData.output_file}`, '_blank');
    } else {
      toast.error("Fichier non disponible au téléchargement");
    }
  };

  // Copier les données au format JSON
  const handleCopyJSON = () => {
    if (taskData.result) {
      navigator.clipboard.writeText(JSON.stringify(taskData.result, null, 2));
      toast.success("JSON copié dans le presse-papiers");
    }
  };

  // Filtrer les résultats
  const filterResults = (data) => {
    if (!searchTerm) return data;
    
    // Filtrer les données selon le type
    if (Array.isArray(data)) {
      return data.filter(item => {
        if (typeof item === 'string') {
          return item.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (typeof item === 'object' && item !== null) {
          return Object.values(item).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return false;
      });
    }
    return data;
  };

  // Afficher les données selon leur type
  const renderData = (key, data) => {
    if (!data || !selectedFields.includes(key)) return null;
    
    const filteredData = filterResults(data);
    
    if (Array.isArray(filteredData)) {
      if (filteredData.length === 0) {
        return <Typography color="textSecondary">Aucune donnée</Typography>;
      }
      
      // Pour les tableaux d'objets (comme les produits, liens, images)
      if (typeof filteredData[0] === 'object' && filteredData[0] !== null) {
        if (viewMode === 'table') {
          const columns = Object.keys(filteredData[0]);
          
          return (
            <TableContainer component={Paper} sx={{ mt: 2, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    {columns.map(col => (
                      <TableCell key={col}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{idx + 1}</TableCell>
                      {columns.map(col => (
                        <TableCell key={`${idx}-${col}`} sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {typeof item[col] === 'string' && item[col].startsWith('http') ? (
                            <a href={item[col]} target="_blank" rel="noopener noreferrer">
                              {item[col]}
                            </a>
                          ) : (
                            String(item[col] || '')
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          );
        } else {
          return (
            <List sx={{ mt: 2 }}>
              {filteredData.map((item, idx) => (
                <Paper key={idx} sx={{ mb: 2, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Item #{idx + 1}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  {Object.entries(item).map(([k, v]) => (
                    <Box key={k} sx={{ display: 'flex', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 100 }}>
                        {k}:
                      </Typography>
                      <Typography variant="body2">
                        {typeof v === 'string' && v.startsWith('http') ? (
                          <a href={v} target="_blank" rel="noopener noreferrer">{v}</a>
                        ) : (
                          v
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              ))}
            </List>
          );
        }
      } 
      // Pour les tableaux de chaînes (titres, paragraphes, prix)
      else {
        return (
          <List sx={{ mt: 2 }}>
            {filteredData.map((item, idx) => (
              <ListItem key={idx} divider>
                <ListItemText 
                  primary={item} 
                  primaryTypographyProps={{ 
                    component: typeof item === 'string' && item.startsWith('http') ? 'a' : 'span',
                    href: typeof item === 'string' && item.startsWith('http') ? item : undefined,
                    target: typeof item === 'string' && item.startsWith('http') ? '_blank' : undefined,
                  }}
                />
              </ListItem>
            ))}
          </List>
        );
      }
    } else if (typeof filteredData === 'object' && filteredData !== null) {
      return (
        <List>
          {Object.entries(filteredData).map(([k, v]) => (
            <ListItem key={k} divider>
              <ListItemText primary={`${k}: ${v}`} />
            </ListItem>
          ))}
        </List>
      );
    } else {
      return <Typography>{String(filteredData)}</Typography>;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement des résultats...
        </Typography>
      </Container>
    );
  }

  if (error || !taskData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Une erreur s'est produite lors du chargement des résultats."}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard')}
        >
          Retourner au tableau de bord
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête avec informations sur la tâche */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
              Résultats d'extraction
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              URL: <a href={taskData.url} target="_blank" rel="noopener noreferrer">{taskData.url}</a>
            </Typography>
          </Box>
          <Box>
            <Chip 
              label={
                taskData.status === 'completed' ? 'Terminé' :
                taskData.status === 'failed' ? 'Échec' :
                taskData.status === 'running' ? 'En cours' : 'En attente'
              }
              color={
                taskData.status === 'completed' ? 'success' :
                taskData.status === 'failed' ? 'error' :
                taskData.status === 'running' ? 'primary' : 'warning'
              }
              sx={{ fontWeight: 'bold' }}
            />
            <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1, textAlign: 'right' }}>
              {new Date(taskData.timestamp).toLocaleString('fr-FR')}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('csv')}
                disabled={!taskData.output_file}
              >
                Télécharger CSV
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('json')}
                disabled={!taskData.output_file}
              >
                Télécharger JSON
              </Button>
              <Button 
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={handleCopyJSON}
              >
                Copier JSON
              </Button>
              <Button 
                variant="outlined"
                startIcon={<CodeIcon />}
                color="secondary"
              >
                Visualiser
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <IconButton color="primary" onClick={() => window.location.reload()}>
                <RefreshIcon />
              </IconButton>
              <IconButton color="error">
                <DeleteIcon />
              </IconButton>
              <IconButton color="info">
                <ShareIcon />
              </IconButton>
              <IconButton>
                <MoreIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Zone de filtrage et options */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #eee' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Rechercher"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="field-select-label">Afficher les champs</InputLabel>
              <Select
                labelId="field-select-label"
                multiple
                value={selectedFields}
                onChange={(e) => setSelectedFields(e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                label="Afficher les champs"
              >
                {availableFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    {field}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Tooltip title="Vue tableau">
                <IconButton 
                  color={viewMode === 'table' ? 'primary' : 'default'}
                  onClick={() => setViewMode('table')}
                >
                  <TableChartIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Vue liste">
                <IconButton 
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                >
                  <ViewListIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Contenu des résultats */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="onglets de résultats"
            variant="scrollable"
            scrollButtons="auto"
          >
            {taskData.result && Object.keys(taskData.result).map((key, index) => (
              <Tab 
                key={key} 
                label={`${key} (${Array.isArray(taskData.result[key]) ? taskData.result[key].length : 1})`}
                id={`tab-${index}`}
                aria-controls={`tabpanel-${index}`}
                sx={{ textTransform: 'none' }}
                disabled={!selectedFields.includes(key)}
              />
            ))}
            <Tab 
              label="Aperçu JSON" 
              id="tab-json" 
              aria-controls="tabpanel-json"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        {/* Panneau pour chaque type de données */}
        {taskData.result && Object.keys(taskData.result).map((key, index) => (
          <TabPanel key={key} value={tabValue} index={index}>
            <Box sx={{ position: 'relative' }}>
              <Typography variant="h6" gutterBottom>
                {key}
                <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                  ({Array.isArray(taskData.result[key]) ? taskData.result[key].length : 1} éléments)
                </Typography>
              </Typography>
              
              {renderData(key, taskData.result[key])}
            </Box>
          </TabPanel>
        ))}

        {/* Onglet pour l'aperçu JSON */}
        <TabPanel value={tabValue} index={Object.keys(taskData.result || {}).length}>
          <Box sx={{ position: 'relative' }}>
            <Typography variant="h6" gutterBottom>
              Aperçu JSON
            </Typography>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                backgroundColor: 'grey.900', 
                color: 'white',
                borderRadius: 1,
                maxHeight: '500px',
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0 }}>
                {JSON.stringify(taskData.result, null, 2)}
              </pre>
            </Paper>
            
            <Button
              sx={{ mt: 2 }}
              startIcon={<CopyIcon />}
              onClick={handleCopyJSON}
            >
              Copier JSON
            </Button>
          </Box>
        </TabPanel>

        {/* Si aucun résultat */}
        {(!taskData.result || Object.keys(taskData.result).length === 0) && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              Aucune donnée disponible
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Results;
