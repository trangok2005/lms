export const MyUserReducer = (current, action) => {
    switch (action.type) {
        case "LOGIN":
            return action.payload;
        case "UPDATE":                      
            return { ...current, ...action.payload };
        case "LOGOUT":
            return null;
    }

    return current;
}