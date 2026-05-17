import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "react-native-paper";
import {
  HomeStack, ForumStack, QuizStack,
  ProgressStack, ProfileStack,
  TeacherStack, AdminStack,
} from "./StackNavigators";

const Tab = createBottomTabNavigator();

// Helper tạo tabBarIcon gọn — tránh lặp arrow function 3 dòng
const icon = (src) => ({ color, size }) => <Icon source={src} size={size} color={color} />;

// Options mặc định dùng chung
const tabScreenOptions = (activeTintColor) => ({
  headerShown: false,
  tabBarActiveTintColor: activeTintColor,
  tabBarInactiveTintColor: "#9E9E9E",
  tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
  tabBarLabelStyle: { fontSize: 11 },
});

// ══════════════════════════════════════════════════════════
// STUDENT TABS  (5 tab)
// ══════════════════════════════════════════════════════════
export const StudentTabs = () => (
  <Tab.Navigator screenOptions={tabScreenOptions("#6C63FF")}>
    <Tab.Screen
      name="HomeTab"
      component={HomeStack}
      options={{ title: "Trang chủ", tabBarIcon: icon("home") }}
    />
    <Tab.Screen
      name="ForumTab"
      component={ForumStack}
      options={{ title: "Diễn đàn", tabBarIcon: icon("forum") }}
    />
    <Tab.Screen
      name="QuizTab"
      component={QuizStack}
      options={{ title: "Kiểm tra", tabBarIcon: icon("clipboard-check") }}
    />
    <Tab.Screen
      name="ProgressTab"
      component={ProgressStack}
      options={{ title: "Tiến độ", tabBarIcon: icon("chart-line") }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{title: "Hồ sơ",tabBarItemStyle: { display: "none" }}}
    />
  </Tab.Navigator>
);

// ══════════════════════════════════════════════════════════
// TEACHER TABS  (4 tab)
// ══════════════════════════════════════════════════════════
export const TeacherTabs = () => (
  <Tab.Navigator screenOptions={tabScreenOptions("#4CAF50")}>
    <Tab.Screen
      name="TeacherTab"
      component={TeacherStack}
      options={{ title: "Quản lý", tabBarIcon: icon("teach") }}
    />
    <Tab.Screen
      name="ForumTab"
      component={ForumStack}
      options={{ title: "Diễn đàn", tabBarIcon: icon("forum") }}
    />
    <Tab.Screen
      name="ProgressTab"
      component={ProgressStack}
      options={{ title: "Tiến độ lớp", tabBarIcon: icon("chart-bar") }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{ title: "Hồ sơ", tabBarIcon: icon("account") }}
    />
  </Tab.Navigator>
);

// ══════════════════════════════════════════════════════════
// ADMIN TABS  (2 tab)
// ══════════════════════════════════════════════════════════
export const AdminTabs = () => (
  <Tab.Navigator screenOptions={tabScreenOptions("#F44336")}>
    <Tab.Screen
      name="AdminTab"
      component={AdminStack}
      options={{ title: "Dashboard", tabBarIcon: icon("view-dashboard") }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{ title: "Hồ sơ", tabBarIcon: icon("account") }}
    />
  </Tab.Navigator>
);