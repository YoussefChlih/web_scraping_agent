import React, { useState } from 'react';
import {
  Container, Typography, Paper, Box, Grid, Divider,
  Tabs, Tab, Card, CardContent, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Code as CodeIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-tabpanel-${index}`}
      aria-labelledby={`api-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const API = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // API endpoints
  const endpoints = [
    {
      method: 'POST',
      path: '/api/scrape',
      description: 'Démarre une tâche d\'extraction',
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'URL du site à extraire' },
        { name: 'elements', type: 'array', required: false, description: 'Types d\'éléments à extraire' },
        { name: 'use_selenium', type: 'boolean', required: false, description: 'Utiliser Selenium pour les sites dynamiques' },
        { name: 'handle_pagination', type: 'boolean', required: false, description: 'Activer l\'extraction de plusieurs pages' },
        { name: 'max_pages', type: 'integer', required: false, description: 'Nombre maximum de pages à extraire' },
        { name: 'output_format', type: 'string', required: false, description: 'Format d\'export (JSON, CSV, Excel, Texte)' }
      ],
      returns: '{ "task_id": "string", "message": "string" }'
    },
    {
      method: 'GET',
      path: '/api/tasks/{task_id}',
      description: 'Récupère l\'état d\'une tâche d\'extraction',
      parameters: [
        { name: 'task_id', type: 'string', required: true, description: 'ID de la tâche' }
      ],
      returns: '{ "task_id": "string", "status": "string", "progress": "integer", ... }'
    },
    {
      method: 'GET',
      path: '/api/elements',
      description: 'Analyse les éléments disponibles sur une page',
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'URL du site à analyser' }
      ],
      returns: '{ "Titres": "integer", "Paragraphes": "integer", ... }'
    },
    {
      method: 'WS',
      path: '/ws/{task_id}',
      description: 'WebSocket pour les mises à jour en temps réel sur l\'avancement de l\'extraction',
      parameters: [
        { name: 'task_id', type: 'string', required: true, description: 'ID de la tâche' }
      ],
      returns: '{ "task_id": "string", "status": "string", "progress": "integer", ... }'
    }
  ];

  // Code examples
  const codeExamples = {
    python: `import requests

# Démarrer une extraction
response = requests.post("http://localhost:8000/api/scrape", json={
    "url": "https://example.com",
    "elements": ["Titres", "Paragraphes"],
    "use_selenium": False,
    "output_format": "JSON"
})

task_id = response.json()["task_id"]
print(f"Tâche démarrée: {task_id}")

# Vérifier l'état de l'extraction
status_response = requests.get(f"http://localhost:8000/api/tasks/{task_id}")
print(status_response.json())`,

    javascript: `// Démarrer une extraction
fetch('http://localhost:8000/api/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    elements: ['Titres', 'Paragraphes'],
    use_selenium: false,
    output_format: 'JSON'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Tâche démarrée:', data.task_id);
  
  // Vérifier l'état avec WebSocket
  const ws = new WebSocket(\`ws://localhost:8000/ws/\${data.task_id}\`);
  
  ws.onmessage = (event) => {
    const statusData = JSON.parse(event.data);
    console.log('Mise à jour:', statusData);
    
    if (statusData.status === 'completed' || statusData.status === 'failed') {
      ws.close();
    }
  };
});`,

    curl: `# Démarrer une extraction
curl -X POST "http://localhost:8000/api/scrape" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "elements": ["Titres", "Paragraphes"],
    "use_selenium": false,
    "output_format": "JSON"
  }'

# Vérifier l'état de l'extraction
curl -X GET "http://localhost:8000/api/tasks/{task_id}"`
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CodeIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            API & Intégrations
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          Intégrez facilement notre outil d'extraction de données web dans vos applications grâce à notre API REST complète.
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="api tabs"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Endpoints" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Exemples de code" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="Authentification" icon={<SecurityIcon />} iconPosition="start" />
        </Tabs>

        {/* Endpoints Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Endpoints de l'API
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Notre API est disponible à l'adresse <code>http://localhost:8000</code> ou sur votre serveur de déploiement.
          </Typography>
          
          {endpoints.map((endpoint, index) => (
            <Card 
              key={index} 
              elevation={0} 
              sx={{ 
                mb: 3, 
                borderLeft: '4px solid', 
                borderColor: endpoint.method === 'GET' ? 'success.main' : 
                             endpoint.method === 'POST' ? 'primary.main' :
                             endpoint.method === 'WS' ? 'info.main' : 'warning.main',
                border: '1px solid #eee',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={endpoint.method} 
                    color={endpoint.method === 'GET' ? 'success' : 
                           endpoint.method === 'POST' ? 'primary' :
                           endpoint.method === 'WS' ? 'info' : 'warning'}
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="subtitle1" component="code" sx={{ fontFamily: 'monospace' }}>
                    {endpoint.path}
                  </Typography>
                </Box>
                
                <Typography variant="body2" paragraph>
                  {endpoint.description}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Paramètres:
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Requis</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {endpoint.parameters.map((param, paramIndex) => (
                        <TableRow key={paramIndex}>
                          <TableCell><code>{param.name}</code></TableCell>
                          <TableCell>{param.type}</TableCell>
                          <TableCell>{param.required ? 'Oui' : 'Non'}</TableCell>
                          <TableCell>{param.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Renvoie:
                </Typography>
                <Box sx={{ backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                  <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace' }}>
                    {endpoint.returns}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </TabPanel>

        {/* Code Examples Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Exemples de code
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Python
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white', borderRadius: 1, mb: 4 }}>
            <pre style={{ margin: 0, overflow: 'auto' }}>
              {codeExamples.python}
            </pre>
          </Paper>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            JavaScript
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white', borderRadius: 1, mb: 4 }}>
            <pre style={{ margin: 0, overflow: 'auto' }}>
              {codeExamples.javascript}
            </pre>
          </Paper>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            cURL
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white', borderRadius: 1 }}>
            <pre style={{ margin: 0, overflow: 'auto' }}>
              {codeExamples.curl}
            </pre>
          </Paper>
        </TabPanel>

        {/* Authentication Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Authentification
            </Typography>
            <Typography variant="body1" paragraph>
              L'API est actuellement accessible sans authentification en mode développement local.
            </Typography>
            <Typography variant="body1" paragraph>
              Pour une utilisation en production, nous recommandons d'activer l'authentification par API key ou OAuth2.
            </Typography>
          </Box>
          
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'warning.light', borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <InfoIcon color="warning" sx={{ mr: 2, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Mode développement
                </Typography>
                <Typography variant="body2">
                  L'authentification n'est pas obligatoire en environnement de développement local, mais est fortement recommandée pour la production.
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Typography variant="subtitle1" gutterBottom>
            Configuration de l'authentification
          </Typography>
          
          <Typography variant="body2" paragraph>
            Pour activer l'authentification, modifiez le fichier <code>web_scraping_platform.py</code> et ajoutez un middleware d'authentification.
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'common.white', borderRadius: 1 }}>
            <pre style={{ margin: 0, overflow: 'auto' }}>
{`# Exemple d'ajout d'authentification par API key
from fastapi.security import APIKeyHeader
from fastapi import Security, HTTPException, status

API_KEY_NAME = "X-API-Key"
API_KEY = "your-secret-api-key"

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key"
    )

# Puis protégez vos endpoints:
@app.post("/api/scrape", dependencies=[Depends(get_api_key)])
async def scrape(...):
    # votre code
`}
            </pre>
          </Paper>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default API;
