/**
 * RootNavigator.js
 * Điều hướng gốc — đọc role từ context, chọn đúng Tab navigator.
 * Đây là nơi DUY NHẤT xử lý logic Auth vs Main App.
 */
import React, { useContext } from "react";
import { MyUserContext } from "../configs/MyContext";
import { AuthStack } from "./StackNavigators";
import { StudentTabs, TeacherTabs, AdminTabs } from "./TabNavigators";

// Thêm role mới → chỉ cần thêm 1 dòng vào đây
const ROLE_NAVIGATOR = {
  STUDENT: StudentTabs,
  TEACHER: TeacherTabs,
  ADMIN:   AdminTabs,
};

const RootNavigator = () => {
  const [user] = useContext(MyUserContext);

  if (!user) return <AuthStack />;
  const Navigator = ROLE_NAVIGATOR[user.role] ?? StudentTabs;
  
  return <Navigator />;
};

export default RootNavigator;