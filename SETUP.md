# Configuration du projet de détection de fraude

## Prérequis
- Docker et Docker Compose installés
- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

## Étapes de mise en place

### 1. Installer les dépendances Python
```bash
pip install kafka-python pyspark==3.3.0 mlflow==2.3.1 elasticsearch==7.17.0 scikit-learn pandas numpy
```

### 2. Démarrer les services Docker
```bash
docker-compose up -d
```

Cette commande démarre tous les services nécessaires:
- Zookeeper et Kafka pour le streaming
- Spark Master et Worker pour le traitement
- Elasticsearch pour le stockage
- Kibana pour la visualisation
- MLflow pour la gestion des modèles

### 3. Vérifier que tous les services sont opérationnels
```bash
docker ps
```
Tous les conteneurs doivent avoir le statut "Up"
