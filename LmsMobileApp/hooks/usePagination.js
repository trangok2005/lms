import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis } from "../configs/Apis";

// Simple pagination hook compatible with existing screens
// usePagination(endpoint, params = {}, auto = true)
export default function usePagination(endpoint, params = {}, auto = true) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(async (p) => {
    if (p === 0) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const api = token ? authApis(token) : Apis;

      const reqParams = { ...params, page: p };
      const res = await api.get(endpoint, { params: reqParams });
      const items = res.data.results ?? res.data ?? [];

      if (p === 1) setData(items);
      else setData((prev) => [...prev, ...items]);

      // hasMore if next !== null or results length equals page size (approx)
      setHasMore(Boolean(res.data.next ?? (items.length > 0)));
      if ((res.data.next ?? null) === null) setPage(0);
    } catch (ex) {
      console.debug("usePagination error", ex?.response?.data ?? ex.message ?? ex);
      if (p === 1) setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    if (auto) fetchPage(page);
  }, [page, fetchPage, auto]);

  // refresh -> reset to page 1
  const refresh = useCallback(() => { setPage(1); }, []);
  const loadMore = useCallback(() => { if (page > 0 && !loading) setPage(page + 1); }, [page, loading]);

  return { data, loading, hasMore, refresh, loadMore };
}
