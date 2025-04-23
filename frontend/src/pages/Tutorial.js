import React, { useState } from 'react';
import {
  Container, Typography, Paper, Box, Stepper, Step, StepLabel, 
  StepContent, Button, Card, CardContent, CardMedia, Grid,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  Tab, Tabs, Alert, Link
} from '@mui/material';
import {
  Check as CheckIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  GetApp as DownloadIcon,
  Code as CodeIcon,
  DataObject as DataIcon,
  Info as InfoIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Images (ici en placeholder - à remplacer par de vraies images)
const placeholderImage = "https://via.placeholder.com/800x400?text=Etape+Image";

// TabPanel pour les onglets
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tutorial-tabpanel-${index}`}
      aria-labelledby={`tutorial-tab-${index}`}
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

const Tutorial = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  // Étapes du tutoriel
  const tutorialSteps = [
    {
      label: 'Entrez une URL',
      description: `Commencez par entrer l'URL complète du site web dont vous souhaitez extraire des données. 
                   Assurez-vous d'inclure le protocole (http:// ou https://).`,
      image: placeholderImage,
      tips: [
        'Utilisez une URL spécifique pointant vers la page exacte contenant les données.',
        'Vérifiez que la page est accessible publiquement.',
        'Pour les sites complexes, considérez l\'option Selenium.'
      ]
    },
    {
      label: 'Configurez l\'extraction',
      description: `Choisissez les options d'extraction adaptées à votre site cible. Activez Selenium 
                   pour les sites dynamiques utilisant JavaScript. Si les données sont réparties sur plusieurs 
                   pages, activez la pagination.`,
      image: placeholderImage,
      tips: [
        'Utilisez Selenium pour les sites avec des éléments dynamiques.',
        'La pagination permet d\'extraire les données de plusieurs pages séquentiellement.',
        'Respectez un délai raisonnable entre les requêtes pour ne pas surcharger le serveur.'
      ]
    },
    {
      label: 'Sélectionnez les éléments',
      description: `L'outil analyse la page et détecte automatiquement les éléments disponibles comme 
                   les titres, paragraphes, images, tableaux, produits, etc. Choisissez les éléments 
                   que vous souhaitez extraire.`,
      image: placeholderImage,
      tips: [
        'Sélectionnez uniquement les données dont vous avez besoin pour optimiser le processus.',
        'Pour les sites e-commerce, l\'élément "Produits" capture généralement le titre, le prix et l\'image.',
        'Les tableaux sont extraits avec leur structure intacte.'
      ]
    },
    {
      label: 'Récupérez vos données',
      description: `Une fois l'extraction terminée, vous pouvez visualiser, télécharger ou copier vos données 
                   dans différents formats. Les résultats sont également sauvegardés dans votre historique 
                   pour un accès ultérieur.`,
      image: placeholderImage,
      tips: [
        'Exportez en CSV pour l\'utilisation avec Excel ou Google Sheets.',
        'Le format JSON est idéal pour l\'intégration avec d\'autres applications.',
        'Utilisez la recherche et les filtres pour explorer vos données extraites.'
      ]
    },
  ];

  // Exemples de code
  const codeExamples = {
    python: `import requests
from bs4 import BeautifulSoup

url = 'https://example.com'
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

titles = [h.text.strip() for h in soup.find_all(['h1', 'h2', 'h3'])]
print(titles)`,
    javascript: `const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://example.com';
axios.get(url)
  .then(response => {
    const $ = cheerio.load(response.data);
    const titles = [];
    
    $('h1, h2, h3').each((i, element) => {
      titles.push($(element).text().trim());
    });
    
    console.log(titles);
  });`,
    api: `curl -X POST "http://localhost:8000/api/scrape" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "elements": ["Titres", "Paragraphes"],
    "use_selenium": false,
    "handle_pagination": false,
    "output_format": "JSON"
  }'`
  };

  // FAQ
  const faqs = [
    {
      question: "Est-il légal d'extraire des données de sites web ?",
      answer: "L'extraction de données est légale si vous respectez les conditions d'utilisation du site, le fichier robots.txt, et que vous n'accédez qu'à des données publiques. Évitez les extractions intensives qui pourraient surcharger les serveurs."
    },
    {
      question: "Comment extraire des données de sites qui utilisent JavaScript ?",
      answer: "Pour les sites dynamiques utilisant JavaScript, activez l'option Selenium qui permet de charger complètement la page et d'exécuter le JavaScript avant l'extraction des données."
    },
    {
      question: "Comment gérer les sites qui nécessitent une authentification ?",
      answer: "Dans la version actuelle, l'authentification n'est pas prise en charge directement via l'interface. Pour ces cas, utilisez l'API avec des cookies d'authentification personnalisés."
    },
    {
      question: "Quelle est la différence entre les formats d'export ?",
      answer: "CSV est idéal pour une utilisation avec des tableurs, JSON conserve la structure complète des données et est adapté à l'intégration avec d'autres applications, Excel crée un fichier .xlsx prêt à l'emploi, et Texte offre un format simple et lisible."
    },
    {
      question: "Les extractions sont-elles limitées ?",
      answer: "Il n'y a pas de limite stricte au nombre d'extractions, mais nous recommandons de respecter des délais raisonnables entre les requêtes pour ne pas surcharger les serveurs cibles."
    }
  ];

  // Bonnes pratiques
  const bestPractices = [
    {
      title: "Respectez les conditions d'utilisation",
      description: "Vérifiez toujours les conditions d'utilisation du site cible pour vous assurer que l'extraction de données est autorisée."
    },
    {
      title: "Respectez le robots.txt",
      description: "Le fichier robots.txt contient des directives sur ce qui peut être extrait. Notre outil le vérifie automatiquement, mais soyez conscient des restrictions."
    },
    {
      title: "Utilisez des délais raisonnables",
      description: "Évitez les extractions trop fréquentes ou intensives qui pourraient surcharger le serveur cible. Utilisez des délais entre les requêtes."
    },
    {
      title: "Limitez les données extraites",
      description: "N'extrayez que les données dont vous avez réellement besoin, pour une meilleure performance et un moindre impact sur le site cible."
    },
    {
      title: "Sécurisez les données extraites",
      description: "Si vous extrayez des données publiques mais sensibles, assurez-vous de les stocker de manière sécurisée et conforme au RGPD."
    },
    {
      title: "Attribuez la source",
      description: "Lorsque vous utilisez des données extraites, mentionnez leur source et n'utilisez pas les données comme si elles étaient les vôtres."
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #eee' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Guide d'utilisation
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="tutorial tabs"
          sx={{ mb: 2 }}
        >
          <Tab label="Tutoriel pas à pas" />
          <Tab label="Exemples de code" />
          <Tab label="FAQ" />
          <Tab label="Bonnes pratiques" />
        </Tabs>

        {/* Onglet Tutoriel */}
        <TabPanel value={tabValue} index={0}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {tutorialSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="h6">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body1" paragraph>
                        {step.description}
                      </Typography>
                      
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                        Conseils :
                      </Typography>
                      <List dense>
                        {step.tips.map((tip, i) => (
                          <ListItem key={i}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={tip} />
                          </ListItem>
                        ))}
                      </List>
                      
                      <Box sx={{ mb: 2, mt: 2 }}>
                        <div>
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            {index === tutorialSteps.length - 1 ? 'Terminer' : 'Continuer'}
                          </Button>
                          <Button
                            disabled={index === 0}
                            onClick={handleBack}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            Précédent
                          </Button>
                        </div>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardMedia
                          component="img"
                          image={step.image}
                          alt={step.label}
                          sx={{ height: 'auto', maxHeight: 300, objectFit: 'contain' }}
                        />
                      </Card>
                    </Grid>
                  </Grid>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === tutorialSteps.length && (
            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tutoriel terminé !
              </Typography>
              <Typography paragraph>
                Vous êtes maintenant prêt à utiliser l'outil d'extraction de données web.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/extraction')}
                sx={{ mr: 1 }}
              >
                Commencer une extraction
              </Button>
              <Button onClick={handleReset} sx={{ mt: { xs: 1, sm: 0 } }}>
                Revoir le tutoriel
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Onglet Exemples de code */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Exemples de code pour l'extraction de données
          </Typography>
          <Typography paragraph>
            Voici quelques exemples de code pour extraire des données web avec différents langages et notre API.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold">
                Python avec Beautiful Soup
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', borderRadius: 1, overflow: 'auto' }}>
                <pre>{codeExamples.python}</pre>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                JavaScript avec Axios et Cheerio
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', borderRadius: 1, overflow: 'auto' }}>
                <pre>{codeExamples.javascript}</pre>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                API REST avec cURL
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', borderRadius: 1, overflow: 'auto' }}>
                <pre>{codeExamples.api}</pre>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Alert severity="info">
              Pour une documentation complète de l'API, consultez notre <Link href="/api-docs" color="primary">documentation API</Link>.
            </Alert>
          </Box>
        </TabPanel>

        {/* Onglet FAQ */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Questions fréquemment posées
          </Typography>
          
          {faqs.map((faq, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {faq.question}
              </Typography>
              <Typography variant="body1" paragraph>
                {faq.answer}
              </Typography>
              {index < faqs.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
          
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              Si vous avez d'autres questions, n'hésitez pas à consulter notre documentation complète ou à contacter notre support.
            </Alert>
          </Box>
        </TabPanel>

        {/* Onglet Bonnes pratiques */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Bonnes pratiques pour l'extraction de données web
          </Typography>
          <Typography paragraph>
            Suivez ces recommandations pour une extraction de données éthique et efficace.
          </Typography>
          
          <Grid container spacing={3}>
            {bestPractices.map((practice, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%', border: '1px solid #eee', boxShadow: 'none' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {practice.title}
                    </Typography>
                    <Typography variant="body2">
                      {practice.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Alert severity="warning">
              L'extraction de données doit toujours être réalisée de manière responsable et éthique, en respectant les règles et les conditions d'utilisation des sites web.
            </Alert>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Tutorial;
