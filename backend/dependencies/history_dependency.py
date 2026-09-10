import os
import json

from fastapi import HTTPException

from backend.config import HISTORY_FILE


def get_history():

    if not os.path.exists(HISTORY_FILE):

        raise HTTPException(
            status_code=404,
            detail="History file not found."
        )

    with open(HISTORY_FILE, "r", encoding="utf-8") as file:

        history = json.load(file)

    return history
