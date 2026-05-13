import axios from "axios";

export const endpoints = {
    'register': '/users/',
    'login': '/o/token/',
    'current-user': '/users/current-user/',
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