import React from 'react';
import { 
  Drawer, List, ListItem, ListItemIcon, ListItemText, 
  Divider, Box, Typography, useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  GetApp as ExtractionIcon,
  Storage as DataIcon,
  History as HistoryIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Largeur du sidebar
const DRAWER_WIDTH = 240;

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Liste des items de menu
  const menuItems = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Nouvelle Extraction', icon: <ExtractionIcon />, path: '/extraction' },
    { text: 'Résultats Récents', icon: <DataIcon />, path: '/results/recent' },
    { text: 'Historique', icon: <HistoryIcon />, path: '/history' },
    { divider: true },
    { text: 'API & Intégrations', icon: <CodeIcon />, path: '/api' },
    { divider: true },
    { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Tutoriel', icon: <HelpIcon />, path: '/tutorial' },
  ];

  // Vérifier si un item est actif
  const isActive = (path) => {
    return location.pathname === path || 
      (path.includes('/results') && location.pathname.includes('/results'));
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={isOpen}
      sx={{
        width: isOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%', pt: 1 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            Web Scraper Pro
          </Typography>
        </Box>
        
        <Divider />
        
        <List>
          {menuItems.map((item, index) => (
            item.divider ? (
              <Divider key={`divider-${index}`} sx={{ my: 1 }} />
            ) : (
              <ListItem
                button
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  backgroundColor: isActive(item.path) ? theme.palette.action.selected : 'transparent',
                  borderLeft: isActive(item.path) ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  }
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? theme.palette.primary.main : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ color: isActive(item.path) ? theme.palette.primary.main : 'inherit' }}
                />
              </ListItem>
            )
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
