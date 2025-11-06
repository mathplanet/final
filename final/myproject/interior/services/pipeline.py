import os 
import io
import base64
import mimetypes
from openai import OpenAI
from PIL import Image
from dotenv import load_dotenv
import requests
import google.generativeai as genai

# .env 파일에서 API 키 불러오기
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_TEAM_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # 3단계를 위한 키

if not OPENAI_API_KEY:
    raise ValueError("❌ .env 파일에 OPENAI_TEAM_API_KEY가 설정되어야 합니다.")
if not GEMINI_API_KEY:
    raise ValueError("❌ .env 파일에 GEMINI_API_KEY가 설정되어야 합니다.")

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=OPENAI_API_KEY)
# Gemini API 설정
genai.configure(api_key=GEMINI_API_KEY)


def generate_empty_room(original_image_path: str) -> Image.Image:
    """
    1단계: 원본 이미지를 받아 '빈 방' 이미지를 생성합니다.
    """
    print(f"⏳ 1단계: '{original_image_path}'에서 가구 제거를 시작합니다...")
    
    prompt = """
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
    """
    
    try:
        print("   - (1/3) 원본 이미지 파일을 엽니다...")
        if not os.path.exists(original_image_path):
            print(f"   ❌ 오류: 파일 경로를 찾을 수 없습니다 -> {original_image_path}")
            return None

        mimetype, _ = mimetypes.guess_type(original_image_path)
        supported_mimetypes = ['image/jpeg', 'image/png', 'image/webp']
        
        if mimetype not in supported_mimetypes:
            print(f"   ❌ 오류: 지원하지 않는 파일 형식입니다: {mimetype}")
            print(f"   (지원 형식: {', '.join(supported_mimetypes)})")
            return None
        
        print(f"   - (파일 형식 감지: {mimetype})")
            
        with open(original_image_path, "rb") as img_file:
            image_data = img_file.read()
            
        print("   - (2/3) OpenAI API를 호출합니다. (여기서 1~2분 정도 걸릴 수 있습니다 ⏰)")

        response = client.images.edit(
            model="gpt-image-1",
            image=(os.path.basename(original_image_path), image_data, mimetype),
            prompt=prompt,
            size="1024x1024"
        )
        
        print("   - (3/3) API 응답 완료. 이미지를 디코딩합니다...")
        img_data = response.data[0].b64_json
        img = Image.open(io.BytesIO(base64.b64decode(img_data)))
        print("✅ 1단계: '빈 방' 이미지 생성 완료!")
        return img

    except Exception as e:
        print(f"❌ 1단계 중 심각한 오류 발생: {e}")
        return None


def step3_add_local_furniture(
    empty_room_image: Image.Image, 
    style_prompt: str,
    furniture_paths: list[str]
) -> Image.Image:
    """
    3단계: '빈 방' 이미지에 '스타일'을 적용하고 '로컬 가구'들을 배치합니다.
    """
    
    # 0. Gemini 모델 초기화
    try:
        model = genai.GenerativeModel("gemini-2.5-flash-image")
    except Exception as e:
        print(f"❌ 3단계 실패: Gemini 모델 로딩 중 오류. {e}")
        return None

    # 1. 프롬프트 정의
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
    - **절대 텍스트로 응답하지 마세요.**
    - 오직 모든 요소가 합성된 **최종 이미지 파일 하나만** 반환하세요.
    """

    # 2. (입력 1) '빈 방' 이미지를 Gemini에 업로드
    print(f"⏳ 3단계: 특정 가구 배치 및 스타일링 작업을 시작합니다...")
    try:
        byte_stream = io.BytesIO()
        empty_room_image.save(byte_stream, format="WEBP")
        byte_stream.seek(0)
        base_room_file = genai.upload_file(byte_stream, mime_type="image/webp")
    except Exception as e:
        print(f"❌ 3단계 실패: 베이스 이미지 업로드 중 오류. {e}")
        return None
        
    # 3. (입력 2...) '가구 로컬 파일'들을 읽어 Gemini에 업로드
    furniture_files = []
    if furniture_paths: # ❗️ 가구 리스트가 있을 때만 업로드
        print(f"   - 가구 파일 {len(furniture_paths)}개 로드 및 업로드 중...")
        for path in furniture_paths:
            try:
                if not os.path.exists(path):
                    print(f"     ⚠️ '{path}' 파일이 존재하지 않습니다. 건너뜁니다.")
                    continue
                
                mimetype, _ = mimetypes.guess_type(path)
                if not mimetype or mimetype not in ['image/jpeg', 'image/png', 'image/webp']:
                    mimetype = "image/png"
                    
                with open(path, "rb") as f:
                    img_bytes = f.read()
                
                furniture_files.append(
                    genai.upload_file(io.BytesIO(img_bytes), mime_type=mimetype)
                )
                print(f"     ... {path} 업로드 완료. (형식: {mimetype})")
            except Exception as e:
                print(f"     ⚠️ '{path}' 업로드 실패: {e}")
    else:
        print("   - ⚠️ 가구 목록이 비어있습니다. 스타일만 적용합니다.")
    
    # ❗️ 가구 리스트가 비어있어도 API는 호출되어야 함 (스타일 적용)
    # (이전의 'if not furniture_files: return None' 로직 제거됨)

    # 4. Gemini API 호출
    try:
        print("   - Gemini API 호출... (시간이 걸릴 수 있습니다 ⏰)")
        response = model.generate_content(
            [prompt] + [base_room_file] + furniture_files, # furniture_files가 비어있어도 OK
            request_options={"timeout": 180}
        )

        # 5. 결과 파싱 (모델이 이미지를 반환했는지 텍스트를 반환했는지 확인)
        print("   - (5/5) Gemini 응답 파싱 중...")
        image_part = None
        text_parts = []
        if not response.candidates:
             print("❌ 3단계 실패: Gemini API가 유효한 응답을 반환하지 않았습니다.")
             return None
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                image_part = part
                break
            if part.text:
                text_parts.append(part.text)

        if image_part:
            img_data = image_part.inline_data.data
            final_image = Image.open(io.BytesIO(img_data))
            print("✅ 3단계: 최종 가구 배치 및 스타일링 완료!")
            return final_image
        else:
            print("❌ 3단계 실패: Gemini 모델이 이미지를 생성하지 못했습니다.")
            if text_parts:
                print("   -> Gemini 모델의 응답 (텍스트):")
                for text in text_parts:
                    print(f"      {text}")
            return None

    except Exception as e:
        print(f"❌ 3단계 가구 배치 중 심각한 오류 발생: {e}")
        if "quota" in str(e).lower():
            print("   -> ⚠️ Gemini API 무료 사용량(Quota)을 초과했을 수 있습니다.")
        return None


def step4_iterative_refinement(
    final_image_pil: Image.Image, 
    refinement_prompt: str
) -> Image.Image:
    """
    4단계: (OpenAI) 이미 생성된 최종 이미지를 받아, 추가 수정 지시를 처리합니다.
    """
    print(f"⏳ 4단계: (OpenAI) 부분 수정 작업을 시작합니다... ('{refinement_prompt}')")

    try:
        byte_stream = io.BytesIO()
        final_image_pil.save(byte_stream, format="WEBP")
        byte_array = byte_stream.getvalue()
    except Exception as e:
        print(f"   ❌ 4단계 오류: 이미지 변환 실패. {e}")
        return None

    try:
        print("   - (1/2) OpenAI API(gpt-image-1)를 호출합니다...")
        response = client.images.edit(
            model="gpt-image-1",
            image=( "step4_input.webp", byte_array, "image/webp" ),
            prompt=refinement_prompt,
            size="1024x1024"
        )
        print("   - (2/2) API 응답 완료. 수정된 이미지를 디코딩합니다...")
        img_data = response.data[0].b64_json
        img = Image.open(io.BytesIO(base64.b64decode(img_data)))
        print("✅ 4단계: 최종 수정 완료!")
        return img
    except Exception as e:
        print(f"❌ 4단계 실패: {e}")
        return None

# =====================================
# 🚀 메인 파이프라인 실행 
# =====================================
if __name__ == "__main__":
    
    # --- 1. 사용자 입력 정의 ---
    original_path = "./empty_room/거실.jpg" 
    
    style_description = """
    - 스타일: 매우 모던하고 미니멀한 화이트톤
    - 벽: 깨끗한 흰색
    - 바닥: 밝은 회색빛이 도는 원목 마루
    - 조명: 따뜻한 색의 은은한 간접 조명
    """
    
    furniture_file_list = [
       "./furniture/sofa.jpg",
       "./furniture/table.webp"
    ]
    
    # ❗️ 4단계 전용 하드코딩 프롬프트
    refinement_prompt = "오른쪽 벽면에 심플한 원형 시계를 걸어주세요."
    
    # -----------------------------------------------------------
    # ❗️❗️❗️ 2. 실행 모드 플래그 ❗️❗️❗️
    # True:  '4단계 수정'만 실행합니다. (3단계 캐시 파일[result_3_...]이 있어야 함)
    # False: '1~3단계 생성'만 실행합니다. (4단계는 실행 안 함)
    # -----------------------------------------------------------
    run_only_step_4_refinement = False 
    
    # --- 3. 캐시 파일 경로 정의 ---
    base_name = os.path.splitext(os.path.basename(original_path))[0]
    dir_name = os.path.dirname(original_path)
    cached_empty_path = os.path.join(dir_name, f"{base_name}_empty.webp")
    step3_cache_path = "result_3_final_with_furniture.webp"
    step4_cache_path = "result_4_final_refined.webp"

    
    # -----------------------------------------------------------------
    # --- 모드 1: "4단계 수정"만 실행 (True일 때) ---
    # -----------------------------------------------------------------
    if run_only_step_4_refinement:
        print("🟢 4단계 '부분 수정' 모드로 실행합니다.")
        
        step3_img = None
        
        # 4단계를 실행하려면 3단계의 결과물이 반드시 필요함
        if os.path.exists(step3_cache_path):
            try:
                print(f"   - 3단계 캐시 파일({step3_cache_path})을 찾았습니다.")
                step3_img = Image.open(step3_cache_path)
            except Exception as e:
                print(f"   ❌ 3단계 캐시 파일 로딩 실패: {e}")
                step3_img = None
        
        if step3_img:
            # 3단계 이미지가 있으니 4단계 실행
            print("\n--- 4단계(OpenAI) 부분 수정 실행 ---")
            step4_img = step4_iterative_refinement(
                step3_img,          # 3단계 결과물
                refinement_prompt   # 수정 지시사항
            )
            
            if step4_img:
                step4_img.save(step4_cache_path, format="WEBP")
                print(f"💾 4단계 수정 결과가 '{step4_cache_path}'에 저장되었습니다.")
        else:
            print(f"❌ 4단계 실행 실패: 3단계 캐시 파일 '{step3_cache_path}'이 없습니다.")
            print("   -> (먼저 `run_only_step_4_refinement = False`로 3단계 이미지를 생성하세요.)")

    # -----------------------------------------------------------------
    # --- 모드 2: "1~3단계 생성"만 실행 (False일 때) ---
    # -----------------------------------------------------------------
    else:
        print("🔵 '1~3단계 생성' 모드로 실행합니다. (4단계는 실행 안 함)")
        
        # --- 1단계 캐시(Cache) 확인 및 실행 ---
        empty_room_img = None
        if os.path.exists(cached_empty_path):
            try:
                print(f"✅ 1단계 건너뛰기: 캐시된 빈 방 파일({cached_empty_path})을 찾았습니다.")
                empty_room_img = Image.open(cached_empty_path)
            except Exception as e:
                print(f"   ⚠️ 1단계 캐시 파일 로딩 실패: {e}. 1단계를 새로 실행합니다.")
                empty_room_img = None
        
        if empty_room_img is None:
            print("\n--- 1단계 실행 (OpenAI API 호출) ---")
            empty_room_img = generate_empty_room(original_path)
            if empty_room_img:
                empty_room_img.save(cached_empty_path, format="WEBP")
                print(f"💾 1단계 결과가 캐시 파일 '{cached_empty_path}'에 저장되었습니다.")
            else:
                print("❌ 1단계 실행에 실패하여 파이프라인을 중단합니다.")

        # --- 3단계 캐시 확인 및 실행 ---
        if empty_room_img:
            step3_img = None
            if os.path.exists(step3_cache_path):
                try:
                    print(f"\n✅ 3단계 건너뛰기: 캐시된 3단계 파일({step3_cache_path})을 찾았습니다.")
                    step3_img = Image.open(step3_cache_path)
                except Exception as e:
                    print(f"   ⚠️ 3단계 캐시 파일 로딩 실패: {e}. 3단계를 새로 실행합니다.")
                    step3_img = None
            
            if step3_img is None:
                print("\n--- 1단계 준비 완료, 3단계(Gemini) 실행 ---")
                step3_img = step3_add_local_furniture(
                    empty_room_img,      
                    style_description,   
                    furniture_file_list  
                )
                if step3_img:
                    step3_img.save(step3_cache_path, format="WEBP")
                    print(f"💾 3단계 최종 결과가 '{step3_cache_path}'에 저장되었습니다.")
                else:
                    print("❌ 3단계 실행에 실패하여 파이프라인을 중단합니다.")

            # ❗️ 3단계 성공 시, 4단계 호출 없이 파이프라인 종료
            if step3_img:
                print("\n✅ 3단계 생성 완료. 파이프라인을 종료합니다.")
            
        else:
            print("\n❌ 1단계에서 이미지가 준비되지 않아 3단계를 건너뜁니다.")