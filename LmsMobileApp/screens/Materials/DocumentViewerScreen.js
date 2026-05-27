

import React, { useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, AppState } from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";

const SYNC_INTERVAL_MS = 30_000; // sync mỗi 30 giây
const ESTIMATED_READ_MINUTES = 10;

const DocumentViewerScreen = ({ route }) => {
    const { fileUrl, materialId, initialProgress } = route.params;

    const startTimeRef  = useRef(null);
    const accMinutesRef = useRef(initialProgress?.watched_minutes ?? 0);
    const isActiveRef   = useRef(true);
    const syncTimerRef  = useRef(null);
    const appStateRef   = useRef(AppState.currentState);
    const hasSyncedRef  = useRef(false);

    const flushElapsed = () => {
        if (startTimeRef.current && isActiveRef.current) {
            const elapsedMin = (Date.now() - startTimeRef.current) / 60_000;
            accMinutesRef.current += elapsedMin;
        }
        startTimeRef.current = null;
    };

    const resume = () => {
        if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
        }
    };

    const syncProgress = useCallback(async () => {
        flushElapsed();
        resume();

        const watched = accMinutesRef.current;
        const percent = Math.min(
            Math.round((watched / ESTIMATED_READ_MINUTES) * 100),
            100
        );

        try {
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(
                endpoints["material-progress"](materialId),
                {
                    watched_minutes:   Math.round(watched),
                    progress_percent:  percent,
                    last_position_sec: Math.round(watched * 60),
                }
            );
        } catch (err) {
            // silent fail
        }
    }, [materialId]);

    const stopSyncTimer = () => {
        if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
        }
    };

    const startSyncTimer = () => {
        stopSyncTimer();
        syncTimerRef.current = setInterval(syncProgress, SYNC_INTERVAL_MS);
    };

    useEffect(() => {
        const sub = AppState.addEventListener("change", (nextState) => {
            const prev = appStateRef.current;
            appStateRef.current = nextState;

            if (nextState === "active" && prev !== "active") {
                isActiveRef.current = true;
                resume();
                startSyncTimer();
            } else if (nextState !== "active" && prev === "active") {
                isActiveRef.current = false;
                flushElapsed();
                stopSyncTimer();
                syncProgress();
            }
        });
        return () => sub.remove();
    }, [syncProgress]);

    useFocusEffect(
        useCallback(() => {
            isActiveRef.current = true;
            startTimeRef.current = Date.now();
            hasSyncedRef.current = false;
            startSyncTimer();

            return () => {
                if (!hasSyncedRef.current) {
                    hasSyncedRef.current = true;
                    isActiveRef.current = false;
                    stopSyncTimer();
                    syncProgress();
                }
            };
        }, [syncProgress])
    );

    const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: viewerUrl }}
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default DocumentViewerScreen;
