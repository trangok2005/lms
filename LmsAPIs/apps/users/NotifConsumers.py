from channels.generic.websocket import AsyncJsonWebsocketConsumer


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Lấy user_id từ URL định tuyến (ví dụ: ws/notifications/1/)
        self.user_id = self.scope['url_route']['kwargs']['user_id']

        # Định danh "Hộp thư cá nhân" - Mỗi user là 1 group riêng biệt
        self.room_group_name = f'user_{self.user_id}'

        # Tham gia vào group cá nhân của chính mình
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Chấp nhận kết nối từ điện thoại
        await self.accept()

    async def disconnect(self, close_code):
        # Rời khỏi group khi user tắt app hoặc logout để tránh rác bộ nhớ
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # 🔥 HÀM NHẬN TÍN HIỆU TỪ VIEWS: Đẩy data xuống React Native
    # ⚠️ LƯU Ý: Tên hàm bắt buộc phải là 'send_notification'
    # vì trong views.py ta đặt lệnh: 'type': 'send_notification'
    async def send_notification(self, event):
        # Lấy cục payload đã được Serializer chuẩn hóa và làm phẳng ở views.py
        notification_payload = event['data']

        # Bắn trực tiếp cục JSON này xuống cổng WebSocket của điện thoại
        await self.send_json(notification_payload)