from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()

client = MongoClient(os.getenv("mongoPath"))
db = client.get_database("discordBOT")

subreddits = db["subreddits"]
cursos = db["cursos"]
canalFijado = db["canalfijados"]
canalSr = db["canalsrs"]