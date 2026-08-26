"""MAPO Nutrition Coach using Groq GPT-OSS-20B."""

import os
from importlib import import_module
from datetime import datetime, timezone
from mapo_chatbot import calculate_user_profile_targets, extract_drink_info


try:
    load_dotenv = import_module("dotenv").load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        """Load environment variables when python-dotenv is available."""
        return False

load_dotenv()

MODEL = "openai/gpt-oss-20b"


def _system_prompt(targets, mode, facts):
    if mode == "english":
        lang = "Reply ONLY in clear, natural English."
    else:
        lang = (
            "Default to warm Hinglish (Hindi written in Latin script, naturally mixed with English). "
            "BUT auto-match the user's language: if their latest message is fully in English, reply in English; "
            "if it's in Hindi/Hinglish, reply in Hinglish."
        )

    fact_block = (
        "\n\nGrounded facts you MUST use accurately if relevant:\n- "
        + "\n- ".join(facts)
        if facts
        else ""
    )

    return f"""You are the MAPO Coach — a warm, encouraging, judgment-free Indian nutrition & calorie coach.

About the user: {targets['name']}.
Daily calorie target is about {targets['target_calories']:.0f} kcal.
BMI: {targets['bmi']}
BMR: {targets['bmr']:.0f} kcal
TDEE: {targets['tdee']:.0f} kcal

Your style:
- Friendly, supportive, and concise (2-5 short sentences). Never shame the user.
- Talk naturally about ANYTHING they ate or drank.
- Estimate calories realistically when database information is available.
- Give one simple, practical balancing tip.
- Keep advice India-friendly (paneer, dal, roti, curd, sabzi, eggs, etc.).
- Use light, occasional emojis.
- Believe you are a nutrionist and provide inisghts just like a dietican or a nutritionist.
- Do not invent the user's calorie target, BMI, BMR or TDEE.
- Use the values provided by MAPO's Python backend.
- Keep the response language easy and genz for english.
- When using hinglish keep it more indian oriented.
{lang}{fact_block}"""


async def coach_reply(db, session_id, message, profile, mode):

    # 1. Calculate user's MAPO targets
    targets = calculate_user_profile_targets(
        {**profile, "mode": mode}
    )

    # 2. Extract deterministic food/drink facts
    facts = []

    drink = extract_drink_info(message)

    if drink:
        facts.append(
            f"{drink['drink']} ~"
            f"{drink['user_volume_ml']:.0f}ml ≈ "
            f"{drink['calories']:.0f} kcal consumed."
        )

    # 3. Get recent conversation history
    hist = (
        await db.coach_messages
        .find({"session_id": session_id})
        .sort("created_at", 1)
        .to_list(20)
    )

    transcript = "\n".join(
        [
            f"{h['role'].capitalize()}: {h['text']}"
            for h in hist[-8:]
        ]
    )

    # 4. Build the system prompt
    system_prompt = _system_prompt(
        targets,
        mode,
        facts
    )

    # 5. Build the user's message
    user_text = (
        f"Recent conversation:\n{transcript}\n\nUser: {message}"
        if transcript
        else message
    )

    # 6. Connect to Groq
    groq_module = import_module("groq")
    client = groq_module.Groq(
        api_key=os.environ["GROQ_API_KEY"]
    )

    # 7. Ask GPT-OSS-20B
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_text,
            },
        ],
        max_tokens=400,
    )

    # 8. Get AI response
    reply = response.choices[0].message.content

    # 9. Save conversation
    now = datetime.now(timezone.utc).isoformat()

    await db.coach_messages.insert_many(
        [
            {
                "session_id": session_id,
                "role": "user",
                "text": message,
                "created_at": now,
            },
            {
                "session_id": session_id,
                "role": "coach",
                "text": reply,
                "created_at": now,
            },
        ]
    )

    return reply