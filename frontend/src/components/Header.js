import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, 
  Box, Menu, MenuItem, Avatar, Badge, Button,
  Tooltip, useMediaQuery, useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick, toggleDarkMode, darkMode }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Logo placeholder
  const logoPlaceholder = "WS";

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  return (
    <AppBar position="static" elevation={0} color="default">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left section - Menu button and Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40, mr: 1 }}>
              {logoPlaceholder}
            </Avatar>
            <Typography variant={isMobile ? "subtitle1" : "h6"} component="div" color="primary" fontWeight="bold">
              Web Scraper Pro
            </Typography>
          </Box>
        </Box>

        {/* Right section - Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isMobile && (
            <Button color="primary" variant="contained" onClick={() => navigate('/extraction')} sx={{ mr: 2 }}>
              Nouvelle Extraction
            </Button>
          )}

          <Tooltip title={darkMode ? "Mode clair" : "Mode sombre"}>
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={2} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box sx={{ ml: 1 }}>
            <IconButton
              aria-label="compte utilisateur"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleNavigation('/settings')}>Paramètres</MenuItem>
              <MenuItem onClick={() => handleNavigation('/tutorial')}>Tutoriel</MenuItem>
              <MenuItem onClick={handleClose}>Se déconnecter</MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
