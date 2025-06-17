from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
from dotenv import load_dotenv
import os
from fastapi.responses import HTMLResponse, FileResponse
import json
from typing import Optional
import base64
import random

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
    explain: bool = False
    persona: Optional[str] = None
    language: Optional[str] = "en"

class ChatResponse(BaseModel):
    reply: str
    xp: int
    difficulty_level: int
    analytics: dict
    fact_warning: Optional[str] = None  # <-- Add this

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

def simple_fact_check(answer: str, subject: str = "") -> Optional[str]:
    lower = answer.lower()
    if "i don't know" in lower or "not sure" in lower or "might be wrong" in lower:
        return "This answer may be incomplete or uncertain. Please double-check."
    if subject == "math" and not any(char.isdigit() for char in lower):
        return "Math answer does not contain any numbers. Please verify."
    if subject == "history" and not any(str(year) in lower for year in range(1000, 2025)):
        return "History answer does not mention any dates. Please verify."
    if subject == "science" and any(word in lower for word in ["maybe", "possibly", "could be"]):
        return "Science answer is uncertain. Please check with a trusted source."
    if len(answer.split()) < 10:
        return "Answer is very short. Consider asking for more detail."
    if "source:" not in lower and subject in ["history", "science"]:
        return "No source cited for factual answer. Please verify."
    return None

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        print("Received chat request:", req)
        # Adjust difficulty based on last user message
        new_difficulty = adjust_difficulty(req.message, req.profile.difficulty_level)
        req.profile.difficulty_level = new_difficulty

        system_prompt = get_adaptive_system_prompt(req.profile)
        if req.language and req.language != "en":
            system_prompt += f" Please reply in {req.language}."
        if req.explain:
            system_prompt += (
                " The user has requested an explanation. "
                "Please provide a clear, step-by-step explanation for your previous answer, "
                "using simple language and examples appropriate for the user's age group."
            )

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
        # Fact-check the answer
        fact_warning = simple_fact_check(answer)
        return ChatResponse(
            reply=answer,
            xp=req.xp + xp_earned,
            difficulty_level=new_difficulty,
            analytics=analytics,
            fact_warning=fact_warning
        )
    except Exception as e:
        print("Error in /chat:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/flag")
async def flag_answer(request: Request):
    data = await request.json()
    print("Flagged message:", data)
    # Optionally, store in a database or file
    return {"status": "ok"}

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

@app.post("/image")
async def image_endpoint(
    image: UploadFile = File(...),
    session_id: str = Form(...),
    profile: str = Form(...),
    xp: str = Form(...),
    persona: Optional[str] = Form(None)
):
    try:
        img_bytes = await image.read()
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        profile_obj = json.loads(profile)
        prompt = get_adaptive_system_prompt(LearnerProfile(**profile_obj))
        prompt += " The user uploaded an image of a problem. Please analyze the image and help the user solve the problem step by step."

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Please help me with this problem."},
                        {"type": "image_url", "image_url": {"url": f"data:{image.content_type};base64,{img_b64}"}}
                    ]
                }
            ],
            max_tokens=512
        )
        answer = response.choices[0].message.content or ""
        return {
            "reply": answer,
            "xp": int(xp) + 10,
            "difficulty_level": profile_obj.get("difficulty_level", 1)
        }
    except Exception as e:
        print("Error in /image:", e)
        raise HTTPException(status_code=500, detail=str(e))

QUIZ_QUESTIONS = {
    "math": [
        {
            "question": "What is 5 + 7?",
            "choices": ["10", "11", "12", "13"],
            "answer": "12",
            "explanation": "5 + 7 = 12 because adding 5 and 7 gives 12."
        },
        {
            "question": "What is 9 x 3?",
            "choices": ["27", "18", "21", "24"],
            "answer": "27",
            "explanation": "9 times 3 equals 27."
        },
        {
            "question": "What is 12 - 4?",
            "choices": ["6", "8", "9", "7"],
            "answer": "8",
            "explanation": "12 minus 4 is 8."
        },
        {
            "question": "What is 15 / 3?",
            "choices": ["3", "4", "5", "6"],
            "answer": "5",
            "explanation": "15 divided by 3 is 5."
        }
    ],
    "language": [
        {
            "question": "What is the synonym of 'happy'?",
            "choices": ["sad", "joyful", "angry", "tired"],
            "answer": "joyful"
        },
        {
            "question": "Spell 'accommodate'.",
            "choices": ["accomodate", "acommodate", "accommodate", "accomadate"],
            "answer": "accommodate"
        },
        {
            "question": "What is the antonym of 'quick'?",
            "choices": ["slow", "fast", "rapid", "swift"],
            "answer": "slow"
        }
    ],
    "science": [
        {
            "question": "What planet is known as the Red Planet?",
            "choices": ["Earth", "Venus", "Mars", "Jupiter"],
            "answer": "Mars"
        },
        {
            "question": "What gas do plants breathe in?",
            "choices": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
            "answer": "Carbon Dioxide"
        },
        {
            "question": "What is H2O?",
            "choices": ["Oxygen", "Hydrogen", "Salt", "Water"],
            "answer": "Water"
        }
    ]
}

@app.post("/quiz")
async def quiz(profile: dict = Body(...)):
    subject = profile.get("subject", "math")
    questions = QUIZ_QUESTIONS.get(subject, QUIZ_QUESTIONS["math"])
    selected = random.sample(questions, min(3, len(questions)))
    # Remove answer/explanation from response
    return {"questions": [
        {"question": q["question"], "choices": q["choices"]} for q in selected
    ]}

@app.post("/quiz/answer")
async def quiz_answer(data: dict = Body(...)):
    question = data.get("question", "")
    answer = data.get("answer", "").strip()
    subject = data.get("profile", {}).get("subject", "math")
    qbank = QUIZ_QUESTIONS.get(subject, [])
    qobj = next((q for q in qbank if q["question"] == question), None)
    correct_answer = qobj["answer"] if qobj else "N/A"
    explanation = qobj["explanation"] if qobj else ""
    correct = answer.strip().lower() == correct_answer.strip().lower()
    feedback = "✅ Correct!" if correct else f"❌ Incorrect. The correct answer is: {correct_answer}"
    return {
        "correct": correct,
        "feedback": feedback,
        "correctAnswer": correct_answer,
        "explanation": explanation
    }