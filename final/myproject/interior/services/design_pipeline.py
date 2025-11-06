import base64
import io
import logging
import mimetypes
import os
from typing import Callable, Dict, List, Optional, Sequence

import google.generativeai as genai
from PIL import Image

logger = logging.getLogger(__name__)

SUPPORTED_IMAGE_MIMETYPES = ("image/jpeg", "image/png", "image/webp")

DEFAULT_EMPTY_ROOM_PROMPT = """
# Your Mission
- Remove all furniture, decorations, and objects from the image, EXCEPT for the elements listed under 'Elements to Keep'.
# Elements to Keep (DO NOT CHANGE):
- The entire structure of the room's walls, including columns, corners, ceiling, and floor shape.
- The original design of window frames and doors.
- The original material and texture of the walls and floor.
# Actions to AVOID (DO NOT DO):
- Do not demolish or create new walls.
- Do not change the size or shape of the windows.
- Do not alter the room's layout or structure in any way.
""".strip()


class PipelineStepError(RuntimeError):
    """Raised when a pipeline step fails."""


def _ensure_source_exists(path: str) -> None:
    if not os.path.exists(path):
        raise PipelineStepError(f"이미지 파일을 찾을 수 없습니다: {path}")


def _detect_mimetype(path: str) -> str:
    mimetype, _ = mimetypes.guess_type(path)
    if mimetype not in SUPPORTED_IMAGE_MIMETYPES:
        raise PipelineStepError(
            f"지원하지 않는 이미지 형식입니다: {mimetype or 'unknown'} "
            f"(지원 형식: {', '.join(SUPPORTED_IMAGE_MIMETYPES)})"
        )
    return mimetype


def _decode_image_bytes(encoded: str) -> bytes:
    try:
        return base64.b64decode(encoded)
    except (TypeError, ValueError) as exc:
        raise PipelineStepError("이미지 데이터를 디코딩하지 못했습니다.") from exc


def generate_empty_room(
    original_image_path: str,
    openai_client,
    *,
    prompt: Optional[str] = None,
    size: str = "1024x1024",
) -> Image.Image:
    """Generate an empty room image from the original input."""
    logger.info("1단계 시작: 빈 방 이미지 생성 (%s)", original_image_path)
    _ensure_source_exists(original_image_path)
    mimetype = _detect_mimetype(original_image_path)

    with open(original_image_path, "rb") as img_file:
        image_data = img_file.read()

    payload_prompt = prompt or DEFAULT_EMPTY_ROOM_PROMPT

    try:
        response = openai_client.images.edit(
            model="gpt-image-1",
            image=(os.path.basename(original_image_path), image_data, mimetype),
            prompt=payload_prompt,
            size=size,
        )
    except Exception as exc:
        raise PipelineStepError("OpenAI 이미지 편집 API 호출에 실패했습니다.") from exc

    try:
        encoded = response.data[0].b64_json
    except (AttributeError, IndexError, KeyError) as exc:
        raise PipelineStepError("OpenAI 응답에 이미지 데이터가 포함되어 있지 않습니다.") from exc

    image_bytes = _decode_image_bytes(encoded)
    result = Image.open(io.BytesIO(image_bytes))
    result.load()
    logger.info("1단계 완료: 빈 방 이미지 생성 성공")
    return result


def step3_add_local_furniture(
    empty_room_image: Image.Image,
    style_prompt: str,
    furniture_paths: Optional[Sequence[str]],
    *,
    generative_model,
    upload_file_func: Optional[Callable[[io.BytesIO, str], object]] = None,
    timeout: int = 180,
) -> Image.Image:
    """Apply style and furniture to the empty room using Gemini."""
    if generative_model is None:
        raise PipelineStepError("Gemini 모델 인스턴스가 필요합니다.")

    upload_func = upload_file_func or genai.upload_file

    prompt = f"""
    당신은 AI 인테리어 디자이너입니다.
    '빈 방' 이미지(입력 1)를 베이스로, '가구' 이미지(입력 2...)들을 배치하세요.

    # 1. 적용할 스타일 (필수):
    {style_prompt}

    # 2. 배치할 가구 (있다면 배치):
    {', '.join(furniture_paths) if furniture_paths else "없음"}

    # 3. 배치 규칙 (중요):
    - 방의 구조(벽, 창문)를 분석해서 가장 현실적인 위치에 가구를 배치해야 합니다.
    - (예: 소파는 벽을 등지도록, 테이블은 소파 앞에 배치)
    - (예: 침대는 창문이나 벽 쪽에 헤드를 두도록 배치)
    - 가구들이 서로 겹치거나 공중에 떠 있으면 안 됩니다.

    # 출력 규칙:
    - 절대 텍스트로 응답하지 마세요.
    - 오직 모든 요소가 합성된 최종 이미지 파일 하나만 반환하세요.
    """.strip()

    logger.info("3단계 시작: 스타일 적용 및 가구 배치")

    try:
        base_stream = io.BytesIO()
        empty_room_image.save(base_stream, format="WEBP")
        base_stream.seek(0)
        base_room_file = upload_func(base_stream, mime_type="image/webp")
    except Exception as exc:
        raise PipelineStepError("빈 방 이미지를 Gemini에 업로드하지 못했습니다.") from exc

    furniture_files = []
    for path in furniture_paths or []:
        try:
            _ensure_source_exists(path)
        except PipelineStepError as missing_exc:
            logger.warning("가구 이미지가 존재하지 않아 건너뜀: %s", path)
            logger.debug("세부 정보: %s", missing_exc)
            continue

        mimetype = mimetypes.guess_type(path)[0]
        if mimetype not in SUPPORTED_IMAGE_MIMETYPES:
            logger.warning("지원하지 않는 가구 이미지 형식(%s), PNG로 처리합니다. (%s)", mimetype, path)
            mimetype = "image/png"

        try:
            with open(path, "rb") as furniture_file:
                file_bytes = furniture_file.read()
            furniture_stream = io.BytesIO(file_bytes)
            furniture_files.append(upload_func(furniture_stream, mime_type=mimetype))
            logger.debug("가구 이미지 업로드 완료: %s", path)
        except Exception as exc:
            logger.warning("가구 이미지 업로드 실패(%s): %s", path, exc)

    request_payload = [prompt, base_room_file] + furniture_files

    try:
        response = generative_model.generate_content(
            request_payload,
            request_options={"timeout": timeout},
        )
    except Exception as exc:
        raise PipelineStepError(
            f"Gemini 이미지 합성 API 호출에 실패했습니다: {exc}"
        ) from exc

    candidates = getattr(response, "candidates", None)
    if not candidates:
        raise PipelineStepError("Gemini 응답에 후보 결과가 없습니다.")

    image_bytes: Optional[bytes] = None
    text_messages = []
    for part in candidates[0].content.parts:
        inline_data = getattr(part, "inline_data", None)
        if inline_data:
            data = getattr(inline_data, "data", None)
            if isinstance(data, str):
                image_bytes = _decode_image_bytes(data)
            elif isinstance(data, bytes):
                image_bytes = data
            if image_bytes:
                break
        text = getattr(part, "text", None)
        if text:
            text_messages.append(text)

    if image_bytes is None:
        detail = " / ".join(text_messages) if text_messages else "이미지 출력 없음"
        raise PipelineStepError(f"Gemini가 이미지를 반환하지 않았습니다. 응답: {detail}")

    result = Image.open(io.BytesIO(image_bytes))
    result.load()
    logger.info("3단계 완료: 스타일 적용 및 가구 배치 성공")
    return result


def step4_iterative_refinement(
    final_image: Image.Image,
    refinement_prompt: str,
    openai_client,
    *,
    size: str = "1024x1024",
    filename: str = "step4_input.webp",
) -> Image.Image:
    """Refine the generated image using OpenAI."""
    logger.info("4단계 시작: 부분 수정 (prompt=%s)", refinement_prompt)

    try:
        byte_stream = io.BytesIO()
        final_image.save(byte_stream, format="WEBP")
        byte_stream.seek(0)
        image_bytes = byte_stream.read()
    except Exception as exc:
        raise PipelineStepError("최종 이미지를 수정 입력용으로 변환하지 못했습니다.") from exc

    try:
        response = openai_client.images.edit(
            model="gpt-image-1",
            image=(filename, image_bytes, "image/webp"),
            prompt=refinement_prompt,
            size=size,
        )
    except Exception as exc:
        raise PipelineStepError("OpenAI 이미지 수정 API 호출에 실패했습니다.") from exc

    try:
        encoded = response.data[0].b64_json
    except (AttributeError, IndexError, KeyError) as exc:
        raise PipelineStepError("OpenAI 응답에 수정 이미지 데이터가 없습니다.") from exc

    image_bytes = _decode_image_bytes(encoded)
    result = Image.open(io.BytesIO(image_bytes))
    result.load()
    logger.info("4단계 완료: 부분 수정 성공")
    return result


def run_design_pipeline(
    original_image_path: str,
    *,
    openai_client,
    generative_model,
    style_prompt: str,
    refinement_prompt: Optional[str] = None,
    furniture_paths: Optional[Sequence[str]] = None,
    size: str = "1024x1024",
    gemini_timeout: int = 180,
    variations: int = 1,
) -> Dict[str, object]:
    """Run the full AI pipeline and return all variants."""
    empty_room = generate_empty_room(
        original_image_path,
        openai_client,
        size=size,
    )

    variants: List[Dict[str, Image.Image]] = []
    variation_count = max(1, int(variations))
    errors: List[str] = []

    for index in range(variation_count):
        try:
            logger.info("변형 %d/%d 생성 시작", index + 1, variation_count)
            with_furniture = step3_add_local_furniture(
                empty_room,
                style_prompt,
                furniture_paths or [],
                generative_model=generative_model,
                timeout=gemini_timeout,
            )

            final_image = with_furniture
            if refinement_prompt:
                final_image = step4_iterative_refinement(
                    with_furniture,
                    refinement_prompt,
                    openai_client,
                    size=size,
                )

            variants.append(
                {
                    "index": index + 1,
                    "with_furniture": with_furniture,
                    "final_image": final_image,
                }
            )
            logger.info("변형 %d 생성 완료", index + 1)
        except PipelineStepError as exc:
            logger.error("변형 %d 생성 실패: %s", index + 1, exc)
            errors.append(str(exc))
            if not variants:
                raise
            break
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("변형 %d 생성 중 예기치 못한 오류 발생", index + 1)
            errors.append(f"예기치 못한 오류: {exc}")
            if not variants:
                raise PipelineStepError("파이프라인 실행 중 예기치 못한 오류가 발생했습니다.") from exc
            break

    return {
        "empty_room": empty_room,
        "variants": variants,
        "errors": errors,
    }


__all__ = [
    "PipelineStepError",
    "generate_empty_room",
    "step3_add_local_furniture",
    "step4_iterative_refinement",
    "run_design_pipeline",
]
