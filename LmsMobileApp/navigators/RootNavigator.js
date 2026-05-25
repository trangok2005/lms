import React, { useContext } from "react";
import { MyUserContext } from "../configs/MyContext";
import { AuthStack } from "./StackNavigators";
import { StudentTabs, TeacherTabs, AdminTabs } from "./TabNavigators";

const ROLE_NAVIGATOR = {
  student: StudentTabs,  teacher: TeacherTabs,  admin: AdminTabs,
  STUDENT: StudentTabs,  TEACHER: TeacherTabs,  ADMIN: AdminTabs,
};

const RootNavigator = () => {
  const [user] = useContext(MyUserContext);
  if (!user) return <AuthStack />;
  const Navigator = ROLE_NAVIGATOR[user.role] ?? StudentTabs;
  return <Navigator />;
};

export default RootNavigator;