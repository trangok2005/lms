# LMS - Learning Management System

Hệ thống quản lý học tập, gồm backend viết bằng Django REST Framework và app mobile viết bằng React Native.

Repo: `lms`

## Giới thiệu

Đây là một hệ thống LMS tương đối đầy đủ, có 3 vai trò: admin, giáo viên và học viên. Giáo viên tạo khóa học, upload tài liệu, ra quiz; học viên đăng ký học, làm bài, theo dõi tiến độ; admin quản lý user, khóa học và các giao dịch thanh toán.

Ngoài phần CRUD cơ bản, dự án có thử nghiệm thêm vài thứ:

- Dùng Gemini để phân tích kết quả quiz của học viên (điểm mạnh/yếu, tóm tắt)
- Dùng GPT-4o để gợi ý learning path cá nhân hóa, dựa trên mục tiêu, trình độ và thời gian rảnh mỗi tuần
- Forum và notification realtime bằng Django Channels
- Thanh toán qua VNPay/MoMo (hiện đang mock, xem phần Hạn chế bên dưới)

## Vai trò & quyền hạn

- **Admin** - quản lý user, khóa học, xem thống kê doanh thu
- **Teacher** - tạo/sửa khóa học, quản lý tài liệu và quiz, theo dõi học viên
- **Student** - tìm và đăng ký khóa học, học tài liệu, làm quiz, xem tiến độ

Auth dùng OAuth2, phân quyền theo role kết hợp object-level permission - ví dụ học viên chỉ sửa được note/comment của chính mình, giáo viên chỉ quản lý được khóa học do mình tạo.

## Một vài tính năng đáng chú ý

**Course & Learning** - hỗ trợ video/PDF/slide làm tài liệu học, theo dõi tiến độ theo từng nội dung, cho phép comment/note ngay trong bài học, có tìm kiếm và filter khóa học. Khóa học có thể miễn phí hoặc trả phí.

**Quiz** - giáo viên soạn câu hỏi, học viên làm bài và xem lại lịch sử/kết quả. Sau khi nộp bài, Gemini đọc kết quả và tóm tắt điểm mạnh, điểm yếu cho học viên.

**Realtime** - forum discussion, reply, và notification đều chạy qua Django Channels (WebSocket), kèm đếm số thông báo chưa đọc theo thời gian thực.

**AI Learning Path** - học viên nhập mục tiêu, trình độ hiện tại và số giờ học mỗi tuần, hệ thống chọn tài liệu phù hợp trong kho học liệu và ghép thành lộ trình học cá nhân hóa.



## Kiến trúc

Backend tổ chức theo domain, mỗi app phụ trách một mảng nghiệp vụ riêng:

```text
lms/
├── LmsAPIs/
│   ├── config/
│   ├── apps/
│   │   ├── users/
│   │   ├── courses/
│   │   ├── materials/
│   │   ├── quizzes/
│   │   ├── payments/
│   │   ├── ai_roadmap/
│   │   └── common/
│   └── manage.py
│
└── LmsMobileApp/
    ├── screens/
    ├── components/
    ├── navigators/
    ├── configs/
    ├── reducers/
    ├── hooks/
    └── styles/
```
## Chạy thử

### Backend

```bash
cd LmsAPIs

python -m venv venv
venv\Scripts\activate

pip install -r requiments.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver



### Mobile

```bash
cd LmsMobileApp

npm install
npm start
```

Sửa backend URL trong `LmsMobileApp/configs/Apis.js`, ví dụ:

```javascript
baseURL: "http://YOUR_BACKEND_IP:8000/"
```

## Biến môi trường

Tạo file `.env` trong `LmsAPIs/`:

```env
SECRET_KEY=
DEBUG=True

DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=3306

cloud_name=
api_key=
api_secret=

GEMINI_API_KEY=
GITHUB_TOKEN=
```