import requests
import pandas as pd
import json
import csv
import time
import os
import logging
import concurrent.futures
import multiprocessing
import sqlite3
from bs4 import BeautifulSoup
import urllib.robotparser
from urllib.parse import urlparse, urljoin
import re
from abc import ABC, abstractmethod
from datetime import datetime
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import random

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("web_scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("WebScraperETL")

class ETLPipeline(ABC):
    """Abstract base class defining the ETL pipeline structure"""
    
    @abstractmethod
    def extract(self, source):
        """Extract data from the source"""
        pass
    
    @abstractmethod
    def transform(self, raw_data):
        """Transform the extracted raw data"""
        pass
    
    @abstractmethod
    def load(self, processed_data, target):
        """Load the processed data to the target"""
        pass
    
    def run_pipeline(self, source, target=None):
        """Run the complete ETL pipeline"""
        logger.info(f"Starting ETL pipeline for source: {source}")
        raw_data = self.extract(source)
        if not raw_data:
            logger.error("Extraction failed. Pipeline aborted.")
            return False
            
        processed_data = self.transform(raw_data)
        if not processed_data:
            logger.error("Transformation failed. Pipeline aborted.")
            return False
            
        result = self.load(processed_data, target)
        return result

class WebScrapingAgent:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.delay = 2  # Default delay between requests in seconds
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
        ]
        self.session = requests.Session()
        # Configure retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
        
    def welcome_message(self):
        """Display welcome message and explain the agent's capabilities"""
        print("\n" + "="*50)
        print("Bienvenue dans l'Agent de Web Scraping!")
        print("="*50)
        print("Je vais vous aider à extraire des données de sites web.")
        print("Suivez les instructions pour définir votre tâche d'extraction.")
        print("="*50 + "\n")
        
    def get_website_url(self):
        """Get and validate the target website URL"""
        while True:
            url = input("Veuillez entrer l'URL du site web cible: ")
            if self.validate_url(url):
                return url
            print("URL invalide. Veuillez entrer une URL complète (ex: https://www.exemple.com)")
    
    def validate_url(self, url):
        """Validate URL format"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def check_robots_txt(self, url):
        """Check robots.txt for scraping permissions"""
        try:
            parsed_url = urlparse(url)
            robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            can_fetch = rp.can_fetch("*", url)
            if not can_fetch:
                print("\n⚠️ AVERTISSEMENT: Le fichier robots.txt interdit l'extraction de cette page.")
                print("Continuer pourrait violer les conditions d'utilisation du site.")
                choice = input("Souhaitez-vous continuer malgré tout? (oui/non): ").lower()
                return choice == "oui"
            return True
        except Exception as e:
            print(f"\nRemarque: Impossible d'analyser le fichier robots.txt. {str(e)}")
            return True
    
    def fetch_page(self, url):
        """Fetch webpage content with error handling"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.exceptions.HTTPError as e:
            print(f"Erreur HTTP: {e}")
        except requests.exceptions.ConnectionError:
            print("Erreur de connexion. Vérifiez votre connexion Internet.")
        except requests.exceptions.Timeout:
            print("Délai d'attente dépassé. Le site met trop de temps à répondre.")
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors de la récupération de la page: {e}")
        return None
    
    def fetch_page_with_retry(self, url, max_retries=3, backoff_factor=2):
        """Fetch webpage content with retry mechanism"""
        logger.info(f"Fetching page with retry: {url}")
        
        # Rotate user agents for each retry
        for attempt in range(max_retries):
            try:
                # Use a different user agent for each attempt
                self.headers['User-Agent'] = random.choice(self.user_agents)
                
                response = self.session.get(url, headers=self.headers, timeout=10)
                response.raise_for_status()
                return response.text
            except requests.exceptions.RequestException as e:
                wait_time = backoff_factor * (2 ** attempt)
                logger.warning(f"Attempt {attempt+1} failed. Retrying in {wait_time}s. Error: {e}")
                time.sleep(wait_time)
        
        logger.error(f"Failed to fetch {url} after {max_retries} attempts.")
        return None

    def extract_with_selenium(self, url):
        """Extract data from JavaScript-heavy websites using Selenium"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager
        except ImportError:
            logger.error("Selenium not installed. Run: pip install selenium webdriver-manager")
            return None
            
        logger.info(f"Extracting with Selenium: {url}")
        
        try:
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument(f"user-agent={random.choice(self.user_agents)}")
            
            # Use webdriver-manager for automatic chromedriver management
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
            driver.get(url)
            
            # Wait for dynamic content to load
            time.sleep(3)
            
            # Get page source after JavaScript execution
            html_content = driver.page_source
            driver.quit()
            
            return html_content
        except Exception as e:
            logger.error(f"Selenium extraction failed: {e}")
            return None

    def handle_pagination(self, base_url, max_pages=10):
        """Handle extraction from multiple paginated pages"""
        logger.info(f"Handling pagination for {base_url} (max {max_pages} pages)")
        all_content = []
        page_param = self._detect_pagination_parameter(base_url)
        
        for page_num in range(1, max_pages + 1):
            # Construct page URL based on detected pattern
            if "?" in base_url and page_param:
                page_url = f"{base_url}&{page_param}={page_num}"
            elif page_param:
                page_url = f"{base_url}?{page_param}={page_num}"
            else:
                # Default to common pagination patterns
                page_url = f"{base_url}?page={page_num}"
                
            logger.info(f"Extracting page {page_num}: {page_url}")
            
            html_content = self.fetch_page_with_retry(page_url)
            if not html_content:
                break
                
            # Check if this is the last page
            soup = BeautifulSoup(html_content, 'html.parser')
            all_content.append(html_content)
            
            if not self._has_next_page(soup, page_num):
                logger.info(f"No more pages detected after page {page_num}")
                break
                
            # Respect rate limiting
            time.sleep(self.delay)
        
        return all_content
    
    def _detect_pagination_parameter(self, url):
        """Try to detect the pagination parameter from the URL"""
        common_params = ['page', 'p', 'pg', 'pagina', 'pagenum', 'offset']
        parsed = urlparse(url)
        query_params = parsed.query.split('&')
        
        for param in query_params:
            if '=' in param:
                name, value = param.split('=', 1)
                if name.lower() in common_params:
                    return name
                
        return 'page'  # Default
    
    def _has_next_page(self, soup, current_page):
        """Detect if there's a next page based on common pagination patterns"""
        # Look for "Next" links
        next_links = soup.find_all('a', string=re.compile(r'next|suivant|prochain|>>', re.IGNORECASE))
        if next_links:
            return True
            
        # Look for page numbers greater than current
        page_links = soup.find_all('a', href=True, string=re.compile(r'^\d+$'))
        page_numbers = [int(a.text.strip()) for a in page_links if a.text.strip().isdigit()]
        if page_numbers and max(page_numbers) > current_page:
            return True
            
        # Check for disabled "Next" buttons (indicates last page)
        disabled_next = soup.find('a', class_=re.compile(r'disabled|inactive'), string=re.compile(r'next|suivant', re.IGNORECASE))
        if disabled_next:
            return False
            
        return False

    def analyze_page_structure(self, html_content):
        """Analyze HTML structure and suggest available data elements"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Elements that commonly contain valuable data
        data_elements = {
            'Titres': len(soup.find_all(['h1', 'h2', 'h3'])),
            'Paragraphes': len(soup.find_all('p')),
            'Liens': len(soup.find_all('a', href=True)),
            'Images': len(soup.find_all('img', src=True)),
            'Tableaux': len(soup.find_all('table')),
            'Listes': len(soup.find_all(['ul', 'ol'])),
            'Formulaires': len(soup.find_all('form'))
        }
        
        # Check for product structures
        product_indicators = soup.find_all(class_=re.compile(r'product|item|card'))
        if product_indicators:
            data_elements['Produits'] = len(product_indicators)
        
        # Check for pricing elements
        price_indicators = soup.find_all(string=re.compile(r'\$|€|\d+[,.]\d{2}'))
        if price_indicators:
            data_elements['Prix'] = len(price_indicators)
            
        return data_elements
    
    def suggest_data_extraction(self, data_elements):
        """Suggest data types that can be extracted"""
        print("\nÉléments disponibles sur la page:")
        
        available_elements = []
        for element, count in data_elements.items():
            if count > 0:
                print(f"- {element} ({count} trouvés)")
                available_elements.append(element)
        
        if not available_elements:
            print("Aucun élément extractible n'a été identifié sur cette page.")
            return None
            
        return available_elements
    
    def get_extraction_preferences(self, available_elements):
        """Get user preferences for data extraction"""
        print("\nQuels éléments souhaitez-vous extraire?")
        
        for i, element in enumerate(available_elements, 1):
            print(f"{i}. {element}")
        
        while True:
            selection = input("\nEntrez les numéros correspondants séparés par des virgules (ex: 1,3,5): ")
            try:
                indices = [int(idx.strip()) for idx in selection.split(',')]
                selected_elements = [available_elements[i-1] for i in indices if 1 <= i <= len(available_elements)]
                
                if not selected_elements:
                    print("Sélection invalide. Veuillez réessayer.")
                    continue
                    
                return selected_elements
            except (ValueError, IndexError):
                print("Entrée invalide. Veuillez entrer des numéros valides séparés par des virgules.")
    
    def get_output_format(self):
        """Get user preference for output format"""
        formats = ["CSV", "JSON", "Excel", "Texte"]
        
        print("\nDans quel format souhaitez-vous les données extraites?")
        for i, fmt in enumerate(formats, 1):
            print(f"{i}. {fmt}")
        
        while True:
            try:
                choice = int(input("\nEntrez le numéro correspondant: "))
                if 1 <= choice <= len(formats):
                    return formats[choice-1]
                print(f"Veuillez entrer un nombre entre 1 et {len(formats)}.")
            except ValueError:
                print("Veuillez entrer un nombre valide.")
    
    def extract_data(self, html_content, selected_elements):
        """Extract selected data elements from HTML"""
        soup = BeautifulSoup(html_content, 'html.parser')
        extracted_data = {}
        
        for element in selected_elements:
            if element == 'Titres':
                extracted_data['Titres'] = [h.text.strip() for h in soup.find_all(['h1', 'h2', 'h3'])]
            
            elif element == 'Paragraphes':
                extracted_data['Paragraphes'] = [p.text.strip() for p in soup.find_all('p')]
            
            elif element == 'Liens':
                links = []
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    text = a.text.strip()
                    if text and href:  # Only include non-empty links
                        links.append({'texte': text, 'url': href})
                extracted_data['Liens'] = links
            
            elif element == 'Images':
                images = []
                for img in soup.find_all('img', src=True):
                    src = img['src']
                    alt = img.get('alt', '')
                    if src:  # Only include images with src
                        images.append({'src': src, 'alt': alt})
                extracted_data['Images'] = images
            
            elif element == 'Tableaux':
                tables = []
                for i, table in enumerate(soup.find_all('table')):
                    rows = []
                    for tr in table.find_all('tr'):
                        row = [td.text.strip() for td in tr.find_all(['td', 'th'])]
                        if row:  # Only include non-empty rows
                            rows.append(row)
                    if rows:
                        tables.append(rows)
                extracted_data['Tableaux'] = tables
            
            elif element == 'Prix':
                prices = []
                price_elements = soup.find_all(string=re.compile(r'\$|€|\d+[,.]\d{2}'))
                for price in price_elements:
                    clean_price = price.strip()
                    if clean_price:
                        prices.append(clean_price)
                extracted_data['Prix'] = prices
            
            elif element == 'Produits':
                products = []
                for item in soup.find_all(class_=re.compile(r'product|item|card')):
                    product = {}
                    
                    # Try to extract product title
                    title_elem = item.find(['h1', 'h2', 'h3', 'h4', 'h5']) or item.find(class_=re.compile(r'title|name'))
                    if title_elem:
                        product['titre'] = title_elem.text.strip()
                    
                    # Try to extract product price
                    price_elem = item.find(string=re.compile(r'\$|€|\d+[,.]\d{2}'))
                    if price_elem:
                        product['prix'] = price_elem.strip()
                    
                    # Try to extract product image
                    img_elem = item.find('img')
                    if img_elem and img_elem.get('src'):
                        product['image'] = img_elem['src']
                    
                    if product:  # Only add if we found some data
                        products.append(product)
                
                extracted_data['Produits'] = products
        
        return extracted_data
    
    def clean_data(self, extracted_data):
        """Clean and normalize extracted data"""
        cleaned_data = {}
        
        for key, data in extracted_data.items():
            if not data:  # Skip empty data sets
                continue
                
            if isinstance(data, list):
                # For text-based lists (titles, paragraphs, etc.)
                if all(isinstance(item, str) for item in data):
                    cleaned_data[key] = [item.strip() for item in data if item.strip()]
                    
                # For dictionary-based lists (products, links, etc.)
                elif all(isinstance(item, dict) for item in data):
                    cleaned_items = []
                    for item in data:
                        cleaned_item = {}
                        for k, v in item.items():
                            if isinstance(v, str):
                                cleaned_item[k] = v.strip()
                            else:
                                cleaned_item[k] = v
                        if cleaned_item:
                            cleaned_items.append(cleaned_item)
                    
                    if cleaned_items:
                        cleaned_data[key] = cleaned_items
                        
                # For nested lists (tables)
                elif all(isinstance(item, list) for item in data):
                    cleaned_tables = []
                    for table in data:
                        cleaned_table = []
                        for row in table:
                            cleaned_row = [cell.strip() if isinstance(cell, str) else cell for cell in row]
                            if any(cell for cell in cleaned_row):  # Skip empty rows
                                cleaned_table.append(cleaned_row)
                        if cleaned_table:
                            cleaned_tables.append(cleaned_table)
                    
                    if cleaned_tables:
                        cleaned_data[key] = cleaned_tables
        
        return cleaned_data
    
    def transform_pipeline(self, data):
        """Apply a sequence of transformations to the extracted data"""
        logger.info("Starting transformation pipeline")
        transformers = [
            self._clean_text_fields,
            self._normalize_dates,
            self._convert_currencies,
            self._validate_data_types,
            self._enrich_with_metadata
        ]
        
        for transformer in transformers:
            try:
                data = transformer(data)
            except Exception as e:
                logger.error(f"Transformation step {transformer.__name__} failed: {e}")
                # Continue with other transformations
        
        return data
    
    def _clean_text_fields(self, data):
        """Clean text fields by removing extra whitespace, HTML tags, etc."""
        logger.info("Cleaning text fields")
        cleaned_data = {}
        
        for key, value in data.items():
            if isinstance(value, list):
                if all(isinstance(item, str) for item in value):
                    # Clean text in string lists
                    cleaned_data[key] = [
                        re.sub(r'\s+', ' ', self._strip_html(item)).strip()
                        for item in value if item
                    ]
                elif all(isinstance(item, dict) for item in value):
                    # Clean text in dictionaries
                    cleaned_items = []
                    for item in value:
                        cleaned_item = {}
                        for k, v in item.items():
                            if isinstance(v, str):
                                cleaned_item[k] = re.sub(r'\s+', ' ', self._strip_html(v)).strip()
                            else:
                                cleaned_item[k] = v
                        if cleaned_item:
                            cleaned_items.append(cleaned_item)
                    cleaned_data[key] = cleaned_items
                elif all(isinstance(item, list) for item in value):
                    # Clean text in nested lists (tables)
                    cleaned_tables = []
                    for table in value:
                        cleaned_table = []
                        for row in table:
                            cleaned_row = [
                                re.sub(r'\s+', ' ', self._strip_html(str(cell))).strip() 
                                if isinstance(cell, str) else cell 
                                for cell in row
                            ]
                            if any(cell for cell in cleaned_row):
                                cleaned_table.append(cleaned_row)
                        if cleaned_table:
                            cleaned_tables.append(cleaned_table)
                    cleaned_data[key] = cleaned_tables
                else:
                    cleaned_data[key] = value
            else:
                cleaned_data[key] = value
        
        return cleaned_data
    
    def _strip_html(self, text):
        """Remove HTML tags from text"""
        return re.sub(r'<[^>]+>', '', text)
    
    def _normalize_dates(self, data):
        """Convert various date formats to ISO standard"""
        logger.info("Normalizing date formats")
        date_patterns = [
            (r'\d{2}/\d{2}/\d{4}', '%d/%m/%Y'),  # 31/12/2021
            (r'\d{2}-\d{2}-\d{4}', '%d-%m-%Y'),  # 31-12-2021
            (r'\d{4}/\d{2}/\d{2}', '%Y/%m/%d'),  # 2021/12/31
            (r'\d{4}-\d{2}-\d{2}', '%Y-%m-%d'),  # 2021-12-31
            # Add more patterns as needed
        ]
        
        def normalize_date_string(text):
            if not isinstance(text, str):
                return text
                
            # Check if the text contains a date
            for pattern, format_string in date_patterns:
                match = re.search(pattern, text)
                if match:
                    try:
                        date_str = match.group(0)
                        date_obj = datetime.strptime(date_str, format_string)
                        return text.replace(date_str, date_obj.strftime('%Y-%m-%d'))
                    except ValueError:
                        pass
            return text
        
        # Apply date normalization across the data structure
        return self._traverse_and_transform(data, normalize_date_string)
    
    def _convert_currencies(self, data):
        """Normalize currency values"""
        logger.info("Converting currencies to standard format")
        
        def normalize_currency(text):
            if not isinstance(text, str):
                return text
                
            # Match currency patterns like $1,234.56, €1.234,56, etc.
            currency_match = re.search(r'([€$£¥])\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))', text)
            if currency_match:
                currency_symbol = currency_match.group(1)
                value_str = currency_match.group(2)
                
                # Normalize to decimal format
                if ',' in value_str and '.' in value_str:
                    if value_str.find(',') > value_str.find('.'):  # Format: 1.234,56
                        normalized_value = value_str.replace('.', '').replace(',', '.')
                    else:  # Format: 1,234.56
                        normalized_value = value_str.replace(',', '')
                elif ',' in value_str:  # Could be either decimal or thousand separator
                    # Heuristic: if two digits after comma, treat as decimal
                    if re.search(r',\d{2}$', value_str):
                        normalized_value = value_str.replace(',', '.')
                    else:
                        normalized_value = value_str.replace(',', '')
                else:
                    normalized_value = value_str
                
                try:
                    # Format as decimal with 2 places
                    amount = float(normalized_value)
                    return text.replace(currency_match.group(0), f"{currency_symbol}{amount:.2f}")
                except ValueError:
                    pass
            return text
        
        # Apply currency normalization across the data structure
        return self._traverse_and_transform(data, normalize_currency)
    
    def _validate_data_types(self, data):
        """Validate and correct data types"""
        logger.info("Validating data types")
        return data  # Placeholder - implement specific validations based on needs
    
    def _enrich_with_metadata(self, data):
        """Add metadata to the extracted data"""
        logger.info("Enriching data with metadata")
        
        # Add extraction metadata
        metadata = {
            'extraction_timestamp': datetime.now().isoformat(),
            'scraper_version': '1.1.0',
        }
        
        # Add metadata while preserving original data
        enriched_data = {'_metadata': metadata}
        enriched_data.update(data)
        
        return enriched_data
    
    def _traverse_and_transform(self, data, transform_func):
        """Helper method to traverse nested data structures and apply a transformation function"""
        if isinstance(data, dict):
            return {k: self._traverse_and_transform(v, transform_func) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._traverse_and_transform(item, transform_func) for item in data]
        else:
            return transform_func(data)

    def preview_data(self, data):
        """Generate a preview of the extracted data"""
        print("\nAperçu des données extraites:")
        
        for key, value in data.items():
            print(f"\n{key}:")
            
            if not value:
                print("  Aucune donnée trouvée")
                continue
                
            if isinstance(value, list):
                # For simple lists of strings
                if all(isinstance(item, str) for item in value):
                    for i, item in enumerate(value[:3], 1):
                        print(f"  {i}. {item[:50]}...")
                    if len(value) > 3:
                        print(f"  ... et {len(value)-3} autres éléments")
                
                # For lists of dictionaries (products, links, etc.)
                elif all(isinstance(item, dict) for item in value):
                    for i, item in enumerate(value[:3], 1):
                        print(f"  {i}. " + ", ".join([f"{k}: {str(v)[:30]}" for k, v in item.items()]))
                    if len(value) > 3:
                        print(f"  ... et {len(value)-3} autres éléments")
                
                # For tables (lists of lists)
                elif all(isinstance(item, list) for item in value):
                    for t_idx, table in enumerate(value[:2], 1):
                        print(f"  Table {t_idx}:")
                        for r_idx, row in enumerate(table[:3], 1):
                            print(f"    Ligne {r_idx}: {row}")
                        if len(table) > 3:
                            print(f"    ... et {len(table)-3} autres lignes")
                    if len(value) > 2:
                        print(f"  ... et {len(value)-2} autres tableaux")
    
    def export_data(self, data, output_format, url):
        """Export data in the requested format"""
        # Create a filename based on the domain name and current datetime
        domain = urlparse(url).netloc.replace("www.", "")
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        base_filename = f"scraping_{domain}_{timestamp}"
        
        if output_format == "CSV":
            return self.export_to_csv(data, base_filename)
        elif output_format == "JSON":
            return self.export_to_json(data, base_filename)
        elif output_format == "Excel":
            return self.export_to_excel(data, base_filename)
        elif output_format == "Texte":
            return self.export_to_text(data, base_filename)
        else:
            print(f"Format non supporté: {output_format}")
            return None
    
    def export_to_csv(self, data, base_filename):
        """Export data to CSV format"""
        csv_files = []
        
        for key, value in data.items():
            if not value:
                continue
                
            filename = f"{base_filename}_{key}.csv"
            
            try:
                # For simple lists of strings
                if all(isinstance(item, str) for item in value):
                    with open(filename, 'w', newline='', encoding='utf-8') as file:
                        writer = csv.writer(file)
                        writer.writerow([key])
                        for item in value:
                            writer.writerow([item])
                
                # For lists of dictionaries
                elif all(isinstance(item, dict) for item in value):
                    if not value:
                        continue
                        
                    df = pd.DataFrame(value)
                    df.to_csv(filename, index=False, encoding='utf-8')
                
                # For tables (lists of lists)
                elif all(isinstance(item, list) for item in value):
                    with open(filename, 'w', newline='', encoding='utf-8') as file:
                        writer = csv.writer(file)
                        for table_idx, table in enumerate(value):
                            writer.writerow([f"Table {table_idx+1}"])
                            for row in table:
                                writer.writerow(row)
                            writer.writerow([])  # Empty row between tables
                
                csv_files.append(filename)
                print(f"Données '{key}' exportées vers {filename}")
                
            except Exception as e:
                print(f"Erreur lors de l'exportation vers CSV: {str(e)}")
        
        return csv_files if csv_files else None
    
    def export_to_json(self, data, base_filename):
        """Export data to JSON format"""
        filename = f"{base_filename}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=2)
            
            print(f"Données exportées vers {filename}")
            return filename
        except Exception as e:
            print(f"Erreur lors de l'exportation vers JSON: {str(e)}")
            return None
    
    def export_to_excel(self, data, base_filename):
        """Export data to Excel format"""
        filename = f"{base_filename}.xlsx"
        
        try:
            with pd.ExcelWriter(filename) as writer:
                for key, value in data.items():
                    if not value:
                        continue
                        
                    # For simple lists of strings
                    if all(isinstance(item, str) for item in value):
                        df = pd.DataFrame({key: value})
                    
                    # For lists of dictionaries
                    elif all(isinstance(item, dict) for item in value):
                        df = pd.DataFrame(value)
                    
                    # For tables (lists of lists)
                    elif all(isinstance(item, list) for item in value):
                        # Create a structured representation for Excel
                        all_data = []
                        for table_idx, table in enumerate(value):
                            all_data.append([f"Table {table_idx+1}"])
                            all_data.extend(table)
                            all_data.append([])  # Empty row between tables
                        
                        df = pd.DataFrame(all_data)
                    
                    # Write to Excel
                    sheet_name = key[:31]  # Excel limits sheet names to 31 chars
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            print(f"Données exportées vers {filename}")
            return filename
        except Exception as e:
            print(f"Erreur lors de l'exportation vers Excel: {str(e)}")
            return None
    
    def export_to_text(self, data, base_filename):
        """Export data to plain text format"""
        filename = f"{base_filename}.txt"
        
        try:
            with open(filename, 'w', encoding='utf-8') as file:
                for key, value in data.items():
                    if not value:
                        continue
                        
                    file.write(f"\n{key}:\n")
                    file.write("="*50 + "\n")
                    
                    # For simple lists of strings
                    if all(isinstance(item, str) for item in value):
                        for i, item in enumerate(value, 1):
                            file.write(f"{i}. {item}\n")
                    
                    # For lists of dictionaries
                    elif all(isinstance(item, dict) for item in value):
                        for i, item in enumerate(value, 1):
                            file.write(f"{i}. " + ", ".join([f"{k}: {v}" for k, v in item.items()]) + "\n")
                    
                    # For tables (lists of lists)
                    elif all(isinstance(item, list) for item in value):
                        for t_idx, table in enumerate(value, 1):
                            file.write(f"Table {t_idx}:\n")
                            for row in table:
                                file.write("  " + ", ".join([str(cell) for cell in row]) + "\n")
                            file.write("\n")
            
            print(f"Données exportées vers {filename}")
            return filename
        except Exception as e:
            print(f"Erreur lors de l'exportation vers texte: {str(e)}")
            return None
    
    def load_to_database(self, data, db_path):
        """Load extracted data to SQLite database"""
        logger.info(f"Loading data to database: {db_path}")
        
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Create tables based on data structure
            for key, value in data.items():
                if key.startswith('_'):  # Skip metadata
                    continue
                    
                if not value or not isinstance(value, list):
                    continue
                
                # For simple lists of strings
                if all(isinstance(item, str) for item in value):
                    table_name = f"scraping_{key.lower()}"
                    cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
                    cursor.execute(f"CREATE TABLE {table_name} (id INTEGER PRIMARY KEY, value TEXT)")
                    
                    for item in value:
                        cursor.execute(f"INSERT INTO {table_name} (value) VALUES (?)", (item,))
                
                # For lists of dictionaries
                elif all(isinstance(item, dict) for item in value) and value:
                    table_name = f"scraping_{key.lower()}"
                    cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
                    
                    # Get column names from first item
                    sample_item = value[0]
                    columns = list(sample_item.keys())
                    
                    # Create table with dynamic columns
                    columns_sql = ", ".join([f"{col} TEXT" for col in columns])
                    cursor.execute(f"CREATE TABLE {table_name} (id INTEGER PRIMARY KEY, {columns_sql})")
                    
                    # Insert data
                    for item in value:
                        placeholders = ", ".join(["?"] * len(columns))
                        values = [str(item.get(col, '')) for col in columns]
                        cursor.execute(
                            f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})",
                            values
                        )
            
            conn.commit()
            logger.info("Database load completed successfully")
            return True
        except Exception as e:
            logger.error(f"Database load failed: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                conn.close()

    def extract_multiple_urls(self, urls):
        """Extract data from multiple URLs in parallel"""
        logger.info(f"Extracting data from {len(urls)} URLs in parallel")
        
        results = {}
        max_workers = min(multiprocessing.cpu_count() * 2, len(urls))
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_url = {executor.submit(self.fetch_page_with_retry, url): url for url in urls}
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    content = future.result()
                    if content:
                        results[url] = content
                        logger.info(f"Successfully extracted data from {url}")
                    else:
                        logger.warning(f"No content extracted from {url}")
                except Exception as e:
                    logger.error(f"Exception extracting {url}: {e}")
        
        return results
    
    def run(self):
        """Run the web scraping agent workflow with ETL pipeline"""
        self.welcome_message()
        
        # Step 1: Get target URL and check if it's multiple URLs
        url_input = self.get_website_url()
        urls = [url.strip() for url in url_input.split(',')] if ',' in url_input else [url_input]
        
        # Ask if user wants to handle pagination
        handle_pagination = False
        if len(urls) == 1:
            pagination_choice = input("Souhaitez-vous extraire les données de plusieurs pages (pagination)? (oui/non): ").lower()
            handle_pagination = pagination_choice in ['oui', 'o', 'yes', 'y']
        
        # Ask for JavaScript support
        js_support = input("Le site utilise-t-il beaucoup de JavaScript dynamique? (oui/non): ").lower()
        use_selenium = js_support in ['oui', 'o', 'yes', 'y']
        
        all_html_contents = {}
        
        # Step 2: Check robots.txt and extract data
        for url in urls:
            if not self.check_robots_txt(url):
                print(f"Extraction annulée pour {url} conformément aux directives éthiques.")
                continue
            
            print(f"\nTéléchargement de {url}. Veuillez patienter...")
            
            if handle_pagination:
                print("Gestion de la pagination en cours...")
                paginated_contents = self.handle_pagination(url)
                if paginated_contents:
                    all_html_contents[url] = paginated_contents[0]  # Only use first page for analysis
                    print(f"Extraites {len(paginated_contents)} pages depuis {url}")
            elif use_selenium:
                html_content = self.extract_with_selenium(url)
                if html_content:
                    all_html_contents[url] = html_content
            else:
                html_content = self.fetch_page_with_retry(url)
                if html_content:
                    all_html_contents[url] = html_content
        
        if not all_html_contents:
            print("Impossible de continuer sans contenu de page.")
            return
        
        # Use the first URL's content for structure analysis
        sample_url = list(all_html_contents.keys())[0]
        sample_content = all_html_contents[sample_url]
        
        # Step 3: Analyze page structure and get user preferences
        print("Analyse de la structure de la page...")
        data_elements = self.analyze_page_structure(sample_content)
        available_elements = self.suggest_data_extraction(data_elements)
        if not available_elements:
            return
        
        selected_elements = self.get_extraction_preferences(available_elements)
        output_format = self.get_output_format()
        
        # Step 4: ETL Pipeline
        combined_data = {}
        
        print("\nDémarrage du pipeline ETL (Extraction, Transformation, Chargement)...")
        print("Extraction des données en cours...")
        
        # Extract data from all URLs/pages
        for url, html_content in all_html_contents.items():
            extracted_data = self.extract_data(html_content, selected_elements)
            
            # Merge data from multiple URLs
            for key, value in extracted_data.items():
                if key not in combined_data:
                    combined_data[key] = value
                elif isinstance(value, list):
                    combined_data[key].extend(value)
        
        # Transform data
        print("Transformation et nettoyage des données...")
        transformed_data = self.transform_pipeline(combined_data)
        
        if not transformed_data:
            print("Aucune donnée n'a pu être extraite ou transformée avec les sélections actuelles.")
            return
        
        # Preview data
        self.preview_data(transformed_data)
        
        # Load data based on format
        print(f"\nChargement des données au format {output_format}...")
        if output_format == "Base de données":
            db_path = input("Entrez le chemin pour la base de données SQLite (ex: data.db): ")
            success = self.load_to_database(transformed_data, db_path)
            if success:
                print(f"Données chargées avec succès dans la base de données: {db_path}")
        else:
            # Use existing export methods
            output_file = self.export_data(transformed_data, output_format, urls[0])
        
            if output_file:
                print(f"\nMission accomplie! Les données ont été extraites et exportées avec succès.")
                print(f"Vous pouvez trouver vos données dans le(s) fichier(s) généré(s).")
            else:
                print("\nL'opération d'exportation n'a pas pu être complétée.")
        
        # Step 10: Suggest next steps
        print("\nSuggestions pour la suite:")
        print("- Analysez les données extraites pour en tirer des insights")
        print("- Pour des extractions régulières, envisagez d'automatiser ce processus")
        print("- Utilisez l'API pour intégrer cette fonctionnalité à d'autres applications")

class WebScraperETL(ETLPipeline):
    """Implementation of ETL pipeline specifically for web scraping"""
    
    def __init__(self):
        self.agent = WebScrapingAgent()
    
    def extract(self, url):
        """Extract data from URL"""
        # Check if JavaScript support is needed
        js_needed = input("Le site utilise-t-il JavaScript dynamique? (oui/non): ").lower() in ['oui', 'o', 'yes', 'y']
        
        if js_needed:
            return self.agent.extract_with_selenium(url)
        else:
            return self.agent.fetch_page_with_retry(url)
    
    def transform(self, raw_data):
        """Transform raw HTML data"""
        # First parse with BeautifulSoup
        soup = BeautifulSoup(raw_data, 'html.parser')
        
        # Analyze available elements
        data_elements = self.agent.analyze_page_structure(raw_data)
        available_elements = self.agent.suggest_data_extraction(data_elements)
        
        if not available_elements:
            return None
            
        # Get user preferences
        selected_elements = self.agent.get_extraction_preferences(available_elements)
        
        # Extract and transform data
        extracted_data = self.agent.extract_data(raw_data, selected_elements)
        transformed_data = self.agent.transform_pipeline(extracted_data)
        
        return transformed_data
    
    def load(self, processed_data, output_format=None):
        """Load processed data to the target format"""
        if not output_format:
            output_format = self.agent.get_output_format()
            
        if output_format == "Base de données":
            db_path = input("Entrez le chemin pour la base de données SQLite: ")
            return self.agent.load_to_database(processed_data, db_path)
        else:
            # Use the first URL as reference for filename
            return self.agent.export_data(processed_data, output_format, "http://example.com")

def main():
    """Main entry point with choice of approaches"""
    print("\n" + "="*50)
    print("Bienvenue dans l'Agent de Web Scraping amélioré!")
    print("="*50)
    
    approach = input("""
Choisissez votre approche:
1. Interface interactive classique
2. Pipeline ETL structuré
3. Extraction multi-URL en parallèle

Votre choix (1-3): """)
    
    if approach == "1":
        agent = WebScrapingAgent()
        agent.run()
    elif approach == "2":
        etl = WebScraperETL()
        url = input("Veuillez entrer l'URL du site web cible: ")
        etl.run_pipeline(url)
    elif approach == "3":
        agent = WebScrapingAgent()
        urls_input = input("Entrez les URLs séparées par des virgules: ")
        urls = [url.strip() for url in urls_input.split(',')]
        results = agent.extract_multiple_urls(urls)
        print(f"Extraction terminée pour {len(results)} URLs sur {len(urls)}")
    else:
        print("Choix invalide. Utilisation de l'interface classique.")
        agent = WebScrapingAgent()
        agent.run()

if __name__ == "__main__":
    main()
