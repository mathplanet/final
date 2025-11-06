from django.db import models

# ✅ 기존 DB의 user 테이블과 매핑
class User(models.Model):
    user_id = models.CharField(max_length=50, primary_key=True)
    password = models.CharField(max_length=255)
    name = models.CharField(max_length=50)
    user_permission_code = models.CharField(max_length=50, default="DESIGNER")
    create_day = models.DateTimeField(auto_now_add=True)
    update_day = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False  # ✅ DB 테이블 새로 안 만듦
        db_table = "users"  # ✅ 실제 팀 DB의 테이블 이름 그대로

    def __str__(self):
        return self.user_id


# ✅ project 테이블 매핑
class Project(models.Model):
    STATUS_CHOICES = [
        ('progress', '진행 중'),
        ('completed', '완료'),
        ('pending', '대기'),
    ]

    project_id = models.CharField(max_length=20, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='projects')
    project_name = models.CharField(max_length=200)
    description = models.CharField(max_length=1000, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='progress')
    project_image = models.TextField(blank=True, null=True)
    create_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project'
        managed = False

    def __str__(self):
        return self.project_name


# ✅ customize_req 테이블 매핑
class CustomizeReq(models.Model):
    req_id = models.AutoField(primary_key=True, db_column='req_id')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, db_column='project_id', related_name='custom_requests')

    residence_type = models.CharField(max_length=100, blank=True, null=True)
    space_type = models.CharField(max_length=100, blank=True, null=True)
    budget_range = models.CharField(max_length=100, blank=True, null=True)
    family_type = models.CharField(max_length=100, blank=True, null=True)
    design_style = models.CharField(max_length=100, blank=True, null=True)
    attachment_path = models.CharField(max_length=500, blank=True, null=True)


    class Meta:
        db_table = 'customize_req'
        managed = False

    def __str__(self):
        return f"요청({self.residence_type}, {self.design_style})"


class PendingUser(models.Model):
    STATUS_CHOICES = (
        ("pending", "대기"),
        ("approved", "승인"),
        ("rejected", "거절"),
    )

    id = models.AutoField(primary_key=True)
    user_id = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)
    name = models.CharField(max_length=50, default="디자이너")
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(max_length=50, default="DESIGNER")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    registered_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    approved_by = models.CharField(max_length=50, blank=True, null=True)
    rejected_reason = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "pending_users"
        managed = False

    def __str__(self):
        return f"{self.user_id} ({self.status})"


class AiMakeImage(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        db_column="project_id",
        related_name="ai_images",
    )
    req = models.ForeignKey(
        CustomizeReq,
        on_delete=models.CASCADE,
        db_column="req_id",
        related_name="ai_images",
        blank=True,
        null=True,
    )
    image_id = models.IntegerField(primary_key=True, db_column="image_id")
    ai_image_path = models.TextField(blank=True, null=True)
    is_selected = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        db_table = "ai_make_image"
        managed = False

    def __str__(self):
        return f"AI 이미지 {self.image_id}"

