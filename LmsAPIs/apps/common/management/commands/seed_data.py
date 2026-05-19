import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from tqdm import tqdm

# Import models from your specific app paths
from apps.users.models import User, StudentProfile
from apps.courses.models import Category, Tag, Course, Enrollment
from apps.materials.models import Material
from apps.quizzes.models import Quiz, Question, Answer

fake = Faker()


class Command(BaseCommand):
    help = "Generate mock data for Digital Learning Management System"

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('--- Starting Seeding Process ---'))

        # 1.  Categories
        categories_names = [
            'Web Development', 'Data Science', 'Mobile Design',
            'AI & Machine Learning', 'Cloud Computing', 'Cybersecurity',
            'Game Development'
        ]
        category_objs = []
        for name in categories_names:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={'description': fake.sentence()}
            )
            category_objs.append(cat)

        # 2.  Tags
        tags_names = [
            'Python', 'Django', 'React', 'Tailwind', 'Tutorial',
            'Basic', 'Advanced', 'C#', 'Unity', 'Laravel', 'Docker'
        ]
        tag_objs = [Tag.objects.get_or_create(name=name)[0] for name in tags_names]

        # 3.  Users (Teachers & Students)
        self.stdout.write('Creating users...')

        #  5 Teachers
        teachers = []
        for i in range(5):
            teacher, created = User.objects.get_or_create(
                username=f'teacher_{i}',
                email=f'teacher{i}@edu.vn',
                defaults={
                    'role': 'teacher',
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name()
                }
            )
            if created:
                teacher.set_password('admin123')
                teacher.save()
            teachers.append(teacher)

        #  30 Students
        students = []
        for i in range(30):
            user, created = User.objects.get_or_create(
                username=f'student_{i}',
                email=f'student{i}@gmail.com',
                defaults={
                    'role': 'student',
                    'first_name': fake.first_name(),
                    'last_name': fake.last_name()
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            students.append(user)

        # 4.  Courses & Materials
        self.stdout.write('Creating courses and materials...')
        all_courses = []

        # Generate 20 Courses
        for i in tqdm(range(20), desc="Processing Courses"):
            course = Course.objects.create(
                subject=f"Course: {fake.catch_phrase()}",
                description=f"<p>{fake.paragraph(nb_sentences=10)}</p>",
                price=random.choice([0, 199000, 299000, 499000, 999000]),
                level=random.choice(['beginner', 'intermediate', 'advanced']),
                category=random.choice(category_objs),
                teacher=random.choice(teachers)
            )
            # Assign 2 to 4 random tags to each course
            course.tags.set(random.sample(tag_objs, random.randint(2, 4)))
            all_courses.append(course)

            #  5 Materials for each course
            for j in range(5):
                Material.objects.create(
                    title=f"Lesson {j + 1}: {fake.sentence()}",
                    content=fake.text(),
                    material_type=random.choice(['video', 'pdf', 'slide']),
                    order_index=j,
                    course=course
                )

            #  1 Final Quiz for each course
            quiz = Quiz.objects.create(
                title=f"Final Quiz for {course.subject}",
                course=course,
                time_limit=random.choice([15, 30, 45, 60]),
                passing_score=50.0
            )

            #  5 Questions for the Quiz
            for _ in range(5):
                q = Question.objects.create(
                    quiz=quiz,
                    content=fake.sentence() + "?",
                    points=2.0
                )
                # 1 Correct Answer
                Answer.objects.create(question=q, content=fake.word(), is_correct=True)
                # 3 Wrong Answers
                for _ in range(3):
                    Answer.objects.create(question=q, content=fake.word(), is_correct=False)

        # 5.  Enrollments (Randomize student enrollments)
        self.stdout.write('Enrolling students...')
        for student in students:
            # Each student enrolls in 3 to 6 random courses
            num_enrollments = random.randint(3, 6)
            chosen_courses = random.sample(all_courses, num_enrollments)

            for c in chosen_courses:
                Enrollment.objects.get_or_create(
                    user=student,
                    course=c,
                    defaults={
                        'status': random.choice(['active', 'completed', 'dropped']),
                        'progress_percent': random.randint(0, 100)
                    }
                )

        self.stdout.write(self.style.SUCCESS('--- Seeding Completed Successfully! ---'))