import React, { useReducer } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { MyUserContext} from "./configs/MyContext";
import { MyUserReducer } from "./reducers/reducers";
import RootNavigator from "./navigators/RootNavigator";
import { PaperProvider } from "react-native-paper";

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);
  return (
    <PaperProvider>
     <MyUserContext.Provider value={[user, dispatch]}>
        <NavigationContainer>
            <RootNavigator />
        </NavigationContainer>
      </MyUserContext.Provider>
      </PaperProvider>
  );
};

export default App;
