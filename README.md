# I. Database
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
LMSMOBILEAPP/
├── assets/                  # Images, Icons, Logos
├── components/              # REUSABLE UI COMPONENTS
│   ├── common/
│   │   ├── CustomButton.js  # Nút bấm chung (Primary, Outline, Danger)
│   │   ├── Header.js        # Thanh tiêu đề màn hình
│   │   ├── Loading.js       # Hiệu ứng chờ khi gọi API
│   │   └── index.js         # Export tập trung
│   ├── courses/
│   │   ├── CourseCard.js    # Card hiển thị khóa học (Thumbnail, Title, Price)
│   │   ├── ProgressBar.js   # Thanh tiến độ (%) cho MyCourse
│   │   └── index.js
│   ├── forum/
│   │   ├── CommentSection.js# Khối bình luận dưới Topic/Material
│   │   ├── TopicItem.js     # Card hiển thị tiêu đề thảo luận
│   │   └── index.js
│   ├── materials/
│   │   ├── NoteItem.js      # Hiển thị ghi chú kèm timestamp
│   │   ├── PDFViewer.js     # Component render file PDF/Slide
│   │   ├── VideoPlayer.js   # Component chơi Video bài giảng
│   │   └── index.js
│   └── quiz/
│       ├── QuestionItem.js  # Hiển thị câu hỏi và các lựa chọn A, B, C, D
│       ├── ResultChart.js   # Biểu đồ phân tích điểm mạnh/yếu (AI)
│       └── index.js
├── configs/
│   └── Api.js               
├── reducers/
│   └── reducers.js          # Root Reducer quản lý Auth state, Cart, v.v.
├── screens/                 # BUSINESS LOGIC & SCREENS
│   ├── Admin/               # Quản trị hệ thống
│   │   ├── AdminDashboardScreen.js
│   │   ├── ReportScreen.js
│   │   ├── TransactionManagementScreen.js
│   │   └── UserManagementScreen.js
│   ├── Auth/                # Đăng nhập & Đăng ký
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── Styles.js        # Style riêng cho giao diện Auth
│   ├── Courses/             # Module khoá học (Student)
│   │   ├── CourseDetailScreen.js
│   │   ├── CourseListScreen.js
│   │   ├── CourseSearchScreen.js
│   │   ├── MyCourseScreen.js
│   │   └── index.js
│   ├── Forum/               # Module thảo luận
│   │   ├── CreateTopicScreen.js
│   │   ├── ForumDetailScreen.js
│   │   ├── ForumListScreen.js
│   │   └── index.js
│   ├── Materials/           # Module học liệu (Student)
│   │   ├── CommentScreen.js
│   │   ├── MaterialDetailScreen.js
│   │   ├── MaterialListScreen.js
│   │   ├── MaterialSearchScreen.js
│   │   ├── NoteScreen.js
│   │   └── index.js
│   ├── Payment/             # Module thanh toán
│   │   ├── CheckoutScreen.js
│   │   ├── PaymentResultScreen.js
│   │   ├── TransactionHistoryScreen.js
│   │   └── index.js
│   ├── Profile/             # Cá nhân hóa
│   │   ├── EditProfileScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── SettingsScreen.js
│   │   └── index.js
│   ├── Progress/            # Theo dõi tiến độ & AI
│   │   ├── LearningDashboardScreen.js # Thống kê số giờ, % hoàn thành
│   │   ├── LearningPathScreen.js      # Lộ trình AI đề xuất
│   │   └── index.js
│   ├── Quiz/                # Module kiểm tra
│   │   ├── QuizListScreen.js
│   │   ├── QuizResultScreen.js
│   │   ├── QuizTakeScreen.js
│   │   └── index.js
│   ├── Student/             # Trang chủ chính
│   │   └── HomeScreen.js
│   └── Teacher/             # Module quản lý (Teacher)
│       ├── ManageCourseScreen.js
│       ├── ManageMaterialScreen.js
│       ├── ManageQuizScreen.js
│       ├── StudentProgressScreen.js
│       ├── TeacherDashboardScreen.js
│       └── index.js
├── styles/
│   └── Styles.js           
├── utils/                  
├── App.js                   
├── app.json                 
├── index.js                 
├── package.json             
└── ...