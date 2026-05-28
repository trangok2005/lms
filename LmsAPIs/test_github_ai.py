import os
import json
# Sử dụng thư viện decouple giống hệt như cách ông đang làm trong settings.py
from decouple import config
from openai import OpenAI

print("==================================================")
print("🛰️  BẮT ĐẦU KIỂM TRA KẾT NỐI GITHUB MODELS AI...")
print("==================================================")

# 1. Đọc token từ file .env bằng cấu hình config của python-decouple
try:
    github_token = config("GITHUB_TOKEN")
except Exception as e:
    print("❌ Lỗi: Thư viện decouple không thể đọc được file .env của ông rồi!")
    print(f"Chi tiết lỗi hệ thống: {e}")
    exit()

# Kiểm tra xem token đọc ra có bị rỗng hoặc lỗi không
if not github_token or github_token.strip() == "":
    print("❌ Lỗi: Tìm thấy file .env nhưng biến GITHUB_TOKEN đang bị bỏ trống!")
    print("👉 Ông vui lòng mở file .env lên kiểm tra lại xem đã dán token dạng 'github_pat_...' vào chưa nhé.")
    exit()

print(f"🔑 Đã tìm thấy Token thành công (Bảo mật ẩn: {github_token[:12]}...)")

# 2. Khởi tạo Client kết nối cổng AI của GitHub chạy trên nền tảng Microsoft Azure
client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=github_token
)

# 3. Giả lập kho dữ liệu bài học (Materials) để test khả năng bốc tách dữ liệu của GPT-4o
mock_materials = [
    {"id": 101, "title": "Bài 1: Cấu hình môi trường Django DRF và React Native", "is_premium": False},
    {"id": 102, "title": "Bài 2: Thiết kế giao diện và luồng Authentication", "is_premium": False},
    {"id": 103, "title": "Bài 3: Tích hợp ví điện tử thanh toán học phí 100k", "is_premium": True},
    {"id": 104, "title": "Bài 4: Triển khai ứng dụng lên máy chủ Production", "is_premium": True}
]

# Tạo prompt giả lập giống hệt logic trong View của ông
prompt = f"""
Bạn là AI chuyên gia thiết kế lộ trình học tập LMS. 
Hãy chọn lọc và sắp xếp các bài học phù hợp từ kho dữ liệu dưới đây thành một khóa học hoàn chỉnh.
Kho dữ liệu: {json.dumps(mock_materials, ensure_ascii=False)}

YÊU CẦU NGHIÊM NGẶT:
1. Phải chọn và xếp tối thiểu 4 bài học.
2. Định dạng trả về bắt buộc phải là cấu trúc JSON sạch theo mẫu sau:
{{
    "course_title": "Tên khóa học tổng hợp gợi ý",
    "description": "Mô tả ngắn gọn lộ trình",
    "materials": [Mảng các ID số của bài học theo thứ tự tăng dần]
}}
"""

print("\n🧠 Đang gửi yêu cầu và đợi siêu mẫu GPT-4o xử lý phân tích...")

try:
    # 4. Bắn lệnh lên cho OpenAI SDK xử lý qua cổng kết nối của GitHub
    response = client.chat.completions.create(
        model="gpt-4o",  # Tên model GPT-4o bản mạnh nhất được cấp miễn phí
        response_format={"type": "json_object"},  # Ép chặt định dạng đầu ra là JSON
        messages=[
            {"role": "system", "content": "Bạn là bộ máy thiết kế lộ trình học tập, chỉ trả về dữ liệu cấu trúc JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    # 5. In kết quả phản hồi ra màn hình terminal
    raw_content = response.choices[0].message.content

    # Ép kiểu ngược lại về Dict của Python rồi in dạng format thụt lề cho đẹp mắt
    pretty_json = json.dumps(json.loads(raw_content), indent=4, ensure_ascii=False)

    print("\n🎉 KẾT NỐI THÀNH CÔNG RỒI ÔNG ƠI!")
    print("--------------------------------------------------")
    print("🤖 KẾT QUẢ PHẢN HỒI TỪ GPT-4o:")
    print(pretty_json)
    print("--------------------------------------------------")
    print("🚀 Đường truyền thông suốt, Token hợp lệ 100%. Sẵn sàng mang vào cấu hình cho Django View!")

except Exception as e:
    print("\n❌ Thất bại! Không thể lấy được dữ liệu từ AI.")
    print(f"Chi tiết lỗi từ máy chủ API: {e}")
    print(
        "\n💡 Gợi ý xử lý: Kiểm tra lại phân quyền token trên GitHub, hoặc đảm bảo máy tính của ông đang có kết nối Internet ổn định nhé.")

print("\n==================================================")