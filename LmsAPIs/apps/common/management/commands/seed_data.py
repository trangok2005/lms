import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

# ─── Import models ───────────────────────────────────────────────
from apps.users.models import User, StudentProfile
from apps.courses.models import Category, Tag, Course, Enrollment, ForumTopic, ForumReply
from apps.materials.models import Material, MaterialProgress, Comment, Note
from apps.payments.models import Transaction
from apps.quizzes.models import Quiz, Question, Answer, TestResult

# ─── Dữ liệu tiếng Việt ──────────────────────────────────────────

CATEGORIES = [
    ("Lập trình Web", "Các khoá học thiết kế và phát triển website từ cơ bản đến nâng cao."),
    ("Khoa học dữ liệu", "Phân tích dữ liệu, machine learning và trí tuệ nhân tạo ứng dụng."),
    ("Thiết kế đồ hoạ", "UI/UX, Figma, Photoshop và các công cụ thiết kế chuyên nghiệp."),
]

TAGS = [
    "Python", "Django", "React Native", "JavaScript", "HTML/CSS",
]

# 5 khoá miễn phí, 5 khoá có phí
COURSES = [
    # (subject, category_idx, level, price, description)
    ("Python Cơ Bản cho Người Mới Bắt Đầu", 0, "beginner", 0,
     "Khoá học Python từ số không, phù hợp cho mọi đối tượng muốn học lập trình."),
    ("HTML & CSS Nhập Môn", 0, "beginner", 0, "Xây dựng trang web tĩnh đẹp mắt với HTML5 và CSS3 hiện đại."),
    ("Git & GitHub Cơ Bản", 0, "beginner", 0, "Quản lý mã nguồn chuyên nghiệp với Git và làm việc nhóm qua GitHub."),
    ("Nhập Môn Khoa Học Dữ Liệu", 1, "beginner", 0,
     "Giới thiệu tổng quan về Data Science, thống kê và phân tích dữ liệu cơ bản."),
    ("Thiết Kế UI/UX Cơ Bản với Figma", 2, "beginner", 0,
     "Học cách tạo wireframe, prototype và thiết kế giao diện người dùng trực quan."),
    ("Django REST Framework Nâng Cao", 0, "advanced", 499000,
     "Xây dựng API RESTful mạnh mẽ, xác thực JWT và triển khai với Docker."),
    ("Machine Learning với Scikit-Learn", 1, "intermediate", 699000,
     "Thuật toán ML thực tiễn: hồi quy, phân loại, clustering và đánh giá mô hình."),
    ("React Native – Xây Dựng App Di Động", 0, "intermediate", 799000,
     "Phát triển ứng dụng iOS & Android bằng React Native và Expo từ A–Z."),
    ("Deep Learning & TensorFlow", 1, "advanced", 999000,
     "Mạng nơ-ron sâu, CNN, RNN và ứng dụng xử lý ảnh, văn bản với TensorFlow 2."),
    ("UI/UX Design Nâng Cao – Portfolio Pro", 2, "advanced", 599000,
     "Thiết kế portfolio chuyên nghiệp, nghiên cứu người dùng và kiểm tra khả năng dùng."),
]

# Mỗi khoá có danh sách riêng (title, type, difficulty, duration_minutes)
# Index tương ứng với COURSES bên trên
MATERIALS_PER_COURSE = [
    # 0 – Python Cơ Bản (4 bài)
    [
        ("Giới thiệu Python & cài đặt Anaconda", "video", "easy", 18),
        ("Kiểu dữ liệu, biến và toán tử cơ bản", "video", "easy", 22),
        ("Tài liệu tham khảo – Cú pháp Python cơ bản", "pdf", "easy", 10),
        ("Bài tập thực hành: vòng lặp & hàm", "pdf", "medium", 12),
    ],
    # 1 – HTML & CSS (5 bài)
    [
        ("HTML5 – Cấu trúc trang web chuẩn", "video", "easy", 20),
        ("CSS3 – Box model & Flexbox", "video", "medium", 25),
        ("Slide tổng hợp: Selectors & Specificity", "slide", "easy", 10),
        ("Thực hành: Dựng layout trang chủ", "pdf", "medium", 15),
        ("Responsive Design với Media Queries", "video", "medium", 22),
    ],
    # 2 – Git & GitHub (3 bài)
    [
        ("Git cơ bản – init, add, commit, log", "video", "easy", 20),
        ("Làm việc với nhánh – branch, merge, rebase", "video", "medium", 28),
        ("Cheat sheet lệnh Git thường dùng", "pdf", "easy", 8),
    ],
    # 3 – Khoa Học Dữ Liệu (5 bài)
    [
        ("Giới thiệu Data Science & hệ sinh thái Python", "video", "easy", 20),
        ("Phân tích dữ liệu với Pandas", "video", "medium", 30),
        ("Slide: Thống kê mô tả cơ bản", "slide", "easy", 12),
        ("Trực quan hoá dữ liệu với Matplotlib", "video", "medium", 25),
        ("Bài tập: Làm sạch dataset thực tế", "pdf", "hard", 15),
    ],
    # 4 – UI/UX Figma cơ bản (4 bài)
    [
        ("Giới thiệu Figma & giao diện làm việc", "video", "easy", 15),
        ("Tạo Wireframe cho ứng dụng di động", "video", "medium", 25),
        ("Slide: Nguyên tắc thiết kế UI hiệu quả", "slide", "medium", 10),
        ("Thực hành: Prototype màn hình Login", "pdf", "medium", 18),
    ],
    # 5 – Django REST Framework (5 bài)
    [
        ("Ôn nhanh Django ORM & serializer", "video", "medium", 25),
        ("Xây dựng API CRUD chuẩn RESTful", "video", "hard", 35),
        ("JWT Authentication – AccessToken & Refresh", "video", "hard", 30),
        ("Tài liệu: Cấu hình CORS & Permissions", "pdf", "medium", 12),
        ("Deploy API lên VPS với Docker & Nginx", "slide", "hard", 20),
    ],
    # 6 – Machine Learning (5 bài)
    [
        ("Tổng quan Machine Learning & workflow", "video", "easy", 20),
        ("Hồi quy tuyến tính & logistic", "video", "medium", 30),
        ("Slide: Các thuật toán phân loại phổ biến", "slide", "medium", 15),
        ("Đánh giá mô hình: Precision, Recall, F1", "video", "hard", 25),
        ("Bài tập: Pipeline dự đoán giá nhà", "pdf", "hard", 20),
    ],
    # 7 – React Native (4 bài)
    [
        ("Cài đặt Expo & cấu trúc dự án React Native", "video", "easy", 18),
        ("Navigation với React Navigation v6", "video", "medium", 28),
        ("State Management: Context API vs Redux", "video", "hard", 32),
        ("Cheat sheet: Các component RN hay dùng", "pdf", "medium", 10),
    ],
    # 8 – Deep Learning (5 bài)
    [
        ("Mạng nơ-ron nhân tạo – kiến trúc & huấn luyện", "video", "medium", 30),
        ("CNN – Nhận diện hình ảnh với TensorFlow", "video", "hard", 40),
        ("RNN & LSTM – Xử lý chuỗi thời gian", "video", "hard", 38),
        ("Slide: Các kỹ thuật tối ưu hoá (Adam, SGD...)", "slide", "hard", 15),
        ("Thực hành: Xây dựng chatbot đơn giản với LSTM", "pdf", "hard", 20),
    ],
    # 9 – UI/UX Nâng Cao (3 bài)
    [
        ("Nghiên cứu người dùng & phỏng vấn UX", "video", "medium", 25),
        ("Design System & Component Library", "video", "hard", 30),
        ("Slide: Portfolio chuẩn để apply vị trí Designer", "slide", "medium", 12),
    ],
]

QUIZ_DATA = [
    # (question_content, correct_answer, wrong_answers)
    (
        "Ngôn ngữ lập trình nào được dùng phổ biến nhất trong Data Science?",
        "Python",
        ["Java", "C++", "PHP"]
    ),
    (
        "HTTP method nào dùng để tạo tài nguyên mới trong REST API?",
        "POST",
        ["GET", "DELETE", "PUT"]
    ),
    (
        "Hàm nào trong Python dùng để in ra màn hình?",
        "print()",
        ["echo()", "console.log()", "write()"]
    ),
    (
        "Git command nào dùng để lưu thay đổi vào local repository?",
        "git commit",
        ["git push", "git pull", "git clone"]
    ),
    (
        "CSS property nào dùng để thay đổi màu chữ?",
        "color",
        ["font-color", "text-color", "foreground"]
    ),
]

FORUM_TOPICS = [
    ("Làm sao cài đặt môi trường ảo Python trên Windows?",
     "Mình đang dùng Windows 11 và gặp lỗi khi chạy lệnh python -m venv. Các bạn có thể hướng dẫn mình không?"),
    ("Chia sẻ tài nguyên học Django REST Framework miễn phí",
     "Mình tổng hợp một số link hữu ích cho anh em: docs chính thức, kênh YouTube và repo mẫu trên GitHub."),
    ("Sự khác biệt giữa supervised và unsupervised learning?",
     "Thầy có thể giải thích rõ hơn về sự khác nhau giữa hai loại này không? Mình đọc tài liệu vẫn chưa hiểu rõ."),
    ("Tips thiết kế UI đẹp cho người mới học Figma",
     "Sau một thời gian học, mình đúc kết vài mẹo nhỏ giúp bản thiết kế trông chuyên nghiệp hơn."),
    ("Lỗi CORS khi gọi API từ React Native – cách fix?",
     "Mình bị lỗi CORS khi fetch API từ app React Native. Backend dùng Django. Đã thử nhiều cách nhưng vẫn chưa được."),
]

FORUM_REPLIES = [
    "Bạn thử dùng `python3 -m venv venv` xem có được không nhé!",
    "Cảm ơn bạn đã chia sẻ, mình sẽ thử ngay!",
    "Thầy giảng rất dễ hiểu, mình đã nắm được rồi ạ.",
    "Mình cũng gặp lỗi tương tự, thêm `django-cors-headers` vào INSTALLED_APPS là xong nhé.",
    "Tài liệu này rất hữu ích, bookmark lại để đọc sau!",
    "Bạn có thể mở rộng thêm về phần authentication không?",
    "Mình thử theo hướng dẫn được rồi, cảm ơn nhiều!",
]

STUDENT_NAMES = [
    ("Nguyễn", "Văn An"), ("Trần", "Thị Bình"), ("Lê", "Hoàng Nam"),
    ("Phạm", "Thị Lan"), ("Hoàng", "Minh Tuấn"), ("Đặng", "Thị Hoa"),
    ("Vũ", "Quốc Dũng"), ("Bùi", "Thị Mai"), ("Đỗ", "Văn Hùng"),
    ("Ngô", "Thị Thảo"), ("Lý", "Thanh Long"), ("Dương", "Thị Ngọc"),
    ("Đinh", "Văn Phúc"), ("Hà", "Thị Thu"), ("Tô", "Minh Khoa"),
    ("Cao", "Thị Yến"), ("Trịnh", "Văn Đức"), ("Phan", "Thị Linh"),
    ("Võ", "Văn Sơn"), ("Nguyễn", "Thị Hằng"),
]

TEACHER_NAMES = [
    ("Nguyễn", "Đức Thịnh"),
    ("Trần", "Thị Phương"),
    ("Lê", "Văn Hải"),
    ("Phạm", "Thị Hương"),
    ("Hoàng", "Văn Long"),
]

LEARNING_GOALS = [
    "Trở thành lập trình viên full-stack trong vòng 1 năm.",
    "Tìm kiếm công việc Data Analyst sau khi tốt nghiệp.",
    "Xây dựng ứng dụng di động riêng để kinh doanh.",
    "Nâng cao kỹ năng thiết kế UI/UX để chuyển ngành.",
    "Học thêm AI để ứng dụng vào nghiên cứu khoa học.",
    "Freelance web development sau 6 tháng học.",
    "Cải thiện kỹ năng lập trình để thăng tiến trong công việc hiện tại.",
]

COMMENTS = [
    "Bài giảng rất dễ hiểu, cảm ơn thầy/cô!",
    "Phần này mình chưa hiểu lắm, thầy có thể giải thích thêm không ạ?",
    "Ví dụ thực tế rất hay, áp dụng được ngay vào dự án!",
    "Video chất lượng cao, âm thanh rõ ràng. Học rất dễ theo.",
    "Mình đã làm xong bài tập trong slide này rồi, thật sự hiệu quả.",
    "Tài liệu này bổ trợ rất tốt cho phần lý thuyết hôm trước.",
]

NOTES = [
    "Nhớ xem lại phần này trước khi thi.",
    "Công thức quan trọng – ghi vào sổ tay.",
    "Ví dụ hay, áp dụng vào dự án cuối kỳ.",
    "Cần thực hành thêm phần này.",
    "Đây là điểm mấu chốt của bài học!",
]


# ─── Command ─────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Tạo dữ liệu mẫu tiếng Việt đầy đủ cho hệ thống Quản lý Học liệu Số"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        now = timezone.now()

        self.stdout.write(self.style.WARNING("🔄 Bắt đầu tạo dữ liệu mẫu..."))

        # ── 1. ADMIN ──────────────────────────────────────────────
        self.stdout.write("👤 Tạo tài khoản Admin...")
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@hoclieu.vn",
                "role": "admin",
                "first_name": "Quản trị",
                "last_name": "Viên",
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if created:
            admin.set_password("Admin@123")
            admin.save()
        self.stdout.write(self.style.SUCCESS(f"  ✅ Admin: admin / Admin@123"))

        # ── 2. TEACHERS ───────────────────────────────────────────
        self.stdout.write("👩‍🏫 Tạo 5 giảng viên...")
        teachers = []
        for i, (last, first) in enumerate(TEACHER_NAMES):
            teacher, created = User.objects.get_or_create(
                username=f"teacher{i + 1:02d}",
                defaults={
                    "email": f"teacher{i + 1:02d}@hoclieu.vn",
                    "role": "teacher",
                    "first_name": first,
                    "last_name": last,
                }
            )
            if created:
                teacher.set_password("Teacher@123")
                teacher.save()
            teachers.append(teacher)
        self.stdout.write(self.style.SUCCESS(f"  ✅ teacher01–teacher05 / Teacher@123"))

        # ── 3. STUDENTS ───────────────────────────────────────────
        self.stdout.write("🎓 Tạo 20 sinh viên...")
        students = []
        for i, (last, first) in enumerate(STUDENT_NAMES):
            user, created = User.objects.get_or_create(
                username=f"student{i + 1:02d}",
                defaults={
                    "email": f"student{i + 1:02d}@gmail.com",
                    "role": "student",
                    "first_name": first,
                    "last_name": last,
                }
            )
            if created:
                user.set_password("Student@123")
                user.save()

            # StudentProfile
            profile, _ = StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    "current_level": random.choice(["beginner", "intermediate", "advanced"]),
                    "learning_goals": random.choice(LEARNING_GOALS),
                    "total_hours": round(random.uniform(10, 200), 1),
                    "average_score": round(random.uniform(50, 100), 1),
                }
            )
            students.append(user)
        self.stdout.write(self.style.SUCCESS(f"  ✅ student01–student20 / Student@123"))

        # ── 4. CATEGORIES ─────────────────────────────────────────
        self.stdout.write("📂 Tạo 3 danh mục...")
        category_objs = []
        for name, desc in CATEGORIES:
            cat, _ = Category.objects.get_or_create(name=name, defaults={"description": desc})
            category_objs.append(cat)

        # ── 5. TAGS ───────────────────────────────────────────────
        self.stdout.write("🏷️ Tạo 5 thẻ tag...")
        tag_objs = []
        for tname in TAGS:
            tag, _ = Tag.objects.get_or_create(name=tname)
            tag_objs.append(tag)

        # ── 6. COURSES ────────────────────────────────────────────
        self.stdout.write("📚 Tạo 10 khoá học (5 miễn phí, 5 có phí)...")
        all_courses = []

        for idx, (subject, cat_idx, level, price, desc) in enumerate(COURSES):
            teacher = teachers[idx % len(teachers)]
            course, _ = Course.objects.get_or_create(
                subject=subject,
                defaults={
                    "description": f"<p>{desc}</p>",
                    "price": price,
                    "level": level,
                    "category": category_objs[cat_idx],
                    "teacher": teacher,
                }
            )
            course.tags.set(random.sample(tag_objs, random.randint(2, min(3, len(tag_objs)))))
            all_courses.append(course)

        free_courses = [c for c in all_courses if c.price == 0]
        paid_courses = [c for c in all_courses if c.price > 0]
        self.stdout.write(self.style.SUCCESS(
            f"  ✅ {len(free_courses)} khoá miễn phí | {len(paid_courses)} khoá có phí"
        ))

        # ── 7. MATERIALS ──────────────────────────────────────────
        self.stdout.write("📄 Tạo học liệu cho mỗi khoá...")
        course_materials = {}
        for idx, course in enumerate(all_courses):
            mats = []
            mat_list = MATERIALS_PER_COURSE[idx]
            for j, (title, mtype, diff, dur) in enumerate(mat_list):
                mat, _ = Material.objects.get_or_create(
                    title=title,
                    course=course,
                    defaults={
                        "content": f"<p>Nội dung bài <strong>{j + 1}</strong> – khoá <em>{course.subject}</em>.</p>",
                        "material_type": mtype,
                        "difficulty": diff,
                        "duration_minutes": dur,
                        "order_index": j,
                    }
                )
                mats.append(mat)
            course_materials[course.id] = mats

        # ── 8. QUIZ, QUESTIONS, ANSWERS ───────────────────────────
        self.stdout.write("📝 Tạo bài kiểm tra (5 câu/bài) cho mỗi khoá...")
        course_quizzes = {}
        for course in all_courses:
            quiz, _ = Quiz.objects.get_or_create(
                title=f"Kiểm tra cuối khoá – {course.subject}",
                course=course,
                defaults={
                    "time_limit": random.choice([20, 30, 45]),
                    "passing_score": 60.0,
                }
            )
            questions = []
            for q_content, correct_ans, wrong_ans in QUIZ_DATA:
                q, _ = Question.objects.get_or_create(
                    quiz=quiz,
                    content=q_content,
                    defaults={"points": 2.0}
                )
                Answer.objects.get_or_create(question=q, content=correct_ans, defaults={"is_correct": True})
                for wa in wrong_ans:
                    Answer.objects.get_or_create(question=q, content=wa, defaults={"is_correct": False})
                questions.append(q)
            course_quizzes[course.id] = (quiz, questions)

        # ── 9. ENROLLMENTS + TRANSACTIONS + PROGRESS ──────────────
        self.stdout.write("📋 Đăng ký khoá học, thanh toán, tiến độ học tập...")

        for student in students:
            # Mỗi sinh viên đăng ký 4-7 khoá ngẫu nhiên
            num_enroll = random.randint(4, 7)
            chosen = random.sample(all_courses, min(num_enroll, len(all_courses)))

            for course in chosen:
                # ── Transaction ───────────────────────────────────
                txn = None
                if course.price > 0:
                    txn_code = f"TXN{student.id:03d}{course.id:03d}{random.randint(1000, 9999)}"
                    txn, _ = Transaction.objects.get_or_create(
                        transaction_code=txn_code,
                        defaults={
                            "user": student,
                            "course": course,
                            "amount": course.price,
                            "payment_method": random.choice(["vnpay", "momo"]),
                            "status": random.choice(["success", "success", "success", "failed"]),
                            "gateway_response": {
                                "code": "00",
                                "message": "Giao dịch thành công",
                                "bank": random.choice(["Vietcombank", "BIDV", "Techcombank"]),
                                "paid_at": (now - timedelta(days=random.randint(1, 60))).isoformat(),
                            }
                        }
                    )
                    # Nếu giao dịch thất bại thì không enroll
                    if txn.status == "failed":
                        continue
                else:
                    # Khoá miễn phí – tạo transaction FREE
                    txn_code = f"FREE{student.id:03d}{course.id:03d}"
                    txn, _ = Transaction.objects.get_or_create(
                        transaction_code=txn_code,
                        defaults={
                            "user": student,
                            "course": course,
                            "amount": 0,
                            "payment_method": "free",
                            "status": "success",
                        }
                    )

                # ── Enrollment ────────────────────────────────────
                progress = round(random.uniform(0, 100), 1)
                status = "completed" if progress == 100 else random.choice(["active", "active", "dropped"])
                enroll, _ = Enrollment.objects.get_or_create(
                    user=student,
                    course=course,
                    defaults={
                        "status": status,
                        "progress_percent": progress,
                        "transaction": txn,
                        "last_accessed": now - timedelta(days=random.randint(0, 30)),
                        "completed_at": now - timedelta(days=random.randint(1, 10)) if status == "completed" else None,
                    }
                )

                # ── MaterialProgress ──────────────────────────────
                mats = course_materials.get(course.id, [])
                num_viewed = int(len(mats) * progress / 100)
                for k, mat in enumerate(mats):
                    if k < num_viewed:
                        mp_status = "completed"
                        mp_progress = 100.0
                        watched = mat.duration_minutes
                    elif k == num_viewed:
                        mp_status = "in_progress"
                        mp_progress = round(random.uniform(20, 80), 1)
                        watched = int(mat.duration_minutes * mp_progress / 100)
                    else:
                        mp_status = "not_started"
                        mp_progress = 0.0
                        watched = 0

                    MaterialProgress.objects.get_or_create(
                        user=student,
                        material=mat,
                        defaults={
                            "status": mp_status,
                            "progress_percent": mp_progress,
                            "watched_minutes": watched,
                            "last_position_sec": watched * 60,
                            "completed_at": now - timedelta(
                                days=random.randint(1, 20)) if mp_status == "completed" else None,
                        }
                    )

                    # Comment & Note ngẫu nhiên
                    if mp_status == "completed" and random.random() < 0.4:
                        Comment.objects.get_or_create(
                            user=student,
                            material=mat,
                            defaults={"content": random.choice(COMMENTS)}
                        )
                    if mat.material_type == "video" and random.random() < 0.3:
                        Note.objects.get_or_create(
                            user=student,
                            material=mat,
                            defaults={
                                "content": random.choice(NOTES),
                                "timestamp_sec": random.randint(30, mat.duration_minutes * 60),
                            }
                        )

                # ── TestResult ────────────────────────────────────
                if progress >= 50 and course.id in course_quizzes:
                    quiz, questions = course_quizzes[course.id]
                    total_points = sum(q.points for q in questions)
                    earned = 0
                    submitted = {}
                    for q in questions:
                        answers = list(q.answers.all())
                        chosen_ans = random.choice(answers)
                        if chosen_ans.is_correct:
                            earned += q.points
                        submitted[str(q.id)] = {
                            "question": q.content,
                            "chosen": chosen_ans.content,
                            "is_correct": chosen_ans.is_correct,
                        }

                    pct = round(earned / total_points * 100, 1) if total_points else 0
                    TestResult.objects.get_or_create(
                        user=student,
                        quiz=quiz,
                        defaults={
                            "score": earned,
                            "percentage": pct,
                            "is_passed": pct >= quiz.passing_score,
                            "submitted_answers": submitted,
                            "strength_analysis": "Nắm tốt kiến thức nền tảng và khái niệm cơ bản." if pct >= 70 else "Cần ôn lại các khái niệm cơ bản.",
                            "weakness_analysis": "Cần rèn luyện thêm phần thực hành và bài tập ứng dụng." if pct < 80 else "Tiếp tục duy trì và mở rộng kiến thức.",
                        }
                    )

        # ── 10. FORUM ─────────────────────────────────────────────
        self.stdout.write("💬 Tạo diễn đàn thảo luận...")
        for course in all_courses:
            enrolled_students = list(
                User.objects.filter(enrollments__course=course, role="student")
            )
            if not enrolled_students:
                continue

            # 2-3 chủ đề cho mỗi khoá
            topics_for_course = random.sample(FORUM_TOPICS, min(3, len(FORUM_TOPICS)))
            for title, content in topics_for_course:
                topic_author = random.choice(enrolled_students)
                topic, _ = ForumTopic.objects.get_or_create(
                    course=course,
                    title=title,
                    defaults={
                        "user": topic_author,
                        "content": content,
                    }
                )

                # 2-5 replies mỗi chủ đề
                repliers = random.sample(
                    enrolled_students,
                    min(random.randint(2, 5), len(enrolled_students))
                )
                for replier in repliers:
                    ForumReply.objects.get_or_create(
                        topic=topic,
                        user=replier,
                        defaults={"content": random.choice(FORUM_REPLIES)}
                    )

                # Giảng viên cũng reply
                if random.random() < 0.6:
                    ForumReply.objects.get_or_create(
                        topic=topic,
                        user=course.teacher,
                        defaults={
                            "content": "Cảm ơn câu hỏi của bạn! Mình sẽ giải thích chi tiết hơn trong buổi học tiếp theo nhé."}
                    )

        # ── SUMMARY ───────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 55))
        self.stdout.write(self.style.SUCCESS("  ✅ SEEDING HOÀN TẤT!"))
        self.stdout.write(self.style.SUCCESS("=" * 55))
        self.stdout.write(f"  👤 Admin       : 1  (admin / Admin@123)")
        self.stdout.write(f"  👩‍🏫 Giảng viên  : {User.objects.filter(role='teacher').count()}")
        self.stdout.write(f"  🎓 Sinh viên   : {User.objects.filter(role='student').count()}")
        self.stdout.write(f"  📂 Danh mục    : {Category.objects.count()}")
        self.stdout.write(f"  🏷️  Tag         : {Tag.objects.count()}")
        self.stdout.write(
            f"  📚 Khoá học    : {Course.objects.count()} ({len(free_courses)} free | {len(paid_courses)} có phí)")
        self.stdout.write(f"  📄 Học liệu    : {Material.objects.count()}")
        self.stdout.write(f"  📋 Đăng ký     : {Enrollment.objects.count()}")
        self.stdout.write(f"  💳 Giao dịch   : {Transaction.objects.count()}")
        self.stdout.write(f"  📊 Tiến độ     : {MaterialProgress.objects.count()}")
        self.stdout.write(f"  📝 Bài kiểm tra: {Quiz.objects.count()}")
        self.stdout.write(f"  🏆 Kết quả thi : {TestResult.objects.count()}")
        self.stdout.write(f"  💬 Chủ đề forum: {ForumTopic.objects.count()}")
        self.stdout.write(f"  💬 Trả lời     : {ForumReply.objects.count()}")
        self.stdout.write(self.style.SUCCESS("=" * 55))
