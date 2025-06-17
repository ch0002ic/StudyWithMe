from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
from dotenv import load_dotenv
import os
from fastapi.responses import HTMLResponse, FileResponse
import json

# Load environment variables
load_dotenv()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Load prompt config
PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompts.json")
with open(PROMPT_PATH, "r") as f:
    PROMPT_CONFIG = json.load(f)

app = FastAPI()

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LearnerProfile(BaseModel):
    age_group: str
    subject: str
    difficulty_level: int

class ChatRequest(BaseModel):
    message: str
    session_id: str
    profile: LearnerProfile
    xp: int

class ChatResponse(BaseModel):
    reply: str
    xp: int
    difficulty_level: int
    analytics: dict

def get_adaptive_system_prompt(profile: LearnerProfile) -> str:
    prompt = PROMPT_CONFIG.get(profile.age_group, PROMPT_CONFIG["adult"])
    return f"{prompt} Focus on {profile.subject} at difficulty level {profile.difficulty_level}."

def adjust_difficulty(user_message: str, current_level: int) -> int:
    # Simple logic: longer answers = increase difficulty, short = decrease
    if len(user_message.strip()) > 50:
        return min(current_level + 1, 10)
    elif len(user_message.strip()) < 15:
        return max(current_level - 1, 1)
    return current_level

def calculate_xp(user_message: str, difficulty_level: int) -> int:
    base = 10
    bonus = len(user_message) // 20
    return base * difficulty_level + bonus

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        print("Received chat request:", req)
        # Adjust difficulty based on last user message
        new_difficulty = adjust_difficulty(req.message, req.profile.difficulty_level)
        req.profile.difficulty_level = new_difficulty

        system_prompt = get_adaptive_system_prompt(req.profile)
        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ]
        )
        answer = response.choices[0].message.content or ""
        xp_earned = calculate_xp(req.message, new_difficulty)
        analytics = {
            "difficulty_level": new_difficulty,
            "xp_earned": xp_earned,
            "message_length": len(req.message),
        }
        return ChatResponse(
            reply=answer,
            xp=req.xp + xp_earned,
            difficulty_level=new_difficulty,
            analytics=analytics
        )
    except Exception as e:
        print("Error in /chat:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html>
      <head>
        <title>StudyWithMe API</title>
      </head>
      <body>
        <h1>Welcome to the StudyWithMe Backend API</h1>
        <p>This is the backend server for our StudyWithMe app.</p>
      </body>
    </html>
    """

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    favicon_path = os.path.join(os.path.dirname(__file__), "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path, media_type="image/x-icon")
    # fallback: return a 204 No Content if favicon not found
    from fastapi import Response
    return Response(status_code=204)