import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis } from "../configs/Apis";



export default function usePagination(endpoint, params = {}, auto = true) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const mountedRef = useRef(true);

  const fetchPage = useCallback(async (p) => {
    if (p < 1) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const api = token ? authApis(token) : Apis;

      const reqParams = { ...params, page: p };
      const res = await api.get(endpoint, { params: reqParams });
      const items = res.data.results ?? res.data ?? [];

      if (!mountedRef.current) return;
      if (p === 1) setData(items);
      else setData((prev) => [...prev, ...items]);

      const hasNext = res.data?.next ?? null;
      setHasMore(hasNext !== null && hasNext !== undefined);
    } catch (ex) {
      console.debug("usePagination error", ex?.response?.data ?? ex.message ?? ex);
      if (p === 1) setData([]);
      setHasMore(false);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    mountedRef.current = true;
    if (auto) fetchPage(page);
    return () => {
      mountedRef.current = false;
    };
  }, [page, fetchPage, auto, refreshIndex]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    } else if (auto) {
      fetchPage(1);
    }
  }, [JSON.stringify(params), endpoint]);

  const refresh = useCallback(() => {
    setHasMore(true);
    setPage(1);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, loading]);

  return { data, loading, hasMore, refresh, loadMore, page };
}
