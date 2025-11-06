from functools import lru_cache

import google.generativeai as genai
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from openai import OpenAI


def _get_setting(name: str) -> str:
    value = getattr(settings, name, None)
    if not value:
        raise ImproperlyConfigured(f"{name} 설정이 비어 있습니다.")
    return value


@lru_cache(maxsize=1)
def get_openai_client() -> OpenAI:
    """OpenAI 클라이언트를 반환한다."""
    api_key = _get_setting("OPENAI_TEAM_API_KEY")
    return OpenAI(api_key=api_key)


@lru_cache(maxsize=None)
def get_generative_model(model_name: str = "gemini-2.5-flash-image"):
    """Gemini GenerativeModel 인스턴스를 반환한다."""
    api_key = _get_setting("GEMINI_API_KEY")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)
