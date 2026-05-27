import React, { useContext } from "react";
import { View, ScrollView, Image } from "react-native";
import { Text, Surface, Chip, Divider, Avatar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MyUserContext } from "../../configs/MyContext";
import Styles, { colors } from "../../styles/Styles";
import { InfoRow, ActionRow, Header} from "../../components/common/index";
import LogoutButton from "../../components/common/CustomButton";
import TransactionHistoryScreen from "../Payment/TransactionHistoryScreen";


const ROLE_CONFIG = {
  admin:   { label: "Quản trị viên", color: colors.danger,    bg: "#FFEBEE" },
  teacher: { label: "Giảng viên",    color: colors.primary,   bg: "#E8F5F0" },
  student: { label: "Sinh viên",     color: colors.secondary, bg: "#EEEDF8" },
};

const ProfileScreen = () => {
  const nav = useNavigation();
  const [user] = useContext(MyUserContext);
  const role = ROLE_CONFIG[user?.role] ?? ROLE_CONFIG.student;

  if (!user) {
    return (
      <View style={[Styles.container, Styles.center]}>
        <Text variant="bodyLarge">Không tìm thấy thông tin tài khoản.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={Styles.container} showsVerticalScrollIndicator={false}>

      <Header title="Hồ sơ cá nhân" showBack rightComponent={<View />} />
      
      <View style={Styles.profileAvatarContainer}>
        <View style={Styles.profileAvatarWrapper}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={[Styles.avatar, Styles.profileAvatarBorder]} />
          ) : (
            <Avatar.Text
              size={80}
              label={'T'}
              labelStyle={{ fontWeight: "700", color: colors.white }}
              style={[Styles.avatar, Styles.profileAvatarBorder]}
            />
          )}
        </View>
      </View>

      <View style={[Styles.center, Styles.mb10]}>
        <Chip 
          style={[Styles.mt10, { backgroundColor: role.bg, height: 28, justifyContent: "center" }]} 
          textStyle={{ color: role.color, fontWeight: "700", fontSize: 12 }}
        >
          {role.label}
        </Chip>
      </View>

      {/*Read only*/}
      <Surface style={[Styles.p15, Styles.mb10, { backgroundColor: colors.white, borderRadius: 12 }]} elevation={1}>
        <Text variant="titleSmall" style={{ fontWeight: "700", color: colors.black, marginBottom: 8 }}>Thông tin cá nhân</Text>
        <Divider style={Styles.mb10} />
        
        <InfoRow icon="account" label="Họ và tên" value={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`} />
        <InfoRow icon="card-account-details" label="Tên đăng nhập" value={user?.username} />
        <InfoRow icon="email" label="Email" value={user?.email || "Chưa cập nhật"} />
        <InfoRow icon="shield-account" label="Vai trò" value={role.label} />
        
        {/* cho Student */}
        {user?.role === "student" && user?.profile && (
          <>
            <InfoRow icon="school" label="Trình độ" value={user.profile.current_level} />
            <InfoRow icon="target" label="Mục tiêu" value={user.profile.learning_goals || "Chưa cập nhật"} />
            <InfoRow icon="clock-outline" label="Tổng giờ học" value={`${user.profile.total_hours ?? 0} giờ`} />
            <InfoRow icon="star" label="Điểm trung bình" value={`${user.profile.average_score ?? 0}`} />
          </>
        )}
      </Surface>

      {/* Action */}
      <Surface style={[Styles.p15, Styles.mb10, { backgroundColor: colors.white, borderRadius: 12 }]} elevation={1}>
        <Text variant="titleSmall" style={{ fontWeight: "700", color: colors.black, marginBottom: 8 }}>Tài khoản</Text>
        <Divider style={Styles.mb10} />
        
        <ActionRow icon="account-edit" label="Chỉnh sửa thông tin" onPress={() => nav.navigate("EditProfile", { profile: user })} />
        <ActionRow icon="lock-reset" label="Đổi mật khẩu" onPress={() => nav.navigate("ChangePassword")} />
        {user?.role === "student" && user?.profile && (
        <>
          <ActionRow icon="history" label="Lịch sử thanh toán" onPress={() => nav.navigate("TransactionHistory")} />
        </>)}
      </Surface>

      <LogoutButton />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default ProfileScreen;