import os
import subprocess
import webbrowser
import sys
import time
from threading import Thread

def check_requirements():
    """Vérifie et installe les dépendances requises"""
    print("Vérification des dépendances...")
    
    backend_requirements = [
        "fastapi", "uvicorn", "websockets", "nest_asyncio", "python-multipart",
        "requests", "beautifulsoup4", "pandas", "openpyxl", "selenium", "webdriver-manager"
    ]
    
    try:
        import pip
        for package in backend_requirements:
            try:
                __import__(package)
                print(f"✓ {package} est déjà installé")
            except ImportError:
                print(f"Installation de {package}...")
                pip.main(["install", package])
        print("Toutes les dépendances backend sont installées!")
    except Exception as e:
        print(f"Erreur lors de l'installation des dépendances: {e}")
        sys.exit(1)

def is_nodejs_installed():
    """Vérifie si Node.js est installé"""
    try:
        subprocess.run(["node", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except:
        return False

def setup_frontend():
    """Configure et démarre le frontend React"""
    if not os.path.exists("frontend"):
        print("Configuration du frontend React...")
        if not is_nodejs_installed():
            print("Node.js n'est pas installé. Veuillez l'installer pour utiliser l'interface web.")
            print("Vous pouvez le télécharger ici: https://nodejs.org/")
            print("Lancement en mode API uniquement...")
            return False
            
        try:
            # Créer un nouveau projet React
            subprocess.run(["npx", "create-react-app", "frontend"], check=True)
            
            # Installer les dépendances React nécessaires
            os.chdir("frontend")
            subprocess.run([
                "npm", "install", 
                "@mui/material", "@emotion/react", "@emotion/styled",
                "react-router-dom", "axios", "react-toastify", "@mui/icons-material",
                "react-syntax-highlighter", "recharts", "react-json-view"
            ], check=True)
            os.chdir("..")
            
            # Copier les fichiers de l'interface utilisateur
            # Ici on suppose que les fichiers ont été créés comme indiqué précédemment
        except Exception as e:
            print(f"Erreur lors de la configuration du frontend: {e}")
            return False
    
    # Démarrer le serveur de développement React
    try:
        os.chdir("frontend")
        subprocess.Popen(["npm", "start"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        os.chdir("..")
        return True
    except Exception as e:
        print(f"Erreur lors du démarrage du frontend: {e}")
        return False

def start_backend():
    """Démarrer le serveur backend FastAPI"""
    try:
        import uvicorn
        from web_scraping_platform import app
        
        print("Démarrage du serveur backend...")
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        print(f"Erreur lors du démarrage du backend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 50)
    print("Web Scraping Platform - Interface Moderne")
    print("=" * 50)
    
    # Vérifier et installer les dépendances
    check_requirements()
    
    # Configurer et démarrer le frontend
    frontend_success = setup_frontend()
    
    # Démarrer le backend dans un thread séparé
    backend_thread = Thread(target=start_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Attendre que le serveur soit prêt
    time.sleep(3)
    
    # Ouvrir le navigateur
    if frontend_success:
        print("\nOuverture de l'interface utilisateur dans votre navigateur...")
        webbrowser.open("http://localhost:3000")
        print("\nServeur backend disponible sur http://localhost:8000")
    else:
        print("\nInterface API disponible sur http://localhost:8000/docs")
    
    print("\nAppuyez sur Ctrl+C pour arrêter les serveurs.")
    
    try:
        # Maintenir le programme en cours d'exécution
        backend_thread.join()
    except KeyboardInterrupt:
        print("\nArrêt des serveurs...")
        sys.exit(0)
