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
    /** */
    "forum-topics":       (courseId) => `/courses/${courseId}/forum/`,
    "forum-topic-detail": (id)      => `/forum/${id}/`,
    "forum-reply":        (topicId) => `/forum/${topicId}/replies/`,
    "forum-delete": (topicId) => `/forum/${topicId}/`,
    "reply-delete": (replyId) => `/forum/reply/${replyId}/`,
}

export const authApis = (token) => {
    return axios.create({
        baseURL: "http://192.168.1.8:8000/",
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

export default axios.create({
    baseURL: "http://192.168.1.8:8000/"
})
