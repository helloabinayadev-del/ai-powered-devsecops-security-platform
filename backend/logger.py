import logging
import os

LOG_FOLDER = "logs"
LOG_FILE = os.path.join(LOG_FOLDER, "app.log")

os.makedirs(LOG_FOLDER, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("AI-DevSecOps")
