import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ── Auth ──────────────────────────────────────────────────
import Login                      from "../screens/Auth/Login";
import Register                   from "../screens/Auth/Register";
// ── Student Home ─────────────────────────────────────────
import HomeScreen                 from "../screens/Student/HomeScreen";
// ── Courses ──────────────────────────────────────────────
import CourseDetailScreen         from "../screens/Courses/CourseDetailScreen";
import CourseSearchScreen         from "../screens/Courses/CourseSearchScreen";
// ── Materials ────────────────────────────────────────────
import MaterialListScreen         from "../screens/Materials/MaterialListScreen";
import MaterialDetailScreen       from "../screens/Materials/MaterialDetailScreen";
import MaterialSearchScreen       from "../screens/Materials/MaterialSearchScreen";
import CommentScreen              from "../screens/Materials/CommentScreen";
import NoteScreen                 from "../screens/Materials/NoteScreen";
// ── Forum  (nhúng vào HomeStack — mở từ MaterialActionBar) ──
import ForumListScreen            from "../screens/Forum/ForumListScreen";
import ForumDetailScreen          from "../screens/Forum/ForumDetailScreen";
import CreateTopicScreen          from "../screens/Forum/CreateTopicScreen";
import NotificationListScreen     from "../screens/Notification/NotificationList";
// ── Quiz   (nhúng vào HomeStack — mở từ MaterialActionBar) ──
import QuizListScreen             from "../screens/Quiz/QuizListScreen";
import QuizTakeScreen             from "../screens/Quiz/QuizTakeScreen";
import QuizResultScreen           from "../screens/Quiz/QuizResultScreen";
// ── Progress ─────────────────────────────────────────────
import LearningDashboardScreen    from "../screens/Progress/LearningDashboardScreen";
import LearningPathScreen         from "../screens/Progress/LearningPathScreen";
// ── Payment ──────────────────────────────────────────────
import PaymentResultScreen        from "../screens/Payment/PaymentResultScreen";
import TransactionHistoryScreen   from "../screens/Payment/TransactionHistoryScreen";
import CheckoutScreen             from "../screens/Payment/CheckoutScreen";
// ── Profile ──────────────────────────────────────────────
import ProfileScreen              from "../screens/Profile/ProfileScreen";
import EditProfileScreen          from "../screens/Profile/EditProfileScreen";
import ChangePasswordScreen       from "../screens/Profile/ChangePasswordScreen";
// ── Teacher ──────────────────────────────────────────────
import TeacherDashboardScreen     from "../screens/Teacher/TeacherDashboardScreen";
import ManageCourseScreen         from "../screens/Teacher/ManageCourseScreen";
import ManageMaterialScreen       from "../screens/Teacher/ManageMaterialScreen";
import ManageQuizScreen           from "../screens/Teacher/ManageQuizScreen";
import StudentProgressScreen      from "../screens/Teacher/StudentProgressScreen";
// ── Admin ────────────────────────────────────────────────
import AdminDashboardScreen       from "../screens/Admin/AdminDashboardScreen";
import ReportScreen               from "../screens/Admin/ReportScreen";
import TransactionManagementScreen from "../screens/Admin/TransactionManagementScreen";

import VideoPlayerScreen from "../screens/Materials/VideoPlayerScreen";
import DocumentViewerScreen from "../screens/Materials/DocumentViewerScreen";
import QuizReviewScreen from "../screens/Quiz/QuizReviewScreen";

const Stack = createNativeStackNavigator();
const SO    = { headerShown: false };

// ── AUTH ─────────────────────────────────────────────────
export const AuthStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="Login"    component={Login} />
    <Stack.Screen name="Register" component={Register} />
  </Stack.Navigator>
);

// ── HOME (Student) ────────────────────────────────────────
// Forum & Quiz screens được nhúng trực tiếp vào đây.
// MaterialDetailScreen dùng <MaterialActionBar> để navigate tới
// ForumList / QuizList mà không cần rời HomeStack.
export const HomeStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="Home"           component={HomeScreen} />
    <Stack.Screen name="CourseDetail"   component={CourseDetailScreen} />
    <Stack.Screen name="CourseSearch"   component={CourseSearchScreen} />

     <Stack.Screen name="MaterialList"   component={MaterialListScreen} />
    <Stack.Screen name="MaterialDetail" component={MaterialDetailScreen} />
    <Stack.Screen name="material-search" component={MaterialSearchScreen} />
    <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ title: "Video Player" }} />
    <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} options={{ title: "Document Viewer" }} />
{/* note */}
    <Stack.Screen name="Comment"   component={CommentScreen}  options={{ title: 'Lesson Comment' }} />
   <Stack.Screen name="Note" component={NoteScreen} options={{ title: 'Lesson Notes' }} />
    <Stack.Screen name="ForumList"      component={ForumListScreen} />
    <Stack.Screen name="ForumDetail"    component={ForumDetailScreen} />
    <Stack.Screen name="CreateTopic"    component={CreateTopicScreen} />
    <Stack.Screen name="NotificationList" component={NotificationListScreen} />
    <Stack.Screen name="QuizList"          component={QuizListScreen} />
    <Stack.Screen name="QuizTake"          component={QuizTakeScreen} />
    <Stack.Screen name="QuizResult"        component={QuizResultScreen} />
    <Stack.Screen name="QuizReview"        component={QuizReviewScreen} />
    <Stack.Screen name="LearningDashboard" component={LearningDashboardScreen} />
    <Stack.Screen name="LearningPath"      component={LearningPathScreen} />

    <Stack.Screen name="PaymentResult"  component={PaymentResultScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
  </Stack.Navigator>
);

// ── FORUM (dùng cho TeacherTabs — độc lập) ───────────────
export const ForumStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="ForumList"   component={ForumListScreen} />
    <Stack.Screen name="ForumDetail" component={ForumDetailScreen} />
    <Stack.Screen name="CreateTopic" component={CreateTopicScreen} />
  </Stack.Navigator>
);

// ── QUIZ (giữ lại nếu cần dùng độc lập ở chỗ khác) ──────
export const QuizStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="QuizList"   component={QuizListScreen} />
    <Stack.Screen name="QuizTake"   component={QuizTakeScreen} />
    <Stack.Screen name="QuizResult" component={QuizResultScreen} />
  </Stack.Navigator>
);

// ── PROGRESS ─────────────────────────────────────────────
export const ProgressStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="LearningDashboard" component={LearningDashboardScreen} />
    <Stack.Screen name="LearningPath"      component={LearningPathScreen} />
    <Stack.Screen name="CourseDetail"      component={CourseDetailScreen} />
    
    {/* 💬 KHU VỰC FORUM DIỄN ĐÀN (Bổ sung đầy đủ luồng chi tiết) */}
    <Stack.Screen name="ForumList"         component={ForumListScreen} />
    <Stack.Screen name="ForumDetail"       component={ForumDetailScreen} /> 
    <Stack.Screen name="CreateTopic"       component={CreateTopicScreen} /> 

    {/* 📖 KHU VỰC HỌC TẬP VÀ TÀI LIỆU */}
    <Stack.Screen name="MaterialList"      component={MaterialListScreen} />
    <Stack.Screen name="MaterialDetail"    component={MaterialDetailScreen} />
    <Stack.Screen name="VideoPlayer"       component={VideoPlayerScreen} />
    <Stack.Screen name="DocumentViewer"    component={DocumentViewerScreen} />
    <Stack.Screen name="Note"              component={NoteScreen} />
    <Stack.Screen name="Comment"           component={CommentScreen} />
    
    {/* 📝 KHU VỰC BÀI KIỂM TRA (QUIZ) */}
    <Stack.Screen name="QuizList"          component={QuizListScreen} />
    <Stack.Screen name="QuizTake"          component={QuizTakeScreen} />
    <Stack.Screen name="QuizResult"        component={QuizResultScreen} />
    <Stack.Screen name="QuizReview"        component={QuizReviewScreen} />
  </Stack.Navigator>
);

// ── PROFILE (dùng chung 3 role) ──────────────────────────
export const ProfileStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="Profile"        component={ProfileScreen} />
    <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
  </Stack.Navigator>
);

// ── TEACHER ──────────────────────────────────────────────
export const TeacherStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
    <Stack.Screen name="ManageCourse"     component={ManageCourseScreen} />
    <Stack.Screen name="ManageMaterial"   component={ManageMaterialScreen} />
    <Stack.Screen name="ManageQuiz"       component={ManageQuizScreen} />
    <Stack.Screen name="StudentProgress"  component={StudentProgressScreen} />
  </Stack.Navigator>
);

// ── ADMIN ────────────────────────────────────────────────
export const AdminStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="AdminDashboard"        component={AdminDashboardScreen} />
    <Stack.Screen name="Report"                component={ReportScreen} />
    <Stack.Screen name="TransactionManagement" component={TransactionManagementScreen} />
  </Stack.Navigator>
);

