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

    // Progress & Notes
    "comments": "/comments/",
    "notes": "/notes/",
    "progress-update": "/progress/update-status/",
    "progress-summary": "/progress/summary/",
    /** */
    "forum-topics":       (courseId) => `/courses/${courseId}/forum/`,
    "forum-topic-detail": (id)      => `/forum/${id}/`,
    "forum-reply":        (topicId) => `/forum/${topicId}/replies/`,
    "forum-delete": (topicId) => `/forum/${topicId}/`,
    "reply-delete": (replyId) => `/forum/reply/${replyId}/`,
}

export const authApis = (token) => {
    return axios.create({
        baseURL: "http://192.168.1.18:8000/",
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

export default axios.create({
    baseURL: "http://192.168.1.18:8000/"
})
