import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Stepper, Step, StepLabel, 
  Button, TextField, FormControlLabel, Checkbox, MenuItem,
  Box, Grid, Chip, CircularProgress, Divider, Alert
} from '@mui/material';
import { toast } from 'react-toastify';
import { 
  Cloud as CloudIcon, 
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Étapes du processus d'extraction
const steps = ['URL', 'Configuration', 'Éléments', 'Extraction', 'Résultats'];

const Extraction = ({ addTask }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [url, setUrl] = useState('');
  const [useSelenium, setUseSelenium] = useState(false);
  const [handlePagination, setHandlePagination] = useState(false);
  const [maxPages, setMaxPages] = useState(5);
  const [outputFormat, setOutputFormat] = useState('JSON');
  const [availableElements, setAvailableElements] = useState({});
  const [selectedElements, setSelectedElements] = useState([]);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState('');
  const [progress, setProgress] = useState(0);

  const websocket = useRef(null);

  // Valider l'URL
  useEffect(() => {
    const validateUrl = () => {
      try {
        const urlObj = new URL(url);
        setIsValidUrl(urlObj.protocol === 'http:' || urlObj.protocol === 'https:');
      } catch {
        setIsValidUrl(false);
      }
    };
    validateUrl();
  }, [url]);

  // Charger les éléments disponibles lorsque l'URL est validée
  const fetchAvailableElements = async () => {
    if (!isValidUrl) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/elements?url=${encodeURIComponent(url)}`);
      setAvailableElements(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des éléments:', err);
      setError('Impossible d\'analyser la page. Vérifiez l\'URL ou essayez d\'utiliser Selenium.');
    } finally {
      setIsLoading(false);
    }
  };

  // Connecter au WebSocket pour les mises à jour en temps réel
  const connectWebSocket = (id) => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${id}`);
    
    ws.onopen = () => {
      console.log('WebSocket connecté');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Mise à jour WebSocket:', data);
      
      setTaskStatus(data.status);
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      
      if (data.status === 'completed') {
        toast.success('Extraction terminée avec succès!');
        navigate(`/results/${id}`);
      } else if (data.status === 'failed') {
        toast.error(`Erreur: ${data.error || 'Échec de l\'extraction'}`);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      toast.error('Problème de connexion aux mises à jour en temps réel');
    };
    
    websocket.current = ws;
    return ws;
  };

  // Nettoyer la connexion WebSocket à la déconnexion
  useEffect(() => {
    return () => {
      if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
        websocket.current.close();
      }
    };
  }, []);

  // Démarrer l'extraction
  const startExtraction = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/scrape`, {
        url,
        elements: selectedElements,
        use_selenium: useSelenium,
        handle_pagination: handlePagination,
        max_pages: maxPages,
        output_format: outputFormat
      });
      
      const { task_id } = response.data;
      setTaskId(task_id);
      
      // Ajout de la tâche à l'historique
      addTask({
        id: task_id,
        url,
        timestamp: new Date().toISOString(),
        status: 'running',
      });
      
      // Connecter au WebSocket pour les mises à jour
      connectWebSocket(task_id);
      
      // Passer à la dernière étape
      setActiveStep(4);
    } catch (err) {
      console.error('Erreur lors du démarrage de l\'extraction:', err);
      setError('Impossible de démarrer l\'extraction. Veuillez réessayer.');
      toast.error('Échec du démarrage de l\'extraction');
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer les changements d'étape
  const handleNext = () => {
    if (activeStep === 0 && isValidUrl) {
      fetchAvailableElements();
    } else if (activeStep === 3) {
      startExtraction();
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Gérer la sélection des éléments
  const toggleElement = (element) => {
    if (selectedElements.includes(element)) {
      setSelectedElements(selectedElements.filter(e => e !== element));
    } else {
      setSelectedElements([...selectedElements, element]);
    }
  };

  // Contenu par étape
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="URL du site à extraire"
              variant="outlined"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              error={!isValidUrl && url !== ''}
              helperText={!isValidUrl && url !== '' ? 'Veuillez entrer une URL valide (ex: https://www.example.com)' : ''}
              sx={{ mb: 3 }}
            />
            <Typography variant="body2" color="textSecondary">
              Entrez l'URL complète du site web dont vous souhaitez extraire les données.
            </Typography>
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={useSelenium} 
                  onChange={(e) => setUseSelenium(e.target.checked)} 
                />
              }
              label="Utiliser Selenium pour les sites dynamiques (JavaScript)"
            />
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={handlePagination} 
                  onChange={(e) => setHandlePagination(e.target.checked)} 
                />
              }
              label="Extraire plusieurs pages (pagination)"
            />
            {handlePagination && (
              <TextField
                type="number"
                label="Nombre maximum de pages"
                value={maxPages}
                onChange={(e) => setMaxPages(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{ inputProps: { min: 1, max: 100 } }}
                sx={{ ml: 3, width: 150 }}
              />
            )}
            <Divider sx={{ my: 2 }} />
            <TextField
              select
              label="Format de sortie"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            >
              <MenuItem value="JSON">JSON</MenuItem>
              <MenuItem value="CSV">CSV</MenuItem>
              <MenuItem value="Excel">Excel</MenuItem>
              <MenuItem value="Texte">Texte</MenuItem>
            </TextField>
          </Box>
        );
        
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : Object.keys(availableElements).length === 0 ? (
              <Typography>
                Aucun élément trouvé sur cette page. Essayez d'utiliser Selenium pour les sites dynamiques.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {Object.entries(availableElements).map(([element, count]) => (
                  count > 0 && (
                    <Grid item xs={12} sm={6} md={4} key={element}>
                      <Chip
                        label={`${element} (${count})`}
                        onClick={() => toggleElement(element)}
                        color={selectedElements.includes(element) ? "primary" : "default"}
                        sx={{ width: '100%', height: 40, fontSize: '1rem' }}
                      />
                    </Grid>
                  )
                ))}
              </Grid>
            )}
            {Object.keys(availableElements).length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1">
                  Éléments sélectionnés: {selectedElements.length}
                </Typography>
              </Box>
            )}
          </Box>
        );
        
      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résumé de l'extraction
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">URL:</Typography>
                <Typography variant="body2" color="textSecondary">{url}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Configuration:</Typography>
                <Typography variant="body2" color="textSecondary">
                  {useSelenium ? '✅' : '❌'} Selenium | 
                  {handlePagination ? `✅ Pagination (${maxPages} pages)` : '❌ Pagination'} | 
                  Format: {outputFormat}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Éléments à extraire:</Typography>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedElements.map(element => (
                    <Chip 
                      key={element} 
                      label={element} 
                      size="small" 
                      color="primary" 
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 4:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            {isLoading || taskStatus === 'running' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress 
                  variant="determinate" 
                  value={progress} 
                  size={80} 
                  thickness={4}
                  sx={{ mb: 3 }}
                />
                <Typography variant="h6">
                  Extraction en cours... {progress}%
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Veuillez patienter pendant que nous extrayons vos données.
                </Typography>
              </Box>
            ) : taskStatus === 'completed' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CheckIcon color="success" sx={{ fontSize: 80, mb: 3 }} />
                <Typography variant="h6">
                  Extraction terminée avec succès!
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate(`/results/${taskId}`)}
                  sx={{ mt: 3 }}
                >
                  Voir les résultats
                </Button>
              </Box>
            ) : taskStatus === 'failed' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ErrorIcon color="error" sx={{ fontSize: 80, mb: 3 }} />
                <Typography variant="h6">
                  L'extraction a échoué
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {error || "Une erreur s'est produite lors de l'extraction."}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setActiveStep(0)}
                  sx={{ mt: 3 }}
                >
                  Réessayer
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CloudIcon color="primary" sx={{ fontSize: 80, mb: 3 }} />
                <Typography variant="h6">
                  Prêt à démarrer l'extraction
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={startExtraction}
                  sx={{ mt: 3 }}
                >
                  Lancer l'extraction
                </Button>
              </Box>
            )}
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Extraire des données web
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button 
            disabled={activeStep === 0 || activeStep === 4}
            onClick={handleBack}
          >
            Précédent
          </Button>
          
          {activeStep < 4 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={(activeStep === 0 && !isValidUrl) || 
                       (activeStep === 2 && selectedElements.length === 0) ||
                       isLoading}
            >
              {activeStep === 3 ? 'Extraire' : 'Suivant'}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Extraction;
