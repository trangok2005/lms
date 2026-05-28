import time
import json
import google.generativeai as genai
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-3.1-flash-lite")


def analyze_quiz_result(test_result):

    if test_result.ai_summary:
        return

    prompt = f"""
    Điểm: {test_result.percentage}%
    Quiz: {test_result.quiz.title}

    Hãy trả về JSON đúng format:

    {{
      "strength_analysis": [
        "điểm mạnh 1",
        "điểm mạnh 2"
      ],
      "weakness_analysis": [
        "điểm yếu 1",
        "điểm yếu 2"
      ],
      "ai_summary": "nhận xét tổng quan"
    }}

    Chỉ trả JSON.
    """

    try:
        response = model.generate_content(prompt)

        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()

        data = json.loads(text)

        test_result.strength_analysis = data.get(
            "strength_analysis", []
        )

        test_result.weakness_analysis = data.get(
            "weakness_analysis", []
        )

        test_result.ai_summary = data.get(
            "ai_summary", ""
        )

        test_result.save()

    except Exception as e:
        print("AI ERROR:", e)