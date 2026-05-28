import React, { useContext } from 'react'
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "react-native-paper";
import {
  HomeStack, ForumStack, QuizStack,
  ProgressStack, ProfileStack,
  TeacherStack, AdminStack,
} from "./StackNavigators";
import { MyUserContext } from "../configs/MyContext";
import { CommonActions } from "@react-navigation/native";

const Tab = createBottomTabNavigator();


const icon = (src) => ({ color, size }) => <Icon source={src} size={size} color={color} />;


const tabScreenOptions = (activeTintColor) => ({
  headerShown: false,
  tabBarActiveTintColor: activeTintColor,
  tabBarInactiveTintColor: "#9E9E9E",
  tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 4 },
  tabBarLabelStyle: { fontSize: 11 },
});


export const StudentTabs = () => (
  <Tab.Navigator screenOptions={tabScreenOptions("#6C63FF")}>
    <Tab.Screen
      name="HomeTab"
      component={HomeStack}
      options={({ navigation }) => ({
        title: "Trang chủ",
        tabBarIcon: icon("home"),
      })}
    />
    <Tab.Screen
      name="ProgressTab"
      component={ProgressStack}
      options={{
        title: "Học Tập",
        tabBarIcon: icon("chart-line"),
        unmountOnBlur: true,
      }}
    />
    <Tab.Screen
      name="QuizTab"
      component={QuizStack}
      options={{ title: "Bài kiểm tra", tabBarIcon: icon("pencil-box-outline") }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{ title: "Hồ sơ", tabBarIcon: icon("account") }}
    />
  </Tab.Navigator>
);





export const TeacherTabs = () => (
  <Tab.Navigator screenOptions={tabScreenOptions("#4CAF50")}>
    <Tab.Screen
      name="TeacherTab"
      component={TeacherStack}
      options={{ title: "Quản lý", tabBarIcon: icon("school") }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{ title: "Hồ sơ", tabBarIcon: icon("account") }}
    />
  </Tab.Navigator>
);




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
