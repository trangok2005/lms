# 📚 Cơ Sở Dữ Liệu — Hệ Thống Quản Lý Học Liệu Số

> **Stack:** Django REST Framework · PostgreSQL · Cloudinary  
> **Đồ án môn:** Phát triển Ứng dụng · Nhóm ___
> **Tên thành viên:** Lê thanh nhẫn - Trần Văn Trạng
---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Quy ước chung](#2-quy-ước-chung)
3. [Sơ đồ quan hệ (ERD)](#3-sơ-đồ-quan-hệ-erd)
4. [Chi tiết từng app](#4-chi-tiết-từng-app)
   - [common](#41-common--basemodel)
   - [users](#42-users)
   - [courses](#43-courses)
   - [materials](#44-materials)
   - [quizzes](#45-quizzes)
   - [payments](#46-payments)
5. [Luồng nghiệp vụ chính](#5-luồng-nghiệp-vụ-chính)
6. [Cài đặt và migration](#6-cài-đặt-và-migration)

---

## 1. Tổng quan kiến trúc

Hệ thống chia thành **6 Django app**, mỗi app quản lý một nhóm nghiệp vụ độc lập:

```
backend/
├── apps/
│   ├── common/       # BaseModel dùng chung cho toàn bộ app
│   ├── users/        # Tài khoản người dùng & hồ sơ sinh viên
│   ├── courses/      # Khóa học, danh mục, tag, ghi danh, diễn đàn
│   ├── materials/    # Học liệu, tiến độ, bình luận, ghi chú
│   ├── quizzes/      # Bài kiểm tra trắc nghiệm & kết quả
│   └── payments/     # Giao dịch thanh toán
├── config/
│   └── settings.py
└── manage.py
```

**Tổng số bảng: 16**

| App | Số bảng | Bảng |
|---|---|---|
| common | — | *(abstract, không tạo bảng)* |
| users | 2 | User, StudentProfile |
| courses | 6 | Category, Tag, Course, Enrollment, ForumTopic, ForumReply |
| materials | 4 | Material, MaterialProgress, Comment, Note |
| quizzes | 4 | Quiz, Question, Answer, TestResult |
| payments | 1 | Transaction |

---

## 2. Quy ước chung

### BaseModel (`apps/common/models.py`)

**Tất cả** các model đều kế thừa `BaseModel`. Không bao giờ tạo model mà không kế thừa nó.

```python
class BaseModel(models.Model):
    is_active    = models.BooleanField(default=True)       # soft delete
    created_date = models.DateTimeField(auto_now_add=True) # tự gán lúc tạo
    updated_date = models.DateTimeField(auto_now=True)     # tự cập nhật
    class Meta:
        abstract = True
```

| Trường | Ý nghĩa | Ghi chú |
|---|---|---|
| `is_active` | Xóa mềm — `False` = ẩn khỏi hệ thống | Không xóa thật, chỉ ẩn |
| `created_date` | Thời điểm tạo bản ghi | Không chỉnh sửa được |
| `updated_date` | Thời điểm sửa gần nhất | Tự động cập nhật |

> **Quy tắc xóa dữ liệu:** Luôn dùng `obj.is_active = False; obj.save()` thay vì `obj.delete()`. Trong QuerySet luôn filter thêm `.filter(is_active=True)`.

### Quy ước đặt tên

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Model | PascalCase | `StudentProfile` |
| Field | snake_case | `progress_percent` |
| FK | tên model viết thường | `course`, `user` |
| related_name | tên số nhiều | `related_name='materials'` |
| Enum choices | dùng `TextChoices` | `Status.ACTIVE` |

---

## 3. Sơ đồ quan hệ (ERD)

```
┌──────────┐        ┌────────────────┐
│   User   │──1:1──▶│ StudentProfile │
│(AbstractU│        └────────────────┘
│  ser)    │
│          │──1:N──▶ Enrollment ──N:1──▶ Course ──N:1──▶ Category
│          │                │               │
│          │                └──N:1──▶ Transaction   └──M:N──▶ Tag
│          │
│          │──1:N──▶ ForumTopic ──N:1──▶ Course
│          │              └──1:N──▶ ForumReply
│          │
│          │──1:N──▶ MaterialProgress ──N:1──▶ Material ──N:1──▶ Course
│          │                                       │
│          │──1:N──▶ Comment ──────────────N:1────┘
│          │                                       │
│          │──1:N──▶ Note ──────────────────N:1───┘
│          │                                       └──M:N──▶ Tag
│          │
│          │──1:N──▶ TestResult ──N:1──▶ Quiz ──N:1──▶ Course
│          │                                └──1:N──▶ Question
│          │                                              └──1:N──▶ Answer
│          │──1:N──▶ Transaction
└──────────┘

Chú thích:
  1:1  = Một - Một          ──1:1──▶
  1:N  = Một - Nhiều        ──1:N──▶
  M:N  = Nhiều - Nhiều      ──M:N──▶  (Django tạo bảng trung gian tự động)
```

---

## 4. Chi tiết từng app

---

### 4.1 common — BaseModel

> Không có bảng DB. Chỉ là class abstract để tái dụng 3 trường chung.

---

### 4.2 users

#### Bảng `users_user` — Model `User`

Kế thừa `AbstractUser` của Django (đã có sẵn: `username`, `email`, `password`, `first_name`, `last_name`, `is_staff`, `is_active`...). Nhóm chỉ bổ sung thêm:

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `role` | CharField (enum) | `student` | Phân quyền: `admin` / `teacher` / `student` |
| `avatar` | CloudinaryField | null | Ảnh đại diện lưu trên Cloudinary |

**Enum Role:**
```
admin   → Quản trị viên hệ thống
teacher → Giảng viên (tạo khóa học, tải học liệu)
student → Sinh viên (mặc định khi đăng ký)
```

> **Lưu ý:** Không có `oauth_provider` trong phiên bản hiện tại. Nếu thêm đăng nhập Google sau này thì bổ sung trường này vào `User`.

---

#### Bảng `users_studentprofile` — Model `StudentProfile`

Thông tin học tập mở rộng của sinh viên. Tách riêng khỏi `User` để không làm phình bảng tài khoản.

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `user` | FK → User (1:1) | — | Liên kết tài khoản |
| `current_level` | CharField (enum) | `beginner` | Trình độ hiện tại |
| `learning_goals` | TextField | null | Mục tiêu học tập (sinh viên tự nhập) |
| `total_hours` | FloatField | 0 | Tổng giờ học tích lũy |
| `average_score` | FloatField | 0 | Điểm trung bình các bài kiểm tra |
| `is_active` | BooleanField | True | *(kế thừa BaseModel)* |
| `created_date` | DateTimeField | auto | *(kế thừa BaseModel)* |
| `updated_date` | DateTimeField | auto | *(kế thừa BaseModel)* |

**Enum Level:**
```
beginner     → Người mới bắt đầu
intermediate → Trung cấp
advanced     → Nâng cao
```

**Quan hệ:**
```
User ──1:1──▶ StudentProfile   (access: user.profile)
```

**Ví dụ query:**
```python
# Lấy profile của user đang đăng nhập
profile = request.user.profile

# Cập nhật giờ học
profile.total_hours += 0.5
profile.save(update_fields=['total_hours', 'updated_date'])
```

---

### 4.3 courses

#### Bảng `courses_category` — Model `Category`

Phân loại khóa học theo môn học / chủ đề.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `name` | CharField(100) | Tên danh mục (VD: "Lập trình Web") |
| `description` | TextField | Mô tả danh mục |

---

#### Bảng `courses_tag` — Model `Tag`

Nhãn tag dùng chung cho cả **Course** và **Material**, phục vụ tìm kiếm theo từ khóa.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `name` | CharField(50) UNIQUE | Tên tag (VD: "python", "react-native") |

---

#### Bảng `courses_course` — Model `Course`

Khóa học — đơn vị trung tâm của hệ thống.

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `subject` | CharField(255) | — | Tên khóa học |
| `description` | RichTextField | null | Mô tả chi tiết (hỗ trợ HTML) |
| `image` | CloudinaryField | null | Ảnh thumbnail khóa học |
| `price` | DecimalField(10,2) | 0 | Học phí (0 = miễn phí) |
| `level` | CharField (enum) | `beginner` | Cấp độ khó |
| `category` | FK → Category | null | Danh mục môn học |
| `teacher` | FK → User | — | Giảng viên phụ trách |
| `tags` | M2M → Tag | — | Danh sách tag |
| `students` | M2M → User (through Enrollment) | — | Sinh viên ghi danh |

**Enum Level:** `beginner` / `intermediate` / `advanced`

> **Quan trọng:** `students` là M2M **qua bảng trung gian `Enrollment`** — không thêm/xóa trực tiếp. Phải thao tác qua model `Enrollment`.

**Quan hệ:**
```
Course ──N:1──▶ Category
Course ──N:1──▶ User (teacher)
Course ──M:N──▶ Tag          (bảng trung gian: courses_course_tags)
Course ──M:N──▶ User         (bảng trung gian: courses_enrollment)
Course ──1:N──▶ Material
Course ──1:N──▶ Quiz
Course ──1:N──▶ ForumTopic
Course ──1:N──▶ Transaction
```

---

#### Bảng `courses_enrollment` — Model `Enrollment`

Bảng ghi danh — trung gian giữa `User` và `Course`. Theo dõi trạng thái và tiến độ học.

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `user` | FK → User | — | Sinh viên |
| `course` | FK → Course | — | Khóa học đăng ký |
| `status` | CharField (enum) | `active` | Trạng thái ghi danh |
| `progress_percent` | FloatField | 0 | % tổng tiến độ khóa học |
| `completed_at` | DateTimeField | null | Thời điểm hoàn thành |
| `last_accessed` | DateTimeField | null | Lần truy cập gần nhất |
| `transaction` | FK → Transaction | null | Giao dịch tương ứng (null nếu miễn phí) |

**Enum Status:**
```
active    → Đang học
completed → Đã hoàn thành toàn bộ khóa
dropped   → Đã bỏ học
```

**Ràng buộc:** `unique_together = ('user', 'course')` — mỗi sinh viên chỉ ghi danh 1 lần.

**Ví dụ query:**
```python
# Kiểm tra sinh viên đã đăng ký chưa
enrolled = Enrollment.objects.filter(
    user=request.user, course=course, is_active=True
).exists()

# Lấy tất cả khóa học đang học
my_courses = Enrollment.objects.filter(
    user=request.user, status='active', is_active=True
).select_related('course')
```

---

#### Bảng `courses_forumtopic` — Model `ForumTopic`

Chủ đề thảo luận trong một khóa học.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `user` | FK → User | Người tạo topic |
| `course` | FK → Course | Khóa học chứa topic |
| `title` | CharField(255) | Tiêu đề |
| `content` | TextField | Nội dung bài đăng |

---

#### Bảng `courses_forumreply` — Model `ForumReply`

Trả lời trong một topic diễn đàn.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `user` | FK → User | Người trả lời |
| `topic` | FK → ForumTopic | Topic thuộc về |
| `content` | TextField | Nội dung trả lời |

**Quan hệ:**
```
ForumTopic ──1:N──▶ ForumReply
           (access: topic.replies.all())
```

---

### 4.4 materials

#### Bảng `materials_material` — Model `Material`

Học liệu (video, PDF, slide) gắn với một khóa học.

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `title` | CharField(255) | — | Tên tài liệu |
| `content` | RichTextField | null | Mô tả / nội dung phụ (HTML) |
| `file` | CloudinaryField | null | File tài liệu lưu Cloudinary |
| `thumbnail` | CloudinaryField | null | Ảnh đại diện |
| `material_type` | CharField (enum) | — | Loại: video / pdf / slide |
| `difficulty` | CharField (enum) | `medium` | Độ khó |
| `duration_minutes` | IntegerField | 0 | Thời lượng (phút) — dùng cho video |
| `order_index` | IntegerField | 0 | Thứ tự hiển thị trong khóa học |
| `course` | FK → Course | — | Khóa học chứa tài liệu |
| `tags` | M2M → Tag | — | Tag để tìm kiếm |

**Enum MaterialType:** `video` / `pdf` / `slide`

**Enum Difficulty:** `easy` / `medium` / `hard`

> `order_index` quyết định thứ tự hiển thị. Model đã có `Meta.ordering = ['order_index']` nên query tự động sắp xếp.

**Ví dụ query:**
```python
# Lấy tất cả tài liệu của một khóa học, đúng thứ tự
materials = Material.objects.filter(
    course=course, is_active=True
)  # tự sắp xếp theo order_index nhờ Meta.ordering

# Tìm kiếm theo từ khóa (title hoặc tag)
results = Material.objects.filter(
    is_active=True
).filter(
    models.Q(title__icontains=keyword) |
    models.Q(tags__name__icontains=keyword)
).distinct()
```

---

#### Bảng `materials_materialprogress` — Model `MaterialProgress`

Theo dõi tiến độ học từng tài liệu của từng sinh viên.

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `user` | FK → User | — | Sinh viên |
| `material` | FK → Material | — | Tài liệu |
| `status` | CharField (enum) | `not_started` | Trạng thái học |
| `progress_percent` | FloatField | 0 | % đã xem (0–100) |
| `watched_minutes` | IntegerField | 0 | Số phút đã xem |
| `last_position_sec` | IntegerField | 0 | Vị trí dừng lại (giây) — dùng để resume video |
| `last_accessed` | DateTimeField | auto_now | Lần xem gần nhất |
| `completed_at` | DateTimeField | null | Thời điểm hoàn thành |

**Enum Status:** `not_started` / `in_progress` / `completed`

**Ràng buộc:** `unique_together = ('user', 'material')` — mỗi cặp user-material chỉ có 1 bản ghi progress.

**Ví dụ query:**
```python
# Lấy hoặc tạo mới progress khi sinh viên bắt đầu xem
progress, created = MaterialProgress.objects.get_or_create(
    user=request.user,
    material=material,
    defaults={'status': 'in_progress'}
)

# Cập nhật vị trí xem
progress.last_position_sec = 245  # giây
progress.watched_minutes = 4
progress.save(update_fields=['last_position_sec', 'watched_minutes', 'updated_date'])
```

---

#### Bảng `materials_comment` — Model `Comment`

Bình luận / câu hỏi của sinh viên trực tiếp trên một tài liệu.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `user` | FK → User | Người bình luận |
| `material` | FK → Material | Tài liệu được bình luận |
| `content` | TextField | Nội dung |

> **Lưu ý thiết kế:** Comment hiện tại là phẳng (không có reply lồng nhau). Nếu sau này cần reply thì thêm `parent = FK('self', null=True)`.

---

#### Bảng `materials_note` — Model `Note`

Ghi chú cá nhân của sinh viên trên tài liệu. **Chỉ chủ sở hữu thấy** — được enforce ở tầng API (không phải tầng DB).

| Trường | Kiểu | Mô tả |
|---|---|---|
| `user` | FK → User | Chủ ghi chú |
| `material` | FK → Material | Tài liệu liên quan |
| `content` | TextField | Nội dung ghi chú |
| `timestamp_sec` | IntegerField | Mốc thời gian trong video (giây). Null nếu là PDF/Slide |

**Cách enforce chỉ user thấy note của mình (ViewSet):**
```python
class NoteViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # Chỉ trả về note của chính user — không cần thêm field DB
        return Note.objects.filter(user=self.request.user, is_active=True)
```

---

### 4.5 quizzes

Hệ thống bài kiểm tra **trắc nghiệm** (single choice và multiple choice). Không hỗ trợ tự luận.

#### Bảng `quizzes_quiz` — Model `Quiz`

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `title` | CharField(255) | — | Tên bài kiểm tra |
| `course` | FK → Course | — | Thuộc khóa học nào |
| `time_limit` | IntegerField | null | Giới hạn thời gian (phút). Null = không giới hạn |
| `passing_score` | FloatField | 50.0 | % điểm tối thiểu để đạt |

---

#### Bảng `quizzes_question` — Model `Question`

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `quiz` | FK → Quiz | — | Thuộc bài kiểm tra |
| `content` | TextField | — | Nội dung câu hỏi |
| `points` | FloatField | 1.0 | Điểm của câu này |

> **Lưu ý:** Phiên bản hiện tại chỉ có trắc nghiệm nên không cần `question_type`. Nếu muốn phân biệt single/multiple thì thêm vào sau.

---

#### Bảng `quizzes_answer` — Model `Answer`

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `question` | FK → Question | — | Câu hỏi chứa đáp án |
| `content` | CharField(255) | — | Nội dung đáp án |
| `is_correct` | BooleanField | False | Đây có phải đáp án đúng không |

> Mỗi `Question` có nhiều `Answer`. Đáp án đúng là những Answer có `is_correct=True`.

---

#### Bảng `quizzes_testresult` — Model `TestResult`

Lưu kết quả **một lần làm bài** của sinh viên.

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `user` | FK → User | — | Sinh viên làm bài |
| `quiz` | FK → Quiz | — | Bài kiểm tra |
| `score` | FloatField | — | Điểm thực tế đạt được |
| `percentage` | FloatField | — | % = score / tổng điểm × 100 |
| `is_passed` | BooleanField | False | Có đạt ngưỡng `passing_score` không |
| `submitted_answers` | JSONField | null | Lưu đáp án đã chọn (thay cho bảng StudentAnswer) |
| `strength_analysis` | TextField | null | AI phân tích điểm mạnh (để sau) |
| `weakness_analysis` | TextField | null | AI phân tích điểm yếu (để sau) |

**Cấu trúc `submitted_answers` (JSON):**
```json
[
  {
    "question_id": 1,
    "selected_answer_ids": [3],
    "is_correct": true,
    "points_earned": 1.0
  },
  {
    "question_id": 2,
    "selected_answer_ids": [5, 7],
    "is_correct": false,
    "points_earned": 0.0
  }
]
```

> **Lý do dùng JSONField thay bảng StudentAnswer:** Đơn giản hơn cho đồ án, không cần join thêm bảng khi đọc kết quả. Đánh đổi: không query được theo từng câu hỏi, nhưng đủ để hiển thị kết quả và gọi AI phân tích.

**Logic chấm điểm:**
```python
# apps/quizzes/services.py
def auto_grade(quiz_id: int, submitted: list[dict]) -> dict:
    """
    submitted = [{"question_id": 1, "selected_answer_ids": [3]}, ...]
    Trả về {"score": 8.0, "max_score": 10.0, "percentage": 80.0, "is_passed": True, "detail": [...]}
    """
    questions   = Question.objects.filter(quiz_id=quiz_id).prefetch_related('answers')
    q_map       = {q.id: q for q in questions}
    max_score   = sum(q.points for q in questions)
    total_score = 0
    detail      = []

    for item in submitted:
        q           = q_map.get(item['question_id'])
        if not q:
            continue
        correct_ids  = set(q.answers.filter(is_correct=True).values_list('id', flat=True))
        selected_ids = set(item.get('selected_answer_ids', []))
        is_correct   = selected_ids == correct_ids
        earned       = q.points if is_correct else 0
        total_score += earned
        detail.append({
            'question_id':         q.id,
            'selected_answer_ids': list(selected_ids),
            'is_correct':          is_correct,
            'points_earned':       earned,
        })

    percentage = (total_score / max_score * 100) if max_score > 0 else 0
    return {
        'score':      total_score,
        'max_score':  max_score,
        'percentage': round(percentage, 2),
        'is_passed':  percentage >= Quiz.objects.get(id=quiz_id).passing_score,
        'detail':     detail,
    }
```

---

### 4.6 payments

#### Bảng `payments_transaction` — Model `Transaction`

Mỗi lần mua khóa học tạo ra một `Transaction`.

| Trường | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `user` | FK → User | — | Người mua |
| `course` | FK → Course | — | Khóa học mua |
| `amount` | DecimalField(10,2) | — | Số tiền (VNĐ) |
| `payment_method` | CharField (enum) | `free` | Phương thức thanh toán |
| `status` | CharField (enum) | `pending` | Trạng thái giao dịch |
| `transaction_code` | CharField(100) UNIQUE | — | Mã đơn hàng (VD: `ORDER_20240115_001`) |
| `gateway_response` | JSONField | null | Response thô từ VNPay/MoMo — dùng khi debug |

**Enum PaymentMethod:** `vnpay` / `momo` / `free`

**Enum Status:** `pending` → `success` hoặc `failed`

**Luồng thanh toán:**
```
1. Tạo Transaction (status=pending, transaction_code='ORDER_xxx')
2. Redirect sang VNPay/MoMo
3. Nhận callback → cập nhật status + lưu gateway_response
4. Nếu success → tạo Enrollment(transaction=transaction)
```

**Ví dụ gateway_response (VNPay):**
```json
{
  "vnp_ResponseCode": "00",
  "vnp_TransactionNo": "13480716",
  "vnp_BankCode": "NCB",
  "vnp_PayDate": "20240115153000",
  "vnp_Amount": "50000000"
}
```

---

## 5. Luồng nghiệp vụ chính

### 5.1 Đăng ký và ghi danh khóa học

```
POST /api/auth/register/
  → Tạo User (role=student)
  → Signal tự động tạo StudentProfile

GET  /api/courses/{id}/
  → Kiểm tra course.price
  → Nếu price = 0: POST /api/courses/{id}/enroll/ → tạo Enrollment trực tiếp
  → Nếu price > 0: POST /api/payments/       → tạo Transaction → redirect cổng TT
                                              → Callback → Enrollment
```

### 5.2 Học tài liệu và cập nhật tiến độ

```
GET  /api/materials/{id}/
  → Kiểm tra Enrollment tồn tại (hoặc material.is_preview=True)
  → Trả về nội dung tài liệu

PATCH /api/materials/{id}/progress/
  → Cập nhật MaterialProgress (progress_percent, last_position_sec)
  → Nếu progress_percent >= 100: MaterialProgress.status = 'completed'
  → Tính lại Enrollment.progress_percent = avg(tất cả MaterialProgress của course)
  → Nếu tất cả material completed: Enrollment.status = 'completed'
```

### 5.3 Làm bài kiểm tra và chấm điểm

```
GET  /api/quizzes/{id}/          → Lấy đề (questions + answers, không có is_correct)
POST /api/quizzes/{id}/submit/   → Gửi bài
  → Gọi auto_grade(quiz_id, submitted_answers)
  → Tạo TestResult(score, percentage, is_passed, submitted_answers=detail)
  → Cập nhật StudentProfile.average_score
  → (Sau này) Gọi Gemini phân tích strength/weakness
```

---

## 6. Cài đặt và migration

### Yêu cầu

```bash
pip install django djangorestframework django-cloudinary-storage \
            django-ckeditor psycopg2-binary djangorestframework-simplejwt \
            django-cors-headers django-filter
```

### Tạo migration và chạy

```bash
# Tạo migration cho từng app (thứ tự quan trọng vì có FK chéo)
python manage.py makemigrations common
python manage.py makemigrations users
python manage.py makemigrations payments   # phải trước courses vì Enrollment FK tới Transaction
python manage.py makemigrations courses
python manage.py makemigrations materials
python manage.py makemigrations quizzes

# Chạy tất cả
python manage.py migrate

# Tạo superuser
python manage.py createsuperuser
```

> **Quan trọng:** `payments` phải `makemigrations` trước `courses` vì `Enrollment` có FK tới `Transaction`. Nếu chạy sai thứ tự Django sẽ báo lỗi circular dependency.

### Signal tự động tạo StudentProfile

Thêm vào `apps/users/apps.py`:

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_student_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'student':
        StudentProfile.objects.create(user=instance)
```

---

*README này mô tả toàn bộ CSDL tại thời điểm hiện tại. Cập nhật khi có thay đổi schema.*
