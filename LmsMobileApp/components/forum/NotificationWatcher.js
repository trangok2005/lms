import React, { useEffect, useContext } from "react";
import { Alert, DeviceEventEmitter } from "react-native";
import { MyUserContext } from "../../configs/MyContext"; // Đường dẫn tới Context của bạn

const NotificationWatcher = () => {
  const [user] = useContext(MyUserContext);

  useEffect(() => {
    // 🚪 TRƯỜNG HỢP 1: Chưa đăng nhập hoặc vừa ĐĂNG XUẤT (user null)
    if (!user?.id) {
      console.log("📴 Không có User hoặc đã Đăng xuất -> Không bật WebSocket Thông báo.");
      return; // Không làm gì cả, nếu có ws cũ đang chạy nó sẽ bị hàm return ở dưới đóng lại
    }

    const wsHost = "192.168.1.18:8000"; // Thay bằng IP máy chủ của bạn hoặc 10.0.2.2 nếu dùng Android emulator
    const wsUrl = `ws://${wsHost}/ws/notifications/${user.id}/`;
    console.log(`Khởi tạo kết nối WebSocket Thông báo cho User: ${user.id}`);

    const wsNoti = new WebSocket(wsUrl);

    wsNoti.onopen = () => {
      console.log("[WS Notification] Đã kết nối thành công!");
    };

    wsNoti.onmessage = (e) => {
      let noti = null;
      try {
        noti = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch (err) {
        console.debug("Lỗi parse payload WebSocket thông báo:", err);
        return;
      }

      if (!noti) {
        console.debug("[WS Notification] Payload rỗng hoặc không hợp lệ:", e.data);
        return;
      }

      console.log("📩 Nhận được thông báo mới:", noti);

      const badgeCountRaw = noti.badge_count ?? noti.count;
      if (badgeCountRaw !== undefined && badgeCountRaw !== null) {
        const badgeCount = Number(badgeCountRaw);
        DeviceEventEmitter.emit("UPDATE_BADGE_COUNT", Number.isFinite(badgeCount) ? badgeCount : 0);
      } else {
        DeviceEventEmitter.emit("INCREMENT_BADGE_COUNT");
      }

      // Không hiển thị Alert thông báo. Chỉ cập nhật badge count.
      console.log("📩 Thông báo mới đã được nhận, cập nhật badge.");
    };

    wsNoti.onerror = (err) => {
      console.log("❌ [WS Notification] Lỗi kết nối:", err?.message ?? err);
    };

    wsNoti.onclose = (event) => {
      console.log("📴 [WS Notification] Đã đóng kết nối!", event.code, event.reason);
    };

    // 🔥 ĐÂY CHÍNH LÀ NƠI ĐÓNG WEB KHI LOGOUT:
    // Hàm này sẽ tự động chạy khi component bị hủy HOẶC khi user.id thay đổi (ví dụ từ id:5 thành null)
    return () => {
      console.log("🧹 Cleanup: Đóng kết nối WebSocket cũ...");
      wsNoti.close();
    };
  }, [user?.id]); // 🎯 Lắng nghe đúng biến user.id để tự động kích hoạt lại vòng đời

  return null; // Component chạy ngầm hoàn toàn, không render giao diện
};

export default NotificationWatcher;