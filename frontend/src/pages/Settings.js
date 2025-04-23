import React, { useState } from 'react';
import {
  Container, Typography, Paper, Box, Button, Divider,
  TextField, FormControl, FormControlLabel, Switch,
  Grid, Alert, Snackbar, Select, MenuItem, InputLabel,
  Accordion, AccordionSummary, AccordionDetails, Slider,
  Tabs, Tab, List, ListItem, ListItemText, IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

// TabPanel pour les onglets
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    // Paramètres généraux
    apiBaseUrl: 'http://localhost:8000/api',
    darkMode: false,
    language: 'fr',
    
    // Paramètres d'extraction
    defaultDelay: 2,
    maxRetries: 3,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    respectRobotsTxt: true,
    
    // Paramètres d'export
    defaultExportFormat: 'JSON',
    includeMeta: true,
    prettyPrint: true,
  });
  
  // Historique des tâches (simulé)
  const [history, setHistory] = useState([
    { id: 'task-1', date: '2023-06-15T10:30:00Z', url: 'https://example.com/page1' },
    { id: 'task-2', date: '2023-06-14T14:45:00Z', url: 'https://example.com/page2' },
    { id: 'task-3', date: '2023-06-12T08:20:00Z', url: 'https://example.com/page3' },
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSettingChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings({ ...settings, [field]: value });
  };

  const handleSliderChange = (field) => (event, newValue) => {
    setSettings({ ...settings, [field]: newValue });
  };

  const handleSaveSettings = () => {
    // Logique pour sauvegarder les paramètres
    // localStorage.setItem('webScraperSettings', JSON.stringify(settings));
    toast.success('Paramètres enregistrés avec succès');
  };

  const handleClearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      setHistory([]);
      toast.info('Historique effacé');
    }
  };

  const handleDeleteHistoryItem = (taskId) => {
    setHistory(history.filter(task => task.id !== taskId));
    toast.info('Tâche supprimée de l\'historique');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #eee' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Paramètres
        </Typography>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{ mb: 2 }}
        >
          <Tab label="Général" />
          <Tab label="Extraction" />
          <Tab label="Export" />
          <Tab label="Historique" />
        </Tabs>

        {/* Onglet Général */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL de l'API"
                value={settings.apiBaseUrl}
                onChange={handleSettingChange('apiBaseUrl')}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Langue</InputLabel>
                <Select
                  value={settings.language}
                  onChange={handleSettingChange('language')}
                  label="Langue"
                >
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={handleSettingChange('darkMode')}
                  />
                }
                label="Mode sombre"
                sx={{ mt: 2 }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Extraction */}
        <TabPanel value={tabValue} index={1}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Configuration HTTP</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography gutterBottom>Délai entre les requêtes (secondes)</Typography>
                  <Slider
                    value={settings.defaultDelay}
                    onChange={handleSliderChange('defaultDelay')}
                    valueLabelDisplay="auto"
                    step={0.5}
                    marks
                    min={0.5}
                    max={10}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography gutterBottom>Nombre maximal de tentatives</Typography>
                  <Slider
                    value={settings.maxRetries}
                    onChange={handleSliderChange('maxRetries')}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={10}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="User-Agent"
                    value={settings.userAgent}
                    onChange={handleSettingChange('userAgent')}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.respectRobotsTxt}
                        onChange={handleSettingChange('respectRobotsTxt')}
                      />
                    }
                    label="Respecter le fichier robots.txt"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Configuration Selenium</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert severity="info" sx={{ mb: 2 }}>
                Selenium est utilisé pour extraire des données de sites web dynamiques utilisant JavaScript.
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={() => {}}
                      />
                    }
                    label="Activer Selenium pour les sites dynamiques"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography gutterBottom>Temps d'attente pour le chargement des pages (secondes)</Typography>
                  <Slider
                    value={3}
                    valueLabelDisplay="auto"
                    step={0.5}
                    marks
                    min={1}
                    max={10}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {/* Onglet Export */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Format d'export par défaut</InputLabel>
                <Select
                  value={settings.defaultExportFormat}
                  onChange={handleSettingChange('defaultExportFormat')}
                  label="Format d'export par défaut"
                >
                  <MenuItem value="JSON">JSON</MenuItem>
                  <MenuItem value="CSV">CSV</MenuItem>
                  <MenuItem value="Excel">Excel</MenuItem>
                  <MenuItem value="Texte">Texte</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.includeMeta}
                    onChange={handleSettingChange('includeMeta')}
                  />
                }
                label="Inclure les métadonnées dans l'export"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.prettyPrint}
                    onChange={handleSettingChange('prettyPrint')}
                  />
                }
                label="Formater les exports JSON (pretty print)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                Les fichiers exportés sont enregistrés dans le dossier de sortie configuré sur le serveur.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Historique */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Historique des extractions</Typography>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />}
              onClick={handleClearHistory}
              disabled={history.length === 0}
            >
              Effacer l'historique
            </Button>
          </Box>
          
          {history.length === 0 ? (
            <Alert severity="info">Aucun historique disponible</Alert>
          ) : (
            <List>
              {history.map((task) => (
                <ListItem
                  key={task.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteHistoryItem(task.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                  divider
                >
                  <ListItemText
                    primary={task.url}
                    secondary={`Extrait le ${formatDate(task.date)}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Bouton de sauvegarde */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Réinitialiser
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
          >
            Enregistrer les paramètres
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings;
