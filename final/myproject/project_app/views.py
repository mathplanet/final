# project_app/views.py
from django.db import connection, transaction, IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from datetime import datetime, timedelta
import hashlib
import io
import logging
import os
import tempfile
import uuid
import requests

from django.core.exceptions import ImproperlyConfigured
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image

from .models import User, Project, CustomizeReq, PendingUser, AiMakeImage
from .serializers import ProjectSerializer, PendingUserSerializer, AdminUserSerializer
from interior.services.clients import get_generative_model, get_openai_client
from interior.services.design_pipeline import (
    PipelineStepError,
    run_design_pipeline,
    step4_iterative_refinement,
)

logger = logging.getLogger(__name__)


# ✅ 비밀번호 해시 (단순 SHA256)
def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


# ✅ 회원가입
@api_view(["POST"])
def register(request):
    user_id = request.data.get("user_id")
    password = request.data.get("password")
    name = request.data.get("name") or "디자이너"
    email = request.data.get("email")
    role = request.data.get("role") or "DESIGNER"

    if not user_id or not password:
        return Response({"error": "아이디와 비밀번호는 필수입니다."},
                        status=status.HTTP_400_BAD_REQUEST)

    # 중복 확인
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM users WHERE user_id = %s", [user_id])
        if cursor.fetchone()[0] > 0:
            return Response({"error": "이미 존재하는 아이디입니다."}, status=status.HTTP_400_BAD_REQUEST)

    if PendingUser.objects.filter(user_id=user_id, status__in=["pending", "approved"]).exists():
        return Response({"error": "이미 가입 요청이 진행 중이거나 완료된 아이디입니다."}, status=status.HTTP_400_BAD_REQUEST)

    hashed_pw = hash_password(password)

    PendingUser.objects.create(
        user_id=user_id,
        password=hashed_pw,
        name=name,
        email=email,
        role=role,
    )

    return Response(
        {"message": "가입 신청이 접수되었습니다. 관리자 승인 후 이용 가능합니다."},
        status=status.HTTP_201_CREATED,
    )


# ✅ 로그인
@api_view(["POST"])
def login(request):
    login_id = request.data.get("user_id")  # 로그인 입력값 (문자열)
    password = request.data.get("password")

    if not all([login_id, password]):
        return Response({"error": "아이디와 비밀번호를 입력해주세요."}, status=status.HTTP_400_BAD_REQUEST)

    hashed_pw = hash_password(password)
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT user_id, name, user_permission_code 
            FROM users 
            WHERE user_id = %s AND password = %s
            """,
            [login_id, hashed_pw]
        )
        row = cursor.fetchone()

    if not row:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM users WHERE user_id = %s", [login_id])
            exists = cursor.fetchone()
        if exists:
            return Response({"error": "비밀번호가 일치하지 않습니다."},
                            status=status.HTTP_401_UNAUTHORIZED)

        pending = PendingUser.objects.filter(user_id=login_id).order_by("-registered_at").first()
        if pending:
            if pending.status == "pending":
                return Response({"error": "가입 승인이 진행 중입니다. 관리자 승인 후 로그인 가능합니다."},
                                status=status.HTTP_403_FORBIDDEN)
            if pending.status == "rejected":
                msg = pending.rejected_reason or "관리자에 의해 가입 요청이 거절되었습니다."
                return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)

        return Response({"error": "로그인 실패. 아이디 또는 비밀번호를 확인하세요."},
                        status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        "message": "로그인 성공", 
        "user_id": row[0],     # 로그인용 ID (문자열)
        "name": row[1],
        "role": row[2]
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def create_project(request):
    data = request.data
    user_login_id = data.get("user_id")

    if not user_login_id:
        return Response({"error": "user_id는 필수입니다."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(user_id=user_login_id)
    except User.DoesNotExist:
        return Response({"error": "유효하지 않은 사용자입니다."}, status=status.HTTP_400_BAD_REQUEST)

    image_file = request.FILES.get("image")
    image_url = None
    image_bytes = None
    image_ext = "jpg"

    if image_file:
        try:
            image_bytes = image_file.read()
            if not image_bytes:
                raise ValueError("빈 이미지입니다.")
            if "." in image_file.name:
                image_ext = image_file.name.rsplit(".", 1)[-1].lower() or "jpg"
            unique_name = f"{user_login_id}_{uuid.uuid4().hex[:8]}.{image_ext}"
            saved_path = default_storage.save(unique_name, ContentFile(image_bytes))
            image_url = default_storage.url(saved_path)
        except Exception as exc:
            logger.error("원본 이미지 저장 실패: %s", exc)
            return Response({"error": "이미지 업로드에 실패했습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    with connection.cursor() as cursor:
        cursor.execute("SELECT COALESCE(MAX(project_id), 0) + 1 FROM project;")
        next_project_id = cursor.fetchone()[0]

    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO project (
                project_id, user_id, project_name, description, status, project_image, create_date, update_date
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW());
            """,
            [
                next_project_id,
                user.user_id,
                data.get("title", "새 인테리어 프로젝트"),
                f"{user.name}의 인테리어 요청",
                "progress",
                image_url,
            ],
        )

    with connection.cursor() as cursor:
        cursor.execute("SELECT COALESCE(MAX(req_id), 0) + 1 FROM customize_req;")
        next_req_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO customize_req (
                req_id, project_id, residence_type, space_type, budget_range,
                family_type, design_style, attachment_path
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """,
            [
                next_req_id,
                next_project_id,
                data.get("residence_type"),
                data.get("space_type"),
                data.get("budget_range"),
                data.get("family_type"),
                data.get("design_style"),
                image_url,
            ],
        )

    style_parts = []
    if data.get("design_style"):
        style_parts.append(f"- 선호 스타일: {data.get('design_style')}")
    if data.get("residence_type"):
        style_parts.append(f"- 주거 형태: {data.get('residence_type')}")
    if data.get("space_type"):
        style_parts.append(f"- 공간 종류: {data.get('space_type')}")
    if data.get("family_type"):
        style_parts.append(f"- 가족 구성: {data.get('family_type')}")
    if data.get("budget_range"):
        style_parts.append(f"- 예산 범위: {data.get('budget_range')}")

    style_prompt = "\n".join(style_parts) or "현실적인 가구 배치를 적용해주세요."
    refinement_prompt = data.get("refinement_prompt")

    pipeline_payload = {"status": "skipped", "reason": "이미지가 제공되지 않았습니다.", "images": []}
    temp_source_path = None

    if image_bytes:
        try:
            with tempfile.NamedTemporaryFile(suffix=f".{image_ext}", delete=False) as temp_file:
                temp_file.write(image_bytes)
                temp_source_path = temp_file.name

            try:
                openai_client = get_openai_client()
                gemini_model = get_generative_model()
            except ImproperlyConfigured as exc:
                raise PipelineStepError(str(exc)) from exc

            variation_count = data.get("image_variations") or data.get("variations") or data.get("variation_count")
            try:
                variations = int(variation_count) if variation_count is not None else 1
            except (TypeError, ValueError):
                variations = 1

            pipeline_images = run_design_pipeline(
                temp_source_path,
                openai_client=openai_client,
                generative_model=gemini_model,
                style_prompt=style_prompt,
                refinement_prompt=refinement_prompt,
                furniture_paths=None,
                variations=variations,
            )

            variant_payloads = []
            pipeline_errors = pipeline_images.get("errors") or []

            variants = pipeline_images.get("variants", [])
            if not variants:
                raise PipelineStepError("AI 파이프라인이 어떤 이미지도 생성하지 못했습니다.")

            with connection.cursor() as cursor:
                cursor.execute("SELECT COALESCE(MAX(image_id), 0) + 1 FROM ai_make_image;")
                next_image_id = cursor.fetchone()[0]

                for offset, variant in enumerate(variants):
                    final_image = variant.get("final_image")
                    if not final_image:
                        continue

                    buffer = io.BytesIO()
                    final_image.save(buffer, format="WEBP")
                    buffer.seek(0)

                    result_filename = f"{user_login_id}_{uuid.uuid4().hex[:8]}_result_{offset + 1}.webp"
                    result_storage_path = default_storage.save(result_filename, ContentFile(buffer.getvalue()))
                    result_url = default_storage.url(result_storage_path)

                    cursor.execute(
                        """
                        INSERT INTO ai_make_image (image_id, project_id, req_id, ai_image_path, is_selected)
                        VALUES (%s, %s, %s, %s, %s);
                        """,
                        [next_image_id + offset, next_project_id, next_req_id, result_url, "N"],
                    )

                    variant_payloads.append(
                        {
                            "index": variant.get("index", offset + 1),
                            "image_url": result_url,
                        }
                    )

            payload_status = "completed"
            if pipeline_errors:
                payload_status = "partial"

            pipeline_payload = {
                "status": payload_status,
                "count": len(variant_payloads),
                "images": variant_payloads,
                "preview_url": variant_payloads[0]["image_url"] if variant_payloads else None,
            }

            if pipeline_errors:
                pipeline_payload["warnings"] = pipeline_errors
        except PipelineStepError as exc:
            logger.error("파이프라인 단계 오류: %s", exc)
            pipeline_payload = {"status": "failed", "reason": str(exc)}
        except Exception as exc:
            logger.exception("파이프라인 실행 중 알 수 없는 오류가 발생했습니다.")
            pipeline_payload = {
                "status": "failed",
                "reason": f"파이프라인 실행 중 오류가 발생했습니다: {exc}",
            }
        finally:
            if temp_source_path and os.path.exists(temp_source_path):
                try:
                    os.remove(temp_source_path)
                except OSError:
                    logger.warning("임시 파일 삭제 실패: %s", temp_source_path)

    return Response(
        {
            "message": "프로젝트가 성공적으로 생성되었습니다.",
            "project_id": next_project_id,
            "pipeline": pipeline_payload,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def refine_project_image(request, project_id, image_id):
    refinement_prompt = request.data.get("refinement_prompt")
    if not refinement_prompt:
        return Response({"error": "refinement_prompt 값이 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target_image = AiMakeImage.objects.get(project_id=project_id, image_id=image_id)
    except AiMakeImage.DoesNotExist:
        return Response({"error": "AI 이미지를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

    if not target_image.ai_image_path:
        return Response({"error": "AI 이미지 경로가 비어 있습니다."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        download_resp = requests.get(target_image.ai_image_path, timeout=30)
        download_resp.raise_for_status()
    except Exception as exc:
        logger.error("AI 이미지 다운로드 실패(image_id=%s): %s", image_id, exc)
        return Response({"error": "기존 이미지를 다운로드하지 못했습니다."}, status=status.HTTP_502_BAD_GATEWAY)

    try:
        base_image = Image.open(io.BytesIO(download_resp.content))
    except Exception as exc:
        logger.error("AI 이미지 로딩 실패(image_id=%s): %s", image_id, exc)
        return Response({"error": "기존 이미지를 읽을 수 없습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        openai_client = get_openai_client()
    except ImproperlyConfigured as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        refined_image = step4_iterative_refinement(
            base_image,
            refinement_prompt,
            openai_client,
        )
    except PipelineStepError as exc:
        logger.error("부분 수정 실패(image_id=%s): %s", image_id, exc)
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("부분 수정 중 예기치 못한 오류(image_id=%s)", image_id)
        return Response({"error": "부분 수정 중 알 수 없는 오류가 발생했습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    buffer = io.BytesIO()
    refined_image.save(buffer, format="WEBP")
    buffer.seek(0)

    result_filename = f"{project_id}_{uuid.uuid4().hex[:8]}_refined.webp"
    storage_path = default_storage.save(result_filename, ContentFile(buffer.getvalue()))
    image_url = default_storage.url(storage_path)

    with connection.cursor() as cursor:
        cursor.execute("SELECT COALESCE(MAX(image_id), 0) + 1 FROM ai_make_image;")
        next_image_id = cursor.fetchone()[0]
        cursor.execute(
            """
            INSERT INTO ai_make_image (image_id, project_id, req_id, ai_image_path, is_selected)
            VALUES (%s, %s, %s, %s, %s);
            """,
            [next_image_id, project_id, target_image.req_id, image_url, "N"],
        )

    return Response(
        {
            "message": "부분 수정 이미지가 생성되었습니다.",
            "image": {
                "image_id": next_image_id,
                "project_id": project_id,
                "req_id": target_image.req_id,
                "image_url": image_url,
                "source_image_id": image_id,
            },
        },
        status=status.HTTP_201_CREATED,
    )



# ✅ 프로젝트 목록 조회 (유저별)
@api_view(["GET"])
def list_projects(request, user_id):
    projects = (
        Project.objects.filter(user_id=user_id)
        .order_by("-create_date")
        .prefetch_related("custom_requests")
    )

    payload = []
    for project in projects:
        customize = project.custom_requests.first()
        payload.append(
            {
                "id": project.project_id,
                "title": project.project_name,
                "description": project.description,
                "status": project.status,
                "created_at": project.create_date,
                "updated_at": project.update_date,
                "project_image": project.project_image,
                "residence_type": getattr(customize, "residence_type", None),
                "space_type": getattr(customize, "space_type", None),
                "budget_range": getattr(customize, "budget_range", None),
                "family_type": getattr(customize, "family_type", None),
                "design_style": getattr(customize, "design_style", None),
                "attachment_path": getattr(customize, "attachment_path", None),
            }
        )

    return Response(payload, status=status.HTTP_200_OK)


@api_view(["GET"])
def list_project_ai_images(request, project_id):
    images = (
        AiMakeImage.objects.filter(project_id=project_id)
        .select_related("req", "project")
        .order_by("image_id")
    )

    data = []
    for image in images:
        req = image.req
        data.append(
            {
                "image_id": image.image_id,
                "project_id": image.project_id,
                "req_id": getattr(req, "req_id", None),
                "image_url": image.ai_image_path,
                "is_selected": (image.is_selected or "").upper() == "Y",
                "design_style": getattr(req, "design_style", None),
                "residence_type": getattr(req, "residence_type", None),
                "space_type": getattr(req, "space_type", None),
                "budget_range": getattr(req, "budget_range", None),
                "family_type": getattr(req, "family_type", None),
            }
        )

    return Response(data, status=status.HTTP_200_OK)


# ✅ 상태 변경
@api_view(["PATCH"])
def update_project_status(request, project_id):
    new_status = request.data.get("status")

    try:
        project = Project.objects.get(project_id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "프로젝트를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

    project.status = new_status
    project.save()
    return Response(ProjectSerializer(project).data, status=status.HTTP_200_OK)


# ✅ 통계 (유저별)
class ProjectStatsView(APIView):
    def get(self, request, user_id):
        try:
            # ✅ FK 조인 안 하고 바로 user_id로 필터
            projects = Project.objects.filter(user_id=user_id)
        except Exception:
            return Response({"error": "유효하지 않은 사용자입니다."}, status=status.HTTP_400_BAD_REQUEST)

        total_projects = projects.count()
        in_progress = projects.filter(status="progress").count()
        completed = projects.filter(status="completed").count()

        now = timezone.now()
        last_month = now - timedelta(days=30)
        created_recently = projects.filter(create_date__gte=last_month).count()

        data = {
            "total_projects": total_projects,
            "in_progress": in_progress,
            "completed": completed,
            "recent_increase": created_recently,
        }
        return Response(data, status=status.HTTP_200_OK)


class AdminValidationMixin:
    def _get_admin(self, request):
        admin_id = request.headers.get("X-Admin-Id") or request.query_params.get("admin_id")
        if not admin_id:
            raise PermissionDenied("관리자 인증 정보가 필요합니다.")

        try:
            admin = User.objects.get(user_id=admin_id)
        except User.DoesNotExist:
            raise PermissionDenied("관리자 계정을 찾을 수 없습니다.")

        if admin.user_permission_code != "ADMIN":
            raise PermissionDenied("관리자 권한이 없습니다.")

        return admin


class PendingUserListView(AdminValidationMixin, APIView):
    def get(self, request):
        self._get_admin(request)
        status_filter = request.query_params.get("status")

        queryset = PendingUser.objects.all().order_by("-registered_at")
        if status_filter in {"pending", "approved", "rejected"}:
            queryset = queryset.filter(status=status_filter)

        serializer = PendingUserSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PendingUserApproveView(AdminValidationMixin, APIView):
    def patch(self, request, pending_id):
        admin = self._get_admin(request)

        try:
            pending = PendingUser.objects.get(pk=pending_id)
        except PendingUser.DoesNotExist:
            return Response({"error": "가입 요청을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

        if pending.status != "pending":
            return Response({"error": "이미 처리된 요청입니다."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(user_id=pending.user_id).exists():
            PendingUser.objects.filter(pk=pending_id).update(status="approved", approved_at=timezone.now(), approved_by=admin.user_id)
            return Response({"error": "이미 동일한 아이디가 존재하여 자동 승인 처리되었습니다."}, status=status.HTTP_409_CONFLICT)

        now = timezone.now()

        try:
            with transaction.atomic():
                User.objects.create(
                    user_id=pending.user_id,
                    password=pending.password,
                    name=pending.name or "디자이너",
                    user_permission_code=pending.role or "DESIGNER",
                    create_day=now,
                    update_day=now,
                )

                PendingUser.objects.filter(pk=pending_id).update(
                    status="approved",
                    approved_at=now,
                    approved_by=admin.user_id,
                    rejected_reason=None,
                )
        except IntegrityError:
            return Response({"error": "사용자 생성 중 오류가 발생했습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "가입 요청을 승인했습니다."}, status=status.HTTP_200_OK)


class PendingUserRejectView(AdminValidationMixin, APIView):
    def patch(self, request, pending_id):
        admin = self._get_admin(request)
        reason = request.data.get("reason")

        try:
            pending = PendingUser.objects.get(pk=pending_id)
        except PendingUser.DoesNotExist:
            return Response({"error": "가입 요청을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

        if pending.status == "approved":
            return Response({"error": "이미 승인된 요청은 거절할 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        PendingUser.objects.filter(pk=pending_id).update(
            status="rejected",
            approved_at=None,
            approved_by=admin.user_id,
            rejected_reason=reason,
        )

        return Response({"message": "가입 요청을 거절했습니다."}, status=status.HTTP_200_OK)


class PendingUserDeleteView(AdminValidationMixin, APIView):
    def delete(self, request, pending_id):
        self._get_admin(request)

        deleted, _ = PendingUser.objects.filter(pk=pending_id).delete()
        if not deleted:
            return Response({"error": "가입 요청을 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": "가입 요청을 삭제했습니다."}, status=status.HTTP_200_OK)


class AdminUserListView(AdminValidationMixin, APIView):
    def get(self, request):
        self._get_admin(request)
        users = User.objects.all().order_by("-create_day")
        serializer = AdminUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserDeleteView(AdminValidationMixin, APIView):
    def delete(self, request, user_id):
        admin = self._get_admin(request)

        if user_id == admin.user_id:
            return Response({"error": "자신의 계정은 삭제할 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT user_permission_code FROM users WHERE user_id = %s",
                [user_id],
            )
            row = cursor.fetchone()

            if not row:
                return Response({"error": "사용자를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

            if row[0] == "ADMIN":
                return Response({"error": "다른 관리자 계정은 삭제할 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

            cursor.execute("DELETE FROM users WHERE user_id = %s", [user_id])

        return Response({"message": "사용자 계정을 삭제했습니다."}, status=status.HTTP_200_OK)
