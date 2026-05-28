import React, { useContext, useState, useEffect } from "react";
import { View, TouchableOpacity, DeviceEventEmitter } from "react-native";
import { Appbar, Avatar, Badge, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";

const Header = ({
  title = "LMS",
  subtitle,
  showBack = false,
  showSearch = false,
  showNotif = false,
  onSearch,
  onNotif,
  rightComponent,
}) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [user] = useContext(MyUserContext);
  

  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    if (!showNotif) return;

    const badgeSub = DeviceEventEmitter.addListener("UPDATE_BADGE_COUNT", (count) => {
      setBadgeCount(Number.isFinite(count) ? count : 0);
    });

    const incBadgeSub = DeviceEventEmitter.addListener("INCREMENT_BADGE_COUNT", () => {
      setBadgeCount((prev) => prev + 1);
    });

    const navigateSub = DeviceEventEmitter.addListener("NAVIGATE_TO_FORUM", (forumId) => {
      if (forumId) {
        navigation.navigate("ForumDetail", { topicId: forumId });
      }
    });

    const navNotificationsSub = DeviceEventEmitter.addListener("NAVIGATE_TO_NOTIFICATIONS", () => {
      navigation.navigate("NotificationList");
    });

    return () => {
      badgeSub.remove();
      incBadgeSub.remove();
      navigateSub.remove();
      navNotificationsSub.remove();
    };
  }, [showNotif, navigation]);


  const handleNotifPress = () => {
    if (onNotif) {
      onNotif();
    } else {

      navigation.navigate("NotificationList"); 
    }
  };

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
      {showNotif && (
        <View style={Styles.notifWrapper}>
          <Appbar.Action icon="bell-outline" color={colors.white} onPress={handleNotifPress} />
          {badgeCount > 0 && (
            <Badge style={Styles.headerBadge} size={18}>
              {badgeCount > 99 ? "99+" : badgeCount}
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


export const HomeHeader = ({ title, onSearch, onNotif }) => {
  const navigation = useNavigation();
  const handleSearch = onSearch ?? (() => navigation.navigate("CourseSearch"));
  return <Header title={title} showSearch showNotif onSearch={handleSearch} onNotif={onNotif} />;
};

export default Header;