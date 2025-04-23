import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, TextField, InputAdornment,
  Chip, Menu, MenuItem, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Alert, CircularProgress, Tooltip,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  DeleteSweep as DeleteSweepIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

// Constante API
const API_BASE_URL = 'http://localhost:8000/api';

const History = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  // Chargement des tâches depuis l'API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Note: Dans un environnement réel, nous récupérerions cela depuis l'API
        // Mais pour cet exemple, nous simulons des données
        const mockTasks = [
          {
            id: 'task-1',
            url: 'https://example.com/products',
            timestamp: '2023-07-15T10:30:00Z',
            status: 'completed',
            elements: ['Produits', 'Prix', 'Images'],
            output_format: 'JSON'
          },
          {
            id: 'task-2',
            url: 'https://example.com/blog',
            timestamp: '2023-07-14T14:45:00Z',
            status: 'completed',
            elements: ['Titres', 'Paragraphes', 'Liens'],
            output_format: 'CSV'
          },
          {
            id: 'task-3',
            url: 'https://example.com/contact',
            timestamp: '2023-07-12T08:20:00Z',
            status: 'failed',
            elements: ['Formulaires', 'Liens'],
            output_format: 'JSON',
            error: 'Impossible d\'accéder à la page'
          },
          {
            id: 'task-4',
            url: 'https://example.com/news',
            timestamp: '2023-07-10T16:15:00Z',
            status: 'completed',
            elements: ['Titres', 'Paragraphes', 'Images'],
            output_format: 'Excel'
          },
          {
            id: 'task-5',
            url: 'https://example.com/gallery',
            timestamp: '2023-07-08T11:05:00Z',
            status: 'completed',
            elements: ['Images', 'Titres'],
            output_format: 'JSON'
          }
        ];
        
        setTasks(mockTasks);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement de l\'historique.');
        setLoading(false);
        console.error('Erreur lors du chargement de l\'historique:', err);
      }
    };

    fetchTasks();
  }, []);

  // Gestion du menu
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestion de la suppression
  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      // Dans un environnement réel, appelez l'API ici
      // await axios.delete(`${API_BASE_URL}/tasks/${taskToDelete.id}`);
      
      // Mise à jour locale
      setTasks(tasks.filter(task => task.id !== taskToDelete.id));
      toast.success('Tâche supprimée avec succès');
    } catch (err) {
      toast.error('Erreur lors de la suppression de la tâche');
      console.error('Erreur de suppression:', err);
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleClearAllClick = () => {
    setClearAllDialogOpen(true);
    handleMenuClose();
  };

  const handleClearAllConfirm = async () => {
    try {
      // Dans un environnement réel, appelez l'API ici
      // await axios.delete(`${API_BASE_URL}/tasks/all`);
      
      setTasks([]);
      toast.success('Historique effacé avec succès');
    } catch (err) {
      toast.error('Erreur lors de l\'effacement de l\'historique');
      console.error('Erreur d\'effacement:', err);
    } finally {
      setClearAllDialogOpen(false);
    }
  };

  // Gestion du tri
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
    handleMenuClose();
  };

  // Filtrage et tri des tâches
  const filteredTasks = tasks
    .filter(task => 
      task.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.elements.some(element => element.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortField === 'timestamp') {
        return sortDirection === 'asc' 
          ? new Date(a.timestamp) - new Date(b.timestamp)
          : new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortField === 'url') {
        return sortDirection === 'asc'
          ? a.url.localeCompare(b.url)
          : b.url.localeCompare(a.url);
      }
      return 0;
    });

  // Pagination
  const paginatedTasks = filteredTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Formatage de la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement de l'historique...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Historique des extractions
          </Typography>
          
          <Box>
            <Button 
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              sx={{ mr: 1 }}
            >
              Actualiser
            </Button>
            <Button 
              color="error" 
              startIcon={<DeleteSweepIcon />}
              onClick={handleClearAllClick}
              disabled={tasks.length === 0}
            >
              Tout effacer
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par URL, ID ou éléments..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 500 }}
          />
          
          <Box sx={{ ml: 2 }}>
            <Tooltip title="Options de tri">
              <IconButton onClick={handleMenuClick}>
                <SortIcon />
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleSort('timestamp')}>
                Trier par date {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
              </MenuItem>
              <MenuItem onClick={() => handleSort('url')}>
                Trier par URL {sortField === 'url' && (sortDirection === 'asc' ? '↑' : '↓')}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleClearAllClick}>Effacer tout l'historique</MenuItem>
            </Menu>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {filteredTasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            {searchTerm ? (
              <Typography variant="body1">
                Aucun résultat trouvé pour "{searchTerm}".
              </Typography>
            ) : (
              <Typography variant="body1">
                Aucune extraction dans l'historique.
              </Typography>
            )}
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/extraction')}
              sx={{ mt: 2 }}
            >
              Nouvelle extraction
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Éléments</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTasks.map((task) => (
                    <TableRow 
                      key={task.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: task.status === 'failed' ? 'error.lighter' : 'inherit'
                      }}
                    >
                      <TableCell>{formatDate(task.timestamp)}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Tooltip title={task.url}>
                          <span>{task.url}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {task.elements.slice(0, 2).map((element, idx) => (
                            <Chip key={idx} label={element} size="small" />
                          ))}
                          {task.elements.length > 2 && (
                            <Chip 
                              label={`+${task.elements.length - 2}`} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{task.output_format}</TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            task.status === 'completed' ? 'Terminé' :
                            task.status === 'failed' ? 'Échec' :
                            task.status === 'running' ? 'En cours' : 'En attente'
                          }
                          color={
                            task.status === 'completed' ? 'success' :
                            task.status === 'failed' ? 'error' :
                            task.status === 'running' ? 'primary' : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Voir les résultats">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/results/${task.id}`)}
                            disabled={task.status !== 'completed'}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Télécharger">
                          <IconButton 
                            size="small"
                            disabled={task.status !== 'completed'}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(task)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredTasks.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page :"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </>
        )}
      </Paper>
      
      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette tâche de l'historique ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog de confirmation d'effacement de l'historique */}
      <Dialog
        open={clearAllDialogOpen}
        onClose={() => setClearAllDialogOpen(false)}
      >
        <DialogTitle>Effacer tout l'historique</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir effacer tout l'historique des extractions ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleClearAllConfirm} color="error" autoFocus>
            Effacer tout
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default History;
