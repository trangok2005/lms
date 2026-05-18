import React, { useContext } from "react";
import { View, TouchableOpacity } from "react-native";
import { Appbar, Avatar, Badge, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";

/**
 * Header component tái sử dụng cho toàn app LMS.
 *
 * Props:
 *  - title      (string)   : Tiêu đề hiển thị giữa header
 *  - subtitle   (string)   : Dòng nhỏ bên dưới title (tuỳ chọn)
 *  - showBack   (bool)     : Hiện nút quay lại (mặc định false)
 *  - showSearch (bool)     : Hiện icon tìm kiếm (mặc định false)
 *  - showNotif  (bool)     : Hiện icon thông báo (mặc định false)
 *  - notifCount (number)   : Số badge thông báo (mặc định 0)
 *  - onSearch   (func)     : Callback khi bấm tìm kiếm
 *  - onNotif    (func)     : Callback khi bấm thông báo
 *  - rightComponent (node) : Render bất kỳ element nào bên phải
 *
 * Ví dụ dùng:
 *   <Header title="Khóa học" showBack showSearch onSearch={() => nav.navigate('CourseSearch')} />
 *   <Header title="Trang chủ" showNotif notifCount={3} />
 */

const Header = ({
  title = "LMS",
  subtitle,
  showBack = false,
  showSearch = false,
  showNotif = false,
  notifCount = 0,
  onSearch,
  onNotif,
  rightComponent,
}) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [user] = useContext(MyUserContext);

  return (
    <Appbar.Header style={[Styles.appbar, { backgroundColor: theme.colors.primary }]} elevated>
      {/* Nút Quay Lại */}
      {showBack && navigation.canGoBack() && (
        <Appbar.BackAction color={colors.white} onPress={() => navigation.goBack()} />
      )}

      {/* Chữ Tiêu Đề */}
      <Appbar.Content
        title={title}
        titleStyle={Styles.headerTitle}
        subtitle={subtitle}
        subtitleStyle={Styles.headerSubtitle}
      />

      {/* Tìm Kiếm */}
      {showSearch && onSearch && (
        <Appbar.Action icon="magnify" color={colors.white} onPress={onSearch} />
      )}

      {/* Thông Báo */}
      {showNotif && onNotif && (
        <View style={Styles.notifWrapper}>
          <Appbar.Action icon="bell-outline" color={colors.white} onPress={onNotif} />
          {notifCount > 0 && (
            <Badge style={Styles.headerBadge} size={18}>
              {notifCount > 99 ? "99+" : notifCount}
            </Badge>
          )}
        </View>
      )}

      {/* Avatar */}
      {!rightComponent && user && (
        <TouchableOpacity
          style={Styles.avatarHeaderBtn}
          onPress={() => navigation.navigate("ProfileTab")}
          activeOpacity={0.8}
        >
          {user.avatar ? (
            <Avatar.Image size={34} source={{ uri: user.avatar }} />
          ) : (
            <Avatar.Text
              size={34}
              label={user.first_name ? user.first_name[0].toUpperCase() : user.username?.[0]?.toUpperCase() ?? "U"}
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            />
          )}
        </TouchableOpacity>
      )}

      {/* tùy biến bên phải */}
      {rightComponent && <View style={{ marginRight: 8 }}>{rightComponent}</View>}
    </Appbar.Header>
  );
};

//các components cơ bảnr
export const HomeHeader = ({ title, notifCount, onSearch, onNotif }) => (
  <Header title={title} showSearch showNotif notifCount={notifCount} onSearch={onSearch} onNotif={onNotif} />
);


export default Header;