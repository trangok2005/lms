// import React, { useCallback, useState } from "react";
// import { View, FlatList, StyleSheet, Alert } from "react-native";
// import { Text, Surface, Chip, Icon, Avatar, Button, Searchbar } from "react-native-paper";
// import { useFocusEffect } from "@react-navigation/native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { authApis, endpoints } from "../../configs/Apis";
// import Styles, { colors } from "../../styles/Styles";
// import { Header, Loading } from "../../components/common";
// import usePagination from "../../hooks/usePagination";

// const ROLE_CONFIG = {
//   student: { label: "Học viên",     color: colors.primary,   bg: "#E8F5F0" },
//   teacher: { label: "Giảng viên",   color: colors.secondary, bg: "#EEEDF8" },
//   admin:   { label: "Quản trị",     color: colors.danger,    bg: "#FFEBEE" },
// };

// const ROLE_FILTERS = [
//   { label: "Tất cả",   value: "" },
//   { label: "Học viên", value: "student" },
//   { label: "Giảng viên", value: "teacher" },
//   { label: "Admin",    value: "admin" },
// ];

// const UserManagementScreen = () => {
//   const [role,    setRole]    = useState("");
//   const [keyword, setKeyword] = useState("");
//   const [search,  setSearch]  = useState(""); // debounce

//   const { data: users, loading, hasMore, refresh, loadMore } = usePagination(
//     endpoints["admin-users"],
//     { role: role || undefined, q: search || undefined },
//     true
//   );

//   useFocusEffect(useCallback(() => { refresh(); }, [role, search]));

//   const toggleActive = async (user) => {
//     Alert.alert(
//       user.is_active ? "Khoá tài khoản" : "Mở tài khoản",
//       `${user.is_active ? "Khoá" : "Mở"} tài khoản "${user.username}"?`,
//       [
//         { text: "Huỷ", style: "cancel" },
//         {
//           text: user.is_active ? "Khoá" : "Mở",
//           style: user.is_active ? "destructive" : "default",
//           onPress: async () => {
//             try {
//               const token = await AsyncStorage.getItem("token");
//               await authApis(token).patch(endpoints["admin-user-toggle"](user.id));
//               refresh();
//             } catch (ex) {
//               Alert.alert("Lỗi", ex.response?.data?.detail ?? "Thao tác thất bại!");
//             }
//           },
//         },
//       ]
//     );
//   };

//   const changeRole = (user) => {
//     const roles = ["student", "teacher", "admin"].filter((r) => r !== user.role);
//     Alert.alert(
//       "Đổi vai trò",
//       `Chọn vai trò mới cho "${user.username}"`,
//       [
//         ...roles.map((r) => ({
//           text: ROLE_CONFIG[r].label,
//           onPress: async () => {
//             try {
//               const token = await AsyncStorage.getItem("token");
//               await authApis(token).patch(endpoints["admin-user-role"](user.id), { role: r });
//               refresh();
//             } catch (ex) {
//               Alert.alert("Lỗi", ex.response?.data?.detail ?? "Thao tác thất bại!");
//             }
//           },
//         })),
//         { text: "Huỷ", style: "cancel" },
//       ]
//     );
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: colors.bg }}>
//       <Header title="Quản lý người dùng" showBack />

//       {/* Search */}
//       <View style={styles.searchWrap}>
//         <Searchbar
//           placeholder="Tìm theo tên, username, email..."
//           value={keyword}
//           onChangeText={setKeyword}
//           onSubmitEditing={() => setSearch(keyword)}
//           onIconPress={() => setSearch(keyword)}
//           style={styles.searchBar}
//           inputStyle={{ color: colors.black }}
//         />
//       </View>

//       {/* Filter role */}
//       <FlatList
//         data={ROLE_FILTERS}
//         horizontal
//         keyExtractor={(i) => i.value}
//         showsHorizontalScrollIndicator={false}
//         style={styles.filterRow}
//         renderItem={({ item }) => (
//           <Chip
//             selected={role === item.value}
//             onPress={() => setRole(item.value)}
//             style={[styles.chip, role === item.value && styles.chipActive]}
//             textStyle={{ color: role === item.value ? colors.white : colors.gray, fontSize: 12 }}
//           >
//             {item.label}
//           </Chip>
//         )}
//       />

//       {loading && users.length === 0 ? (
//         <Loading text="Đang tải..." />
//       ) : (
//         <FlatList
//           data={users}
//           keyExtractor={(item) => item.id.toString()}
//           contentContainerStyle={styles.list}
//           showsVerticalScrollIndicator={false}
//           onEndReached={loadMore}
//           onEndReachedThreshold={0.3}
//           ListFooterComponent={hasMore && loading ? <Loading /> : null}
//           ListEmptyComponent={
//             <View style={[Styles.center, { marginTop: 60 }]}>
//               <Text variant="bodyLarge" style={{ color: colors.gray }}>Không tìm thấy người dùng</Text>
//             </View>
//           }
//           renderItem={({ item }) => (
//             <UserCard
//               user={item}
//               onToggle={() => toggleActive(item)}
//               onChangeRole={() => changeRole(item)}
//             />
//           )}
//         />
//       )}
//     </View>
//   );
// };

// // ── UserCard ─────────────────────────────────────────────
// const UserCard = ({ user, onToggle, onChangeRole }) => {
//   const role    = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.student;
//   const initial = user.first_name?.[0]?.toUpperCase() ?? user.username?.[0]?.toUpperCase() ?? "U";

//   return (
//     <Surface style={[styles.card, !user.is_active && styles.cardInactive]} elevation={1}>
//       <View style={Styles.row}>
//         {/* Avatar */}
//         {user.avatar ? (
//           <Avatar.Image size={46} source={{ uri: user.avatar }} />
//         ) : (
//           <Avatar.Text size={46} label={initial}
//             style={{ backgroundColor: user.is_active ? role.bg : colors.border }} />
//         )}

//         {/* Info */}
//         <View style={{ flex: 1, marginLeft: 12 }}>
//           <View style={[Styles.between, Styles.mb10]}>
//             <Text variant="titleSmall" style={{ fontWeight: "700", color: user.is_active ? colors.black : colors.gray }}>
//               {user.first_name} {user.last_name}
//             </Text>
//             <Chip compact style={{ backgroundColor: role.bg }}
//               textStyle={{ color: role.color, fontSize: 10 }}>
//               {role.label}
//             </Chip>
//           </View>

//           <Text variant="bodySmall" style={{ color: colors.gray }}>@{user.username}</Text>
//           <Text variant="bodySmall" style={{ color: colors.gray }}>{user.email}</Text>

//           {/* Stats */}
//           <View style={[Styles.row, { marginTop: 6, gap: 12 }]}>
//             <View style={Styles.row}>
//               <Icon source="book" size={13} color={colors.gray} />
//               <Text variant="bodySmall" style={{ marginLeft: 3, color: colors.gray }}>
//                 {user.course_count ?? 0} khoá
//               </Text>
//             </View>
//             <View style={Styles.row}>
//               <Icon source="receipt" size={13} color={colors.gray} />
//               <Text variant="bodySmall" style={{ marginLeft: 3, color: colors.gray }}>
//                 {user.transaction_count ?? 0} GD
//               </Text>
//             </View>
//             {!user.is_active && (
//               <Chip compact style={{ backgroundColor: "#FEE2E2" }}
//                 textStyle={{ color: colors.danger, fontSize: 10 }}>
//                 Đã khoá
//               </Chip>
//             )}
//           </View>
//         </View>
//       </View>

//       {/* Actions */}
//       <View style={[Styles.row, { marginTop: 10, gap: 8 }]}>
//         <Button
//           mode="outlined"
//           compact
//           icon={user.is_active ? "lock" : "lock-open"}
//           textColor={user.is_active ? colors.danger : colors.primary}
//           style={[styles.actionBtn, { borderColor: user.is_active ? colors.danger : colors.primary }]}
//           onPress={onToggle}
//         >
//           {user.is_active ? "Khoá" : "Mở khoá"}
//         </Button>
//         <Button
//           mode="outlined"
//           compact
//           icon="account-convert"
//           textColor={colors.secondary}
//           style={[styles.actionBtn, { borderColor: colors.secondary }]}
//           onPress={onChangeRole}
//         >
//           Đổi role
//         </Button>
//       </View>
//     </Surface>
//   );
// };

// const styles = StyleSheet.create({
//   searchWrap:   { padding: 15, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
//   searchBar:    { backgroundColor: colors.bg, borderRadius: 10, elevation: 0, borderWidth: 1, borderColor: colors.border },
//   filterRow:    { paddingVertical: 10, paddingHorizontal: 15, flexGrow: 0, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
//   chip:         { marginRight: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
//   chipActive:   { backgroundColor: colors.primary, borderColor: colors.primary },
//   list:         { padding: 15, paddingBottom: 30 },
//   card:         { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
//   cardInactive: { opacity: 0.7 },
//   actionBtn:    { flex: 1, borderRadius: 8 },
// });

// export default UserManagementScreen;