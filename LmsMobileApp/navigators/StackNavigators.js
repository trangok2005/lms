import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";


import Login                      from "../screens/Auth/Login";
import Register                   from "../screens/Auth/Register";


import HomeScreen                 from "../screens/Student/HomeScreen";
import AILearningPathScreen       from "../screens/Student/AILearningPathScreen";


import CourseDetailScreen         from "../screens/Courses/CourseDetailScreen";
import CourseSearchScreen         from "../screens/Courses/CourseSearchScreen";


import MaterialListScreen         from "../screens/Materials/MaterialListScreen";
import MaterialDetailScreen       from "../screens/Materials/MaterialDetailScreen";
import MaterialSearchScreen       from "../screens/Materials/MaterialSearchScreen";
import CommentScreen              from "../screens/Materials/CommentScreen";
import NoteScreen                 from "../screens/Materials/NoteScreen";
import VideoPlayerScreen          from "../screens/Materials/VideoPlayerScreen";
import DocumentViewerScreen       from "../screens/Materials/DocumentViewerScreen";


import ForumListScreen            from "../screens/Forum/ForumListScreen";
import ForumDetailScreen          from "../screens/Forum/ForumDetailScreen";
import CreateTopicScreen          from "../screens/Forum/CreateTopicScreen";
import NotificationListScreen     from "../screens/Notification/NotificationList";


import QuizListScreen             from "../screens/Quiz/QuizListScreen";
import QuizTakeScreen             from "../screens/Quiz/QuizTakeScreen";
import QuizResultScreen           from "../screens/Quiz/QuizResultScreen";
import QuizReviewScreen           from "../screens/Quiz/QuizReviewScreen";
import QuizCourseScreen           from "../screens/Quiz/QuizCourseScreen";


import LearningDashboardScreen    from "../screens/Progress/LearningDashboardScreen";


import PaymentResultScreen        from "../screens/Payment/PaymentResultScreen";
import TransactionHistoryScreen   from "../screens/Payment/TransactionHistoryScreen";
import CheckoutScreen             from "../screens/Payment/CheckoutScreen";


import ProfileScreen              from "../screens/Profile/ProfileScreen";
import EditProfileScreen          from "../screens/Profile/EditProfileScreen";
import ChangePasswordScreen       from "../screens/Profile/ChangePasswordScreen";


import TeacherDashboardScreen     from "../screens/Teacher/TeacherDashboardScreen";
import ManageCourseScreen         from "../screens/Teacher/ManageCourseScreen";
import ManageMaterialScreen       from "../screens/Teacher/ManageMaterialScreen";
import ManageQuizScreen           from "../screens/Teacher/ManageQuizScreen";
import StudentProgressScreen      from "../screens/Teacher/StudentProgressScreen";
import CourseFormScreen           from "../screens/Teacher/Courseformscreen";


import AdminDashboardScreen       from "../screens/Admin/AdminDashboardScreen";
import ReportScreen               from "../screens/Admin/ReportScreen";
import TransactionManagementScreen from "../screens/Admin/TransactionManagementScreen";

const Stack = createNativeStackNavigator();
const SO    = { headerShown: false };




export const AuthStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="Login"    component={Login} />
    <Stack.Screen name="Register" component={Register} />
  </Stack.Navigator>
);




export const HomeStack = () => (
  <Stack.Navigator screenOptions={SO}>
    {/* Core Student */}
    <Stack.Screen name="Home"             component={HomeScreen} />
    <Stack.Screen name="AILearningPath"   component={AILearningPathScreen} />
    <Stack.Screen name="CourseDetail"     component={CourseDetailScreen} />
    <Stack.Screen name="CourseSearch"     component={CourseSearchScreen} />

    {/* Materials */}
    <Stack.Screen name="MaterialList"     component={MaterialListScreen} />
    <Stack.Screen name="MaterialDetail"   component={MaterialDetailScreen} />
    <Stack.Screen name="material-search"  component={MaterialSearchScreen} />
    <Stack.Screen name="VideoPlayer"      component={VideoPlayerScreen}     options={{ title: "Video Player" }} />
    <Stack.Screen name="DocumentViewer"   component={DocumentViewerScreen}  options={{ title: "Document Viewer" }} />
    <Stack.Screen name="Comment"          component={CommentScreen}         options={{ title: 'Lesson Comment' }} />
    <Stack.Screen name="Note"             component={NoteScreen}            options={{ title: 'Lesson Notes' }} />
    
    {/* Forum */}
    <Stack.Screen name="ForumList"        component={ForumListScreen} />
    <Stack.Screen name="ForumDetail"      component={ForumDetailScreen} />
    <Stack.Screen name="CreateTopic"      component={CreateTopicScreen} />
    <Stack.Screen name="NotificationList" component={NotificationListScreen} />
    
    {/* Quiz */}
    <Stack.Screen name="QuizCourse"       component={QuizCourseScreen} />
    <Stack.Screen name="QuizList"         component={QuizListScreen} />
    <Stack.Screen name="QuizTake"         component={QuizTakeScreen} />
    <Stack.Screen name="QuizResult"       component={QuizResultScreen} />
    <Stack.Screen name="QuizReview"       component={QuizReviewScreen} />
    
    {/* Progress & Payment */}
    <Stack.Screen name="LearningDashboard" component={LearningDashboardScreen} />
    <Stack.Screen name="PaymentResult"    component={PaymentResultScreen} />
    <Stack.Screen name="Checkout"         component={CheckoutScreen} />
  </Stack.Navigator>
);




export const ProgressStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="LearningDashboard" component={LearningDashboardScreen} />
  </Stack.Navigator>
);




export const QuizStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="QuizCourse" component={QuizCourseScreen} />
  </Stack.Navigator>
);




export const ForumStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="ForumList"   component={ForumListScreen} />
    <Stack.Screen name="ForumDetail" component={ForumDetailScreen} />
    <Stack.Screen name="CreateTopic" component={CreateTopicScreen} />
  </Stack.Navigator>
);




export const ProfileStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="Profile"            component={ProfileScreen} />
    <Stack.Screen name="EditProfile"        component={EditProfileScreen} />
    <Stack.Screen name="ChangePassword"     component={ChangePasswordScreen} />
    <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
  </Stack.Navigator>
);




export const TeacherStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
    <Stack.Screen name="ManageCourse"     component={ManageCourseScreen} />
    <Stack.Screen name="ManageMaterial"   component={ManageMaterialScreen} />
    <Stack.Screen name="ManageQuiz"       component={ManageQuizScreen} />
    <Stack.Screen name="ManageStudents"   component={StudentProgressScreen} />
    <Stack.Screen name="CourseForm"       component={CourseFormScreen} />
  </Stack.Navigator>
);




export const AdminStack = () => (
  <Stack.Navigator screenOptions={SO}>
    <Stack.Screen name="AdminDashboard"        component={AdminDashboardScreen} />
    <Stack.Screen name="Report"                component={ReportScreen} />
    <Stack.Screen name="TransactionManagement" component={TransactionManagementScreen} />
  </Stack.Navigator>
);