import React, { useContext } from "react";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";

/*
 * LogoutButton — nút đăng xuất dùng chung
*/
const LogoutButton = () => {
  const [, dispatch] = useContext(MyUserContext);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <Button mode="outlined" onPress={logout}
      style={[Styles.mb10, { borderColor: colors.danger, borderRadius: 8 }]} textColor={colors.danger}
      icon="logout"
    >
      Đăng xuất
    </Button>
  );
};

export default LogoutButton;