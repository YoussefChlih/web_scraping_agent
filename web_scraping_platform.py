import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import asyncio
import json
import os
import uuid
from datetime import datetime
import nest_asyncio

# Import notre agent de web scraping
from web_scraping_agent import WebScrapingAgent, WebScraperETL

# Modèle pour les requêtes d'extraction
class ScrapeRequest(BaseModel):
    url: str
    elements: List[str] = []
    use_selenium: bool = False
    handle_pagination: bool = False
    max_pages: int = 5
    output_format: str = "JSON"

# Modèle pour les résultats d'extraction
class ScrapeResult(BaseModel):
    task_id: str
    status: str
    progress: int = 0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    output_file: Optional[str] = None
    timestamp: str

# Application FastAPI
app = FastAPI(
    title="Web Scraping Platform",
    description="Plateforme moderne pour l'extraction de données web",
    version="1.0.0"
)

# Activer CORS pour permettre au frontend de communiquer avec l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les origines exactes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stocker les tâches en cours et leurs résultats
tasks = {}
websocket_connections = {}

# Fonction pour exécuter l'extraction en arrière-plan
async def run_scraping_task(task_id: str, request: ScrapeRequest):
    agent = WebScrapingAgent()
    result = ScrapeResult(
        task_id=task_id,
        status="running",
        progress=0,
        timestamp=datetime.now().isoformat()
    )
    tasks[task_id] = result
    
    try:
        # Simuler les étapes d'avancement pour l'UI
        await update_progress(task_id, 10, "Initialisation de l'extraction...")
        
        # Configuration et vérification
        if not agent.validate_url(request.url):
            raise ValueError("URL invalide")
        
        await update_progress(task_id, 20, "Vérification du fichier robots.txt...")
        if not agent.check_robots_txt(request.url):
            await update_progress(task_id, 0, "Extraction annulée selon robots.txt")
            return
        
        # Extraction du HTML
        await update_progress(task_id, 30, "Téléchargement de la page...")
        
        html_content = None
        if request.use_selenium:
            html_content = agent.extract_with_selenium(request.url)
        elif request.handle_pagination:
            paginated_contents = agent.handle_pagination(request.url, max_pages=request.max_pages)
            if paginated_contents:
                html_content = paginated_contents[0]  # Pour l'analyse
        else:
            html_content = agent.fetch_page_with_retry(request.url)
            
        if not html_content:
            raise ValueError("Impossible de récupérer le contenu de la page")
        
        # Analyse de la structure
        await update_progress(task_id, 50, "Analyse de la structure de la page...")
        data_elements = agent.analyze_page_structure(html_content)
        
        # Si aucun élément spécifié, utiliser tous les éléments disponibles
        elements_to_extract = request.elements
        if not elements_to_extract:
            elements_to_extract = [e for e, count in data_elements.items() if count > 0]
            
        if not elements_to_extract:
            raise ValueError("Aucun élément à extraire n'a été trouvé")
            
        # Extraction des données
        await update_progress(task_id, 70, "Extraction des données...")
        extracted_data = agent.extract_data(html_content, elements_to_extract)
        
        # Transformation des données
        await update_progress(task_id, 80, "Transformation des données...")
        transformed_data = agent.transform_pipeline(extracted_data)
        
        # Export des données
        await update_progress(task_id, 90, "Export des données...")
        output_file = None
        if transformed_data:
            output_file = agent.export_data(transformed_data, request.output_format, request.url)
            
        # Finalisation
        await update_progress(task_id, 100, "Extraction terminée avec succès", result=transformed_data, output_file=output_file)
        
    except Exception as e:
        # En cas d'erreur
        error_message = str(e)
        tasks[task_id].status = "failed"
        tasks[task_id].error = error_message
        
        # Notifier le client via websocket
        if task_id in websocket_connections:
            await websocket_connections[task_id].send_json({
                "task_id": task_id,
                "status": "failed",
                "progress": 0,
                "error": error_message
            })

async def update_progress(task_id: str, progress: int, status_message: str, result=None, output_file=None):
    """Mettre à jour la progression d'une tâche et notifier via websocket"""
    if task_id in tasks:
        tasks[task_id].progress = progress
        tasks[task_id].status = status_message if progress < 100 else "completed"
        
        if result:
            tasks[task_id].result = result
            
        if output_file:
            tasks[task_id].output_file = output_file
            
        # Notifier le client via websocket si connecté
        if task_id in websocket_connections:
            await websocket_connections[task_id].send_json({
                "task_id": task_id,
                "status": tasks[task_id].status,
                "progress": progress,
                "message": status_message,
                "output_file": output_file
            })
    
    # Simuler le temps de traitement
    await asyncio.sleep(0.5)

@app.post("/api/scrape", response_model=Dict[str, str])
async def scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Endpoint pour démarrer une tâche de scraping"""
    task_id = str(uuid.uuid4())
    background_tasks.add_task(run_scraping_task, task_id, request)
    return {"task_id": task_id, "message": "Tâche d'extraction démarrée"}

@app.get("/api/tasks/{task_id}", response_model=ScrapeResult)
async def get_task_status(task_id: str):
    """Endpoint pour vérifier le statut d'une tâche"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return tasks[task_id]

@app.get("/api/elements", response_model=Dict[str, int])
async def get_available_elements(url: str):
    """Endpoint pour obtenir les éléments disponibles sur une page"""
    agent = WebScrapingAgent()
    
    if not agent.validate_url(url):
        raise HTTPException(status_code=400, detail="URL invalide")
        
    html_content = agent.fetch_page_with_retry(url)
    if not html_content:
        raise HTTPException(status_code=500, detail="Impossible de récupérer le contenu de la page")
        
    data_elements = agent.analyze_page_structure(html_content)
    return data_elements

@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """Endpoint WebSocket pour les mises à jour en temps réel"""
    await websocket.accept()
    websocket_connections[task_id] = websocket
    
    try:
        # Envoyer l'état initial si la tâche existe déjà
        if task_id in tasks:
            await websocket.send_json({
                "task_id": task_id,
                "status": tasks[task_id].status,
                "progress": tasks[task_id].progress,
            })
        
        # Attendre les messages du client (peut être utilisé pour l'annulation)
        while True:
            data = await websocket.receive_text()
            if data == "cancel" and task_id in tasks:
                tasks[task_id].status = "cancelled"
                await websocket.send_json({
                    "task_id": task_id,
                    "status": "cancelled"
                })
                
    except WebSocketDisconnect:
        if task_id in websocket_connections:
            del websocket_connections[task_id]

# Servir les fichiers statiques du frontend
@app.on_event("startup")
async def startup_event():
    # Créer le dossier frontend si nécessaire
    os.makedirs("frontend/build", exist_ok=True)
    
    # Activer nest_asyncio pour les notebooks (si utilisé)
    try:
        nest_asyncio.apply()
    except:
        pass

# Monter les fichiers statiques après le démarrage
try:
    app.mount("/", StaticFiles(directory="frontend/build", html=True), name="frontend")
except RuntimeError:
    # Si le dossier n'existe pas encore, on ne monte pas les fichiers
    pass

# Point d'entrée pour exécuter l'application
if __name__ == "__main__":
    uvicorn.run("web_scraping_platform:app", host="0.0.0.0", port=8000, reload=True)
