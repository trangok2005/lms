// import React, { useCallback, useState } from "react";
// import { View, FlatList, StyleSheet } from "react-native";
// import { Text, Surface, Chip, Icon, Divider, Searchbar } from "react-native-paper";
// import { useFocusEffect } from "@react-navigation/native";
// import Styles, { colors } from "../../styles/Styles";
// import { Header, Loading } from "../../components/common";
// import usePagination from "../../hooks/usePagination";
// import { endpoints } from "../../configs/Apis";

// const STATUS_CONFIG = {
//   success: { label: "Thành công", color: colors.primary, bg: "#E8F5F0", icon: "check-circle"  },
//   pending: { label: "Đang xử lý", color: "#F59E0B",      bg: "#FFFBEB", icon: "clock-outline" },
//   failed:  { label: "Thất bại",   color: colors.danger,  bg: "#FFEBEE", icon: "close-circle"  },
// };

// const METHOD_CONFIG = {
//   momo:  { label: "MoMo",     color: "#A50064", icon: "wallet"      },
//   vnpay: { label: "VNPay",    color: "#0066CC", icon: "credit-card" },
//   free:  { label: "Miễn phí", color: colors.primary, icon: "gift"  },
// };

// const STATUS_FILTERS = [
//   { label: "Tất cả",     value: "" },
//   { label: "Thành công", value: "success" },
//   { label: "Đang xử lý", value: "pending" },
//   { label: "Thất bại",   value: "failed"  },
// ];

// const METHOD_FILTERS = [
//   { label: "Tất cả", value: "" },
//   { label: "MoMo",   value: "momo"  },
//   { label: "VNPay",  value: "vnpay" },
//   { label: "Free",   value: "free"  },
// ];

// const TransactionManagementScreen = () => {
//   const [statusF, setStatusF] = useState("");
//   const [methodF, setMethodF] = useState("");
//   const [keyword, setKeyword] = useState("");
//   const [search,  setSearch]  = useState("");

//   // ✅ Dùng /payments/ — admin tự thấy tất cả qua get_queryset
//   const { data: transactions, loading, hasMore, refresh, loadMore } = usePagination(
//     endpoints["transactions"],
//     {
//       status: statusF || undefined,
//       method: methodF || undefined,
//       q:      search  || undefined,
//     },
//     true
//   );

//   useFocusEffect(useCallback(() => { refresh(); }, [statusF, methodF, search]));

//   // Tổng doanh thu của trang hiện tại
//   const totalRevenue = transactions
//     .filter((t) => t.status === "success" && t.payment_method !== "free")
//     .reduce((sum, t) => sum + parseFloat(t.amount ?? 0), 0);

//   return (
//     <View style={{ flex: 1, backgroundColor: colors.bg }}>
//       <Header title="Quản lý giao dịch" showBack />

//       {/* Search */}
//       <View style={styles.searchWrap}>
//         <Searchbar
//           placeholder="Tìm theo tên khoá học, người dùng..."
//           value={keyword}
//           onChangeText={setKeyword}
//           onSubmitEditing={() => setSearch(keyword)}
//           onIconPress={() => setSearch(keyword)}
//           style={styles.searchBar}
//           inputStyle={{ color: colors.black }}
//         />
//       </View>

//       {/* Filter status */}
//       <FlatList
//         data={STATUS_FILTERS}
//         horizontal
//         keyExtractor={(i) => i.value}
//         showsHorizontalScrollIndicator={false}
//         style={styles.filterRow}
//         renderItem={({ item }) => (
//           <Chip selected={statusF === item.value} onPress={() => setStatusF(item.value)}
//             style={[styles.chip, statusF === item.value && styles.chipActive]}
//             textStyle={{ color: statusF === item.value ? colors.white : colors.gray, fontSize: 12 }}>
//             {item.label}
//           </Chip>
//         )}
//       />

//       {/* Filter method */}
//       <FlatList
//         data={METHOD_FILTERS}
//         horizontal
//         keyExtractor={(i) => i.value}
//         showsHorizontalScrollIndicator={false}
//         style={[styles.filterRow, { borderTopWidth: 0 }]}
//         renderItem={({ item }) => (
//           <Chip selected={methodF === item.value} onPress={() => setMethodF(item.value)}
//             style={[styles.chip, methodF === item.value && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
//             textStyle={{ color: methodF === item.value ? colors.white : colors.gray, fontSize: 12 }}>
//             {item.label}
//           </Chip>
//         )}
//       />

//       {loading && transactions.length === 0 ? (
//         <Loading text="Đang tải giao dịch..." />
//       ) : (
//         <FlatList
//           data={transactions}
//           keyExtractor={(item) => item.id.toString()}
//           contentContainerStyle={styles.list}
//           showsVerticalScrollIndicator={false}
//           onEndReached={loadMore}
//           onEndReachedThreshold={0.3}
//           ListFooterComponent={hasMore && loading ? <Loading /> : null}
//           ListHeaderComponent={
//             transactions.length > 0 ? (
//               <Surface style={styles.summaryCard} elevation={1}>
//                 <View style={Styles.between}>
//                   <View>
//                     <Text variant="bodySmall" style={{ color: colors.gray }}>Đang hiển thị</Text>
//                     <Text variant="titleSmall" style={{ color: colors.black, fontWeight: "700" }}>
//                       {transactions.length} giao dịch
//                     </Text>
//                   </View>
//                   <View style={{ alignItems: "flex-end" }}>
//                     <Text variant="bodySmall" style={{ color: colors.gray }}>Doanh thu (trang này)</Text>
//                     <Text variant="titleSmall" style={{ color: colors.primary, fontWeight: "700" }}>
//                       {totalRevenue.toLocaleString("vi-VN")}₫
//                     </Text>
//                   </View>
//                 </View>
//               </Surface>
//             ) : null
//           }
//           ListEmptyComponent={
//             <View style={[Styles.center, { marginTop: 60 }]}>
//               <Icon source="receipt-text-outline" size={48} color={colors.border} />
//               <Text variant="bodyLarge" style={{ color: colors.gray, marginTop: 12 }}>
//                 Không có giao dịch nào
//               </Text>
//             </View>
//           }
//           renderItem={({ item }) => <TransactionCard transaction={item} />}
//         />
//       )}
//     </View>
//   );
// };

// // ── TransactionCard (admin version — hiện thêm user info) ─
// const TransactionCard = ({ transaction }) => {
//   const st = STATUS_CONFIG[transaction.status]        ?? STATUS_CONFIG.pending;
//   const mt = METHOD_CONFIG[transaction.payment_method] ?? METHOD_CONFIG.free;
//   const isFree = transaction.payment_method === "free" || parseFloat(transaction.amount) === 0;

//   return (
//     <Surface style={styles.card} elevation={1}>
//       {/* Header: course + status */}
//       <View style={[Styles.between, Styles.mb10]}>
//         <Text variant="titleSmall" style={styles.courseName} numberOfLines={1}>
//           {transaction.course_name ?? "Khoá học"}
//         </Text>
//         <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
//           <Icon source={st.icon} size={12} color={st.color} />
//           <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
//         </View>
//       </View>

//       <Divider style={Styles.mb10} />

//       {/* User info — admin thấy thêm */}
//       {transaction.user && (
//         <View style={[Styles.row, Styles.mb10]}>
//           <Icon source="account" size={14} color={colors.gray} />
//           <Text variant="bodySmall" style={{ marginLeft: 4, color: colors.gray }}>
//             {transaction.user.first_name} {transaction.user.last_name}
//             {" "}(@{transaction.user.username})
//           </Text>
//         </View>
//       )}

//       {/* Method + Amount + Date */}
//       <View style={Styles.between}>
//         <View style={Styles.row}>
//           <Icon source={mt.icon} size={15} color={mt.color} />
//           <Text variant="bodySmall" style={{ marginLeft: 5, color: colors.gray }}>{mt.label}</Text>
//         </View>
//         <Text variant="titleSmall" style={{ fontWeight: "700", color: isFree ? colors.primary : colors.black }}>
//           {isFree ? "Miễn phí" : `${Number(transaction.amount).toLocaleString("vi-VN")}₫`}
//         </Text>
//       </View>

//       <View style={[Styles.row, { marginTop: 6 }]}>
//         <Icon source="calendar-outline" size={12} color={colors.gray} />
//         <Text variant="bodySmall" style={{ marginLeft: 4, color: colors.gray }}>
//           {new Date(transaction.created_date).toLocaleString("vi-VN")}
//         </Text>
//       </View>
//     </Surface>
//   );
// };

// const styles = StyleSheet.create({
//   searchWrap:   { padding: 15, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
//   searchBar:    { backgroundColor: colors.bg, borderRadius: 10, elevation: 0, borderWidth: 1, borderColor: colors.border },
//   filterRow:    { paddingVertical: 8, paddingHorizontal: 15, flexGrow: 0, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
//   chip:         { marginRight: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
//   chipActive:   { backgroundColor: colors.primary, borderColor: colors.primary },
//   list:         { padding: 15, paddingBottom: 30 },
//   summaryCard:  { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10 },
//   card:         { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 8 },
//   courseName:   { flex: 1, fontWeight: "700", color: colors.black, marginRight: 8 },
//   statusBadge:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 3 },
//   statusText:   { fontSize: 11, fontWeight: "700" },
// });

// export default TransactionManagementScreen;