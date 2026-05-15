import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from tqdm import tqdm

# Import các model từ các app của bạn
from backend.apps.users.models import User, StudentProfile
from backend.apps.courses.models import Category, Tag, Course, Enrollment
from backend.apps.materials.models import Material
from backend.apps.quizzes.models import Quiz, Question, Answer

fake = Faker()


class Command(BaseCommand):
    help = "Generate mock data for Digital Learning Management System"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('--- Starting Seeding Process ---'))

        # 1.  Categories
        categories_names = ['Web Development', 'Data Science', 'Mobile Design', 'AI & Machine Learning']
        category_objs = []
        for name in categories_names:
            cat, _ = Category.objects.get_or_create(name=name, defaults={'description': fake.sentence()})
            category_objs.append(cat)

        # 2. Tags
        tags_names = ['Python', 'Django', 'React', 'Tailwind', 'Tutorial', 'Basic', 'Advanced']
        tag_objs = [Tag.objects.get_or_create(name=name)[0] for name in tags_names]

        # 3. Users (Teacher & Students)
        self.stdout.write('Creating users...')

        # 1 Teacher mẫu
        teacher, created = User.objects.get_or_create(
            username='teacher_demo',
            email='teacher@ou.edu.vn',
            defaults={'role': 'teacher', 'first_name': 'Giảng viên', 'last_name': 'A'}
        )
        if created:
            teacher.set_password('admin123')
            teacher.save()

        # 10 Students
        students = []
        for i in range(10):
            user, created = User.objects.get_or_create(
                username=f'student_{i}',
                email=f'student{i}@gmail.com',
                defaults={'role': 'student', 'first_name': fake.first_name(), 'last_name': fake.last_name()}
            )
            if created:
                user.set_password('password123')
                user.save()
            students.append(user)

        # 4. Tạo Courses & Materials
        self.stdout.write('Creating courses and materials...')
        for i in tqdm(range(5)):  # Tạo 5 khóa học
            course = Course.objects.create(
                subject=f"Course: {fake.catch_phrase()}",
                description=f"<p>{fake.paragraph(nb_sentences=10)}</p>",  # RichTextField giả
                price=random.choice([0, 200000, 500000]),
                level=random.choice(['beginner', 'intermediate', 'advanced']),
                category=random.choice(category_objs),
                teacher=teacher
            )
            course.tags.set(random.sample(tag_objs, 3))

            # Tạo Materials cho mỗi khóa học
            for j in range(3):
                Material.objects.create(
                    title=f"Lesson {j + 1}: {fake.sentence()}",
                    content=fake.text(),
                    material_type=random.choice(['video', 'pdf', 'slide']),
                    order_index=j,
                    course=course
                )

            # Tạo 1 Quiz cho mỗi khóa học
            quiz = Quiz.objects.create(
                title=f"Final Quiz for {course.subject}",
                course=course,
                time_limit=30
            )
            # Tạo 2 câu hỏi cho Quiz
            for _ in range(2):
                q = Question.objects.create(quiz=quiz, content=fake.sentence() + "?", points=5.0)
                Answer.objects.create(question=q, content="Correct Answer", is_correct=True)
                Answer.objects.create(question=q, content="Wrong Answer 1", is_correct=False)
                Answer.objects.create(question=q, content="Wrong Answer 2", is_correct=False)

        # 5. Tạo Enrollments (Ghi danh ngẫu nhiên)
        self.stdout.write('Enrolling students...')
        all_courses = Course.objects.all()
        for student in students:
            # Mỗi sinh viên đăng ký 2 khóa học ngẫu nhiên
            chosen_courses = random.sample(list(all_courses), 2)
            for c in chosen_courses:
                Enrollment.objects.get_or_create(
                    user=student,
                    course=c,
                    defaults={'status': 'active', 'progress_percent': random.randint(0, 100)}
                )

        self.stdout.write(self.style.SUCCESS('--- Seeding Completed Successfully! ---'))