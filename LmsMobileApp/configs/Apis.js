import axios from "axios";

export const endpoints = {
    'register': '/users/',
    'login': '/o/token/',
    'current-user': '/users/current-user/',
    /** */
    "courses": "/courses/",
    "categories": "/categories/",
    "tags": "/tags/",
    "course-detail":  (id) => `/courses/${id}/`,
    /** */
    "my-courses": "/courses/my-courses/",
    "enroll":  (id) => `/courses/${id}/enroll/`,
    "course-materials": (courseId) => `/Material/?course=${courseId}`,
    "material-detail":  (id)       => `/Material/${id}/`,
    "material-search": (q) => `/Material/?q=${q}`,
    
    // Material Management
    "material-list": () => `/Material/`,
    "material-create": () => `/Material/`,
    "material-detail": (id) => `/Material/${id}/`,
    "material-update": (id) => `/Material/${id}/`,
    "material-partial-update": (id) => `/Material/${id}/`,
    "material-delete": (id) => `/Material/${id}/`,

    // Material Interactions
    "material-start": (id) => `/Material/${id}/start/`,
    "material-complete": (id) => `/Material/${id}/complete/`,
    "material-next": (id) => `/Material/${id}/next/`,
    "material-previous": (id) => `/Material/${id}/previous/`,
     /** Quiz — Teacher (quản lý) */
    "teacher-quiz-list":           ()   => `/teacher/quizzes/`,
    "teacher-quiz-detail":         (id) => `/teacher/quizzes/${id}/`,
    "teacher-question-list":       (quizId) => `/teacher/quizzes/${quizId}/questions/`,
    "teacher-question-detail":     (id) => `/teacher/questions/${id}/`,
    "teacher-student-list":    () => `/teacher/students/`,
    "teacher-quiz-by-course":  (courseId) => `/teacher/quizzes/?course=${courseId}`,
    "teacher-student-list": () => `/teacher/students/`, 
    // quizz
    "quiz-list":      "student/quizzes/",
    "quiz-detail":    (id) => `student/quizzes/${id}/`,
    "quiz-submit":    (id) => `student/quizzes/${id}/submit/`,
    "test-results":   "student/quizzes/my-results/",
    "result-detail":  (id) => `student/quizzes/results/${id}/`,
    // Progress & Notes
    "comments": "/comments/",
    "notes": "/notes/",
   "material-progress": (id) => `/Material/${id}/progress/`,
    /** */
    "forum-topics":       (courseId) => `/courses/${courseId}/forum/`,
    "forum-topic-detail": (id)       => `/forum/${id}/`,
    "forum-reply":        (topicId) => `/forum/${topicId}/replies/`,
    "forum-delete":       (topicId) => `/forum/${topicId}/`,
    "reply-delete":       (replyId) => `/forum/reply/${replyId}/`,
    
    // Notifications
    "notifications": "/notifications/",
    "notification-detail": (id) => `/notifications/${id}/`,
    "notification-read": (id) => `/notifications/${id}/read/`,
    "notifications-read-all": "/notifications/read-all/",

    /**payments */
    "pay": "/payments/pay/",
    "transactions": "/payments/",
    

    // Admin endpoints
    "admin-transactions": "/admin/transactions/",
    "admin-transactions-stats": "/admin/transactions/stats/",
    "admin-transaction-detail": (id) => `/admin/transactions/${id}/`,


}

export const authApis = (token) => {
    return axios.create({
        baseURL: "http://192.168.1.9:8000/",
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

export default axios.create({
    baseURL: "http://192.168.1.9:8000/"
})
