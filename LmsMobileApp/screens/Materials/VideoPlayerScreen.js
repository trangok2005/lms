import React, { useState, useRef, useEffect } from "react";
import {
    View,
    StyleSheet,
    Text,
    useWindowDimensions,
    TouchableWithoutFeedback,
    StatusBar,
    Animated,
    ActivityIndicator
} from "react-native";

import { useVideoPlayer, VideoView } from "expo-video";
import { IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authApis, endpoints } from "../../configs/Apis";

const VideoPlayerScreen = ({ route }) => {
    const { videoUrl, materialId, startAt = 0 } = route.params || {};

    const { width } = useWindowDimensions();
    const navigation = useNavigation();

    const mountedRef = useRef(true);
    const lastSavedRef = useRef(0);
    const lastSaveTimeRef = useRef(0);
    const intervalRef = useRef(null);
    const hasStartedRef = useRef(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const [controlsVisible, setControlsVisible] = useState(true);
    const [isSliding, setIsSliding] = useState(false);
    const [positionSec, setPositionSec] = useState(0);
    const [durationSec, setDurationSec] = useState(0);

    // ======================
    // PLAYER
    // ======================
    const player = useVideoPlayer(
        typeof videoUrl === "string" ? { uri: videoUrl } : videoUrl,
        (p) => {
            p.loop = false;
        }
    );

    // ======================
    // FIX: Thay useEvent bằng addListener (tương thích expo mới)
    // ======================
    const [isPlaying, setIsPlaying] = useState(player?.playing ?? false);
    const [status, setStatus] = useState(player?.status ?? "idle");

    useEffect(() => {
        if (!player) return;

        const playingSub = player.addListener("playingChange", (e) => {
            if (mountedRef.current) setIsPlaying(e.isPlaying);
        });

        const statusSub = player.addListener("statusChange", (e) => {
            if (mountedRef.current) setStatus(e.status);
        });

        return () => {
            playingSub.remove();
            statusSub.remove();
        };
    }, [player]);

    const isReady = status === "readyToPlay";
    const isBuffering = status === "loading";

    // ======================
    // CLEANUP (CRITICAL)
    // ======================
    useEffect(() => {
        return () => {
            mountedRef.current = false;

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // ======================
    // AUTO PLAY SAFE
    // ======================
    useEffect(() => {
        if (!isReady || hasStartedRef.current || !player) return;

        try {
            if (startAt > 0) {
                player.currentTime = Number(startAt);
            }

            player.play();
            hasStartedRef.current = true;
        } catch (e) {
            console.log("AutoPlay error:", e);
        }
    }, [isReady]);

    // ======================
    // SAVE PROGRESS SAFE (throttle 15 giây)
    // ======================
    const saveProgress = async (force = false) => {
        try {
            if (!mountedRef.current || !player || !materialId) return;

            const current = Number(player.currentTime ?? 0);
            const duration = Number(player.duration ?? 0);

            if (!duration) return;

            const now = Date.now();
            if (!force && now - lastSaveTimeRef.current < 15_000) return;
            lastSaveTimeRef.current = now;

            lastSavedRef.current = current;

            const progressPercent = Math.min(
                100,
                Math.floor((current / duration) * 100)
            );

            const token = await AsyncStorage.getItem("token");

            await authApis(token).post(
                endpoints["material-progress"](materialId),
                {
                    last_position_sec: current,
                    watched_minutes: Math.floor(current / 60),
                    progress_percent: progressPercent
                }
            );
        } catch (err) {
            console.log("SAVE PROGRESS ERROR:", err?.response?.data || err.message);
        }
    };

    // ======================
    // INTERVAL SAFE
    // ======================
    useEffect(() => {
        if (!isPlaying || isSliding) return;

        intervalRef.current = setInterval(() => {
            if (!mountedRef.current || !player) return;

            const current = Number(player.currentTime ?? 0);
            const duration = Number(player.duration ?? 0);

            // Cập nhật UI mỗi giây
            setPositionSec(current);
            setDurationSec(duration);

            // Save API — throttle 15 giây trong saveProgress tự xử lý
            saveProgress();
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            saveProgress(true);
        };
    }, [isPlaying, isSliding]);

    // ======================
    // CONTROLS
    // ======================
    const handleScreenTap = () => {
        if (!player) return;

        if (controlsVisible) {
            isPlaying ? player.pause() : player.play();
        } else {
            setControlsVisible(true);
        }
    };

    // ======================
    // SEEK SAFE (FIX CRASH)
    // ======================
    const handleSlidingComplete = (value) => {
        const seekTime = Number(value);

        setIsSliding(false);
        setPositionSec(seekTime);

        try {
            requestAnimationFrame(() => {
                if (player && mountedRef.current) {
                    player.currentTime = seekTime;
                }
            });
        } catch (e) {}

        saveProgress(true);
    };

    const handleSlidingStart = () => {
        setIsSliding(true);
    };

    const formatTime = (sec) => {
        if (!sec || isNaN(sec)) return "00:00";
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const dynamicStyle = {
        width,
        height: "100%"
    };

    if (!videoUrl) {
        return (
            <View style={styles.center}>
                <Text style={{ color: "#fff" }}>No video found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <TouchableWithoutFeedback onPress={handleScreenTap}>
                <View style={styles.videoWrapper}>
                    <VideoView
                        style={[styles.video, dynamicStyle]}
                        player={player}
                        nativeControls={false}
                        contentFit="contain"
                    />

                    {isBuffering && (
                        <View style={styles.overlay}>
                            <ActivityIndicator size="large" color="#fff" />
                        </View>
                    )}

                    {!isPlaying && !isBuffering && (
                        <View style={styles.overlay}>
                            <IconButton icon="play" iconColor="#fff" size={60} />
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>

            <View style={styles.controls}>
                <IconButton
                    icon="arrow-left"
                    iconColor="#fff"
                    onPress={async () => {
                        try {
                            player.pause();
                            await saveProgress(true);
                        } catch (e) {}

                        navigation.goBack();
                    }}
                />

                <View style={styles.bottom}>
                    <Text style={styles.time}>{formatTime(positionSec)}</Text>

                    <Slider
                        style={{ flex: 1 }}
                        minimumValue={0}
                        maximumValue={durationSec || 1}
                        value={positionSec}
                        onSlidingStart={handleSlidingStart}
                        onSlidingComplete={handleSlidingComplete}
                        minimumTrackTintColor="#4f46e5"
                        maximumTrackTintColor="#555"
                        thumbTintColor="#fff"
                    />

                    <Text style={styles.time}>{formatTime(durationSec)}</Text>
                </View>
            </View>
        </View>
    );
};

export default VideoPlayerScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    videoWrapper: { flex: 1, justifyContent: "center" },
    video: { backgroundColor: "#000" },

    overlay: {
        position: "absolute",
        alignSelf: "center"
    },

    controls: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        padding: 10
    },

    bottom: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },

    time: {
        color: "#fff",
        fontSize: 12
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000"
    }
});
