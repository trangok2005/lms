// import React, { useCallback, useState } from "react";
// import { View, ScrollView, FlatList, StyleSheet } from "react-native";
// import { Text, Surface, Chip, Icon, Divider, SegmentedButtons } from "react-native-paper";
// import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { authApis, endpoints } from "../../configs/Apis";
// import Styles, { colors } from "../../styles/Styles";
// import { Header, Loading } from "../../components/common";

// const METHOD_LABEL = { momo: "MoMo", vnpay: "VNPay", free: "Miễn phí" };
// const METHOD_COLOR = { momo: "#A50064", vnpay: "#0066CC", free: colors.primary };

// const ReportScreen = () => {
//   const nav   = useNavigation();
//   const route = useRoute();
//   const type  = route.params?.type ?? "revenue"; // revenue | payment-methods | users

//   const [data,    setData]    = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [by,      setBy]      = useState("month"); // month | day (chỉ dùng cho revenue)

//   const ENDPOINT_MAP = {
//     "revenue":         endpoints["admin-revenue"],
//     "payment-methods": endpoints["admin-payment-methods"],
//     "users":           endpoints["admin-users"],
//   };

//   const TITLE_MAP = {
//     "revenue":         "Doanh thu theo thời gian",
//     "payment-methods": "Phương thức thanh toán",
//     "users":           "Phân loại người dùng",
//   };

//   useFocusEffect(
//     useCallback(() => {
//       const fetch = async () => {
//         try {
//           setLoading(true);
//           const token  = await AsyncStorage.getItem("token");
//           const params = type === "revenue" ? { by } : {};
//           const res    = await authApis(token).get(ENDPOINT_MAP[type], { params });
//           setData(res.data);
//         } catch (ex) {
//           console.error(ex);
//         } finally {
//           setLoading(false);
//         }
//       };
//       fetch();
//     }, [type, by])
//   );

//   return (
//     <View style={{ flex: 1, backgroundColor: colors.bg }}>
//       <Header title={TITLE_MAP[type]} showBack />

//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={Styles.p15}>

//         {/* ── Filter by tháng/ngày (chỉ revenue) ── */}
//         {type === "revenue" && (
//           <SegmentedButtons
//             value={by}
//             onValueChange={setBy}
//             style={Styles.mb10}
//             buttons={[
//               { value: "month", label: "Theo tháng" },
//               { value: "day",   label: "Theo ngày"  },
//             ]}
//           />
//         )}

//         {loading ? <Loading text="Đang tải báo cáo..." /> : (
//           <>
//             {/* ── REVENUE ── */}
//             {type === "revenue" && Array.isArray(data) && (
//               <>
//                 {/* Tổng */}
//                 <Surface style={styles.summaryCard} elevation={1}>
//                   <View style={Styles.between}>
//                     <Text variant="bodyMedium" style={{ color: colors.gray }}>Tổng doanh thu</Text>
//                     <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: "800" }}>
//                       {data.reduce((s, i) => s + i.revenue, 0).toLocaleString("vi-VN")}₫
//                     </Text>
//                   </View>
//                 </Surface>

//                 {/* Từng kỳ */}
//                 {data.map((item, idx) => (
//                   <Surface key={idx} style={styles.rowCard} elevation={1}>
//                     <View style={Styles.between}>
//                       <View style={Styles.row}>
//                         <Icon source="calendar" size={16} color={colors.gray} />
//                         <Text variant="bodyMedium" style={{ marginLeft: 6, color: colors.black, fontWeight: "600" }}>
//                           {item.period}
//                         </Text>
//                       </View>
//                       <View style={{ alignItems: "flex-end" }}>
//                         <Text variant="titleSmall" style={{ color: colors.primary, fontWeight: "700" }}>
//                           {Number(item.revenue).toLocaleString("vi-VN")}₫
//                         </Text>
//                         <Text variant="bodySmall" style={{ color: colors.gray }}>
//                           {item.count} giao dịch
//                         </Text>
//                       </View>
//                     </View>
//                     {/* Progress bar thủ công */}
//                     <View style={styles.barBg}>
//                       <View style={[styles.barFill, {
//                         width: `${Math.min((item.revenue / Math.max(...data.map(d => d.revenue))) * 100, 100)}%`
//                       }]} />
//                     </View>
//                   </Surface>
//                 ))}
//               </>
//             )}

//             {/* ── PAYMENT METHODS ── */}
//             {type === "payment-methods" && Array.isArray(data) && (
//               <>
//                 {data.map((item, idx) => (
//                   <Surface key={idx} style={styles.rowCard} elevation={1}>
//                     <View style={Styles.between}>
//                       <View style={Styles.row}>
//                         <Icon source="credit-card" size={20} color={METHOD_COLOR[item.method] ?? colors.gray} />
//                         <Text variant="titleSmall" style={{ marginLeft: 8, fontWeight: "700", color: colors.black }}>
//                           {METHOD_LABEL[item.method] ?? item.method}
//                         </Text>
//                       </View>
//                       <View style={{ alignItems: "flex-end" }}>
//                         <Text variant="titleSmall" style={{ color: colors.primary, fontWeight: "700" }}>
//                           {Number(item.revenue).toLocaleString("vi-VN")}₫
//                         </Text>
//                         <Text variant="bodySmall" style={{ color: colors.gray }}>
//                           {item.count} giao dịch
//                         </Text>
//                       </View>
//                     </View>
//                   </Surface>
//                 ))}
//               </>
//             )}

//             {/* ── USERS ── */}
//             {type === "users" && data && (
//               <>
//                 {/* Phân loại role */}
//                 <Text variant="titleSmall" style={styles.subTitle}>Phân loại theo vai trò</Text>
//                 {data.by_role?.map((item, idx) => (
//                   <Surface key={idx} style={styles.rowCard} elevation={1}>
//                     <View style={Styles.between}>
//                       <View style={Styles.row}>
//                         <Icon source="account" size={18} color={colors.secondary} />
//                         <Text variant="bodyLarge" style={{ marginLeft: 8, color: colors.black, fontWeight: "600", textTransform: "capitalize" }}>
//                           {item.role}
//                         </Text>
//                       </View>
//                       <Text variant="titleSmall" style={{ color: colors.secondary, fontWeight: "700" }}>
//                         {item.count} người
//                       </Text>
//                     </View>
//                   </Surface>
//                 ))}

//                 {/* Top students */}
//                 <Text variant="titleSmall" style={[styles.subTitle, Styles.mt10]}>Top học viên tích cực</Text>
//                 {data.top_students?.map((s, idx) => (
//                   <Surface key={idx} style={styles.rowCard} elevation={1}>
//                     <View style={Styles.between}>
//                       <View style={Styles.row}>
//                         <Text style={styles.rank}>#{idx + 1}</Text>
//                         <Text variant="bodyMedium" style={{ marginLeft: 8, color: colors.black, fontWeight: "600" }}>
//                           {s.name}
//                         </Text>
//                       </View>
//                       <Text variant="bodySmall" style={{ color: colors.primary }}>
//                         {s.course_count} khoá
//                       </Text>
//                     </View>
//                   </Surface>
//                 ))}

//                 {/* Top teachers */}
//                 <Text variant="titleSmall" style={[styles.subTitle, Styles.mt10]}>Top giảng viên</Text>
//                 {data.top_teachers?.map((t, idx) => (
//                   <Surface key={idx} style={styles.rowCard} elevation={1}>
//                     <View style={Styles.between}>
//                       <View style={Styles.row}>
//                         <Text style={styles.rank}>#{idx + 1}</Text>
//                         <Text variant="bodyMedium" style={{ marginLeft: 8, color: colors.black, fontWeight: "600" }}>
//                           {t.name}
//                         </Text>
//                       </View>
//                       <Text variant="bodySmall" style={{ color: colors.secondary }}>
//                         {t.student_count} học viên
//                       </Text>
//                     </View>
//                   </Surface>
//                 ))}
//               </>
//             )}
//           </>
//         )}

//         <View style={{ height: 24 }} />
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   summaryCard: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
//   rowCard:     { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 8 },
//   subTitle:    { fontWeight: "700", color: colors.black, marginBottom: 8 },
//   rank:        { fontSize: 16, fontWeight: "800", color: colors.gray, width: 28 },
//   barBg:       { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 10 },
//   barFill:     { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
// });

// export default ReportScreen;